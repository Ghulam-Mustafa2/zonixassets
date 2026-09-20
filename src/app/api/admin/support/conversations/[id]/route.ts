import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  is_active?: boolean | null;
};

type ConversationRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_type: "customer" | "admin";
  sender_user_id: string | null;
  message: string;
  created_at: string;
  read_at: string | null;
};

function serviceHeaders(secret: string) {
  return {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
  };
}

async function verifyOwnerAdmin(
  request: NextRequest,
  supabaseUrl: string,
  supabasePublicKey: string
) {
  const accessToken =
    request.cookies.get("pakstore-access-token")?.value ||
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("access_token")?.value ||
    "";

  if (!accessToken) {
    return {
      ok: false as const,
      status: 401,
      error: "You must be signed in.",
    };
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: supabasePublicKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const user = await userResponse.json().catch(() => null);

  if (!userResponse.ok || !user?.id) {
    return {
      ok: false as const,
      status: 401,
      error: "Your session is invalid or expired.",
    };
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
      user.id
    )}&select=id,email,first_name,last_name,role,is_active&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: supabasePublicKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const profileData = await profileResponse.json().catch(() => null);
  const profile: ProfileRow | undefined = Array.isArray(profileData)
    ? profileData[0]
    : undefined;

  if (!profileResponse.ok || !profile) {
    return {
      ok: false as const,
      status: 403,
      error: "Unable to verify administrator account.",
    };
  }

  if (
    profile.is_active === false ||
    String(profile.role || "").toUpperCase() !== "ADMIN"
  ) {
    return {
      ok: false as const,
      status: 403,
      error: "You do not have permission to manage support conversations.",
    };
  }

  const ownerAdminUserId = process.env.OWNER_ADMIN_USER_ID?.trim();

  if (!ownerAdminUserId) {
    return {
      ok: false as const,
      status: 500,
      error: "OWNER_ADMIN_USER_ID is not configured.",
    };
  }

  if (user.id !== ownerAdminUserId) {
    return {
      ok: false as const,
      status: 403,
      error: "This store is restricted to one owner administrator.",
    };
  }

  return {
    ok: true as const,
    user,
    profile,
    accessToken,
  };
}

async function loadConversation(
  supabaseUrl: string,
  supabaseSecretKey: string,
  conversationId: string
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/support_conversations?id=eq.${encodeURIComponent(
      conversationId
    )}&select=id,user_id,subject,status,created_at,updated_at,last_message_at&limit=1`,
    {
      method: "GET",
      headers: serviceHeaders(supabaseSecretKey),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("Unable to load support conversation.");
  }

  return Array.isArray(data) && data.length > 0
    ? (data[0] as ConversationRow)
    : null;
}

async function buildConversationResponse(
  supabaseUrl: string,
  supabasePublicKey: string,
  supabaseSecretKey: string,
  accessToken: string,
  conversation: ConversationRow
) {
  const [profileResponse, messagesResponse] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        conversation.user_id
      )}&select=id,email,first_name,last_name&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabasePublicKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/support_messages?conversation_id=eq.${encodeURIComponent(
        conversation.id
      )}&select=id,conversation_id,sender_type,sender_user_id,message,created_at,read_at&order=created_at.asc&limit=500`,
      {
        method: "GET",
        headers: serviceHeaders(supabaseSecretKey),
        cache: "no-store",
      }
    ),
  ]);

  const profileData = await profileResponse.json().catch(() => null);
  const messagesData = await messagesResponse.json().catch(() => null);

  if (!profileResponse.ok || !messagesResponse.ok) {
    throw new Error("Unable to load support conversation details.");
  }

  const customer = Array.isArray(profileData)
    ? profileData[0]
    : null;

  const messages = Array.isArray(messagesData)
    ? (messagesData as MessageRow[])
    : [];

  return {
    id: conversation.id,
    status: conversation.status,
    subject: conversation.subject,
    customer: {
      id: conversation.user_id,
      email: customer?.email || "",
      firstName: customer?.first_name || "",
      lastName: customer?.last_name || "",
    },
    messages: messages.map((item) => ({
      id: item.id,
      senderType: item.sender_type,
      message: item.message,
      createdAt: item.created_at,
      readAt: item.read_at,
    })),
  };
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const conversationId = String(id || "").trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (
      !conversationId ||
      !supabaseUrl ||
      !supabasePublicKey ||
      !supabaseSecretKey
    ) {
      return NextResponse.json(
        { error: "Support conversation request is invalid." },
        { status: 400 }
      );
    }

    const auth = await verifyOwnerAdmin(
      request,
      supabaseUrl,
      supabasePublicKey
    );

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const conversation = await loadConversation(
      supabaseUrl,
      supabaseSecretKey,
      conversationId
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Support conversation was not found." },
        { status: 404 }
      );
    }

    // Opening the conversation marks customer messages as read.
    await fetch(
      `${supabaseUrl}/rest/v1/support_messages?conversation_id=eq.${encodeURIComponent(
        conversationId
      )}&sender_type=eq.customer&read_at=is.null`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...serviceHeaders(supabaseSecretKey),
        },
        body: JSON.stringify({
          read_at: new Date().toISOString(),
        }),
        cache: "no-store",
      }
    );

    const responseConversation = await buildConversationResponse(
      supabaseUrl,
      supabasePublicKey,
      supabaseSecretKey,
      auth.accessToken,
      conversation
    );

    return NextResponse.json({
      success: true,
      conversation: responseConversation,
    });
  } catch (error) {
    console.error("ADMIN_SUPPORT_DETAIL_GET_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load support conversation." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const conversationId = String(id || "").trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (
      !conversationId ||
      !supabaseUrl ||
      !supabasePublicKey ||
      !supabaseSecretKey
    ) {
      return NextResponse.json(
        { error: "Support conversation request is invalid." },
        { status: 400 }
      );
    }

    const auth = await verifyOwnerAdmin(
      request,
      supabaseUrl,
      supabasePublicKey
    );

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const conversation = await loadConversation(
      supabaseUrl,
      supabaseSecretKey,
      conversationId
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Support conversation was not found." },
        { status: 404 }
      );
    }

    if (conversation.status !== "open") {
      return NextResponse.json(
        { error: "Reopen this conversation before replying." },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Reply message is required." },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Reply message is too long." },
        { status: 400 }
      );
    }

    const messageResponse = await fetch(
      `${supabaseUrl}/rest/v1/support_messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...serviceHeaders(supabaseSecretKey),
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_type: "admin",
          sender_user_id: auth.profile.id,
          message,
          read_at: null,
        }),
        cache: "no-store",
      }
    );

    const messageData = await messageResponse.json().catch(() => null);

    if (!messageResponse.ok) {
      console.error("ADMIN_SUPPORT_REPLY_CREATE_ERROR:", messageData);

      return NextResponse.json(
        { error: "Unable to send support reply." },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    await fetch(
      `${supabaseUrl}/rest/v1/support_conversations?id=eq.${encodeURIComponent(
        conversationId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...serviceHeaders(supabaseSecretKey),
        },
        body: JSON.stringify({
          updated_at: now,
          last_message_at: now,
        }),
        cache: "no-store",
      }
    );

    const refreshedConversation =
      (await loadConversation(
        supabaseUrl,
        supabaseSecretKey,
        conversationId
      )) || conversation;

    const responseConversation = await buildConversationResponse(
      supabaseUrl,
      supabasePublicKey,
      supabaseSecretKey,
      auth.accessToken,
      refreshedConversation
    );

    return NextResponse.json(
      {
        success: true,
        conversation: responseConversation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADMIN_SUPPORT_DETAIL_POST_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to send support reply." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const conversationId = String(id || "").trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (
      !conversationId ||
      !supabaseUrl ||
      !supabasePublicKey ||
      !supabaseSecretKey
    ) {
      return NextResponse.json(
        { error: "Support conversation request is invalid." },
        { status: 400 }
      );
    }

    const auth = await verifyOwnerAdmin(
      request,
      supabaseUrl,
      supabasePublicKey
    );

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json().catch(() => null);
    const status =
      body?.status === "open" || body?.status === "closed"
        ? body.status
        : "";

    if (!status) {
      return NextResponse.json(
        { error: "Conversation status is invalid." },
        { status: 400 }
      );
    }

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/support_conversations?id=eq.${encodeURIComponent(
        conversationId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...serviceHeaders(supabaseSecretKey),
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          status,
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      }
    );

    const updateData = await updateResponse.json().catch(() => null);

    if (!updateResponse.ok) {
      console.error("ADMIN_SUPPORT_STATUS_UPDATE_ERROR:", updateData);

      return NextResponse.json(
        { error: "Unable to update support conversation." },
        { status: 500 }
      );
    }

    const conversation = Array.isArray(updateData)
      ? (updateData[0] as ConversationRow | undefined)
      : (updateData as ConversationRow | undefined);

    if (!conversation?.id) {
      return NextResponse.json(
        { error: "Support conversation was not found." },
        { status: 404 }
      );
    }

    const responseConversation = await buildConversationResponse(
      supabaseUrl,
      supabasePublicKey,
      supabaseSecretKey,
      auth.accessToken,
      conversation
    );

    return NextResponse.json({
      success: true,
      conversation: responseConversation,
    });
  } catch (error) {
    console.error("ADMIN_SUPPORT_DETAIL_PATCH_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to update support conversation." },
      { status: 500 }
    );
  }
}
