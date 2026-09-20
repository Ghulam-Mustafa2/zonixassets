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

  if (!profileResponse.ok) {
    return {
      ok: false as const,
      status: 500,
      error: "Unable to verify administrator account.",
    };
  }

  const profile: ProfileRow | undefined = Array.isArray(profileData)
    ? profileData[0]
    : undefined;

  if (!profile) {
    return {
      ok: false as const,
      status: 404,
      error: "Administrator profile was not found.",
    };
  }

  if (profile.is_active === false) {
    return {
      ok: false as const,
      status: 403,
      error: "Your administrator account has been suspended.",
    };
  }

  if (String(profile.role || "").toUpperCase() !== "ADMIN") {
    return {
      ok: false as const,
      status: 403,
      error: "You do not have permission to access support conversations.",
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

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabasePublicKey || !supabaseSecretKey) {
      return NextResponse.json(
        { error: "Support admin configuration is incomplete." },
        { status: 500 }
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

    const conversationsResponse = await fetch(
      `${supabaseUrl}/rest/v1/support_conversations?select=id,user_id,subject,status,created_at,updated_at,last_message_at&order=last_message_at.desc&limit=200`,
      {
        method: "GET",
        headers: serviceHeaders(supabaseSecretKey),
        cache: "no-store",
      }
    );

    const conversationsData =
      await conversationsResponse.json().catch(() => null);

    if (!conversationsResponse.ok) {
      console.error(
        "ADMIN_SUPPORT_CONVERSATIONS_LOAD_ERROR:",
        conversationsData
      );

      return NextResponse.json(
        { error: "Unable to load support conversations." },
        { status: 500 }
      );
    }

    const conversations = Array.isArray(conversationsData)
      ? (conversationsData as ConversationRow[])
      : [];

    if (conversations.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
      });
    }

    const userIds = [...new Set(conversations.map((item) => item.user_id))];
    const conversationIds = conversations.map((item) => item.id);

    const userFilter = userIds.map((id) => `"${id}"`).join(",");
    const conversationFilter = conversationIds.map((id) => `"${id}"`).join(",");

    const [profilesResponse, messagesResponse] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/profiles?id=in.(${encodeURIComponent(
          userFilter
        )})&select=id,email,first_name,last_name`,
        {
          method: "GET",
          headers: {
            apikey: supabasePublicKey,
            Authorization: `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/support_messages?conversation_id=in.(${encodeURIComponent(
          conversationFilter
        )})&select=id,conversation_id,sender_type,message,created_at,read_at&order=created_at.asc&limit=5000`,
        {
          method: "GET",
          headers: serviceHeaders(supabaseSecretKey),
          cache: "no-store",
        }
      ),
    ]);

    const profilesData = await profilesResponse.json().catch(() => null);
    const messagesData = await messagesResponse.json().catch(() => null);

    if (!profilesResponse.ok || !messagesResponse.ok) {
      console.error("ADMIN_SUPPORT_RELATED_DATA_ERROR:", {
        profilesData,
        messagesData,
      });

      return NextResponse.json(
        { error: "Unable to load support conversation details." },
        { status: 500 }
      );
    }

    const profiles = Array.isArray(profilesData)
      ? (profilesData as Array<{
          id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
        }>)
      : [];

    const messages = Array.isArray(messagesData)
      ? (messagesData as MessageRow[])
      : [];

    const responseRows = conversations.map((conversation) => {
      const profile = profiles.find((item) => item.id === conversation.user_id);

      const conversationMessages = messages.filter(
        (item) => item.conversation_id === conversation.id
      );

      const latestMessage =
        conversationMessages.length > 0
          ? conversationMessages[conversationMessages.length - 1]
          : null;

      const unreadCustomerMessages = conversationMessages.filter(
        (item) =>
          item.sender_type === "customer" &&
          !item.read_at
      ).length;

      return {
        id: conversation.id,
        userId: conversation.user_id,
        status: conversation.status,
        subject: conversation.subject,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        lastMessageAt: conversation.last_message_at,
        customer: {
          email: profile?.email || "",
          firstName: profile?.first_name || "",
          lastName: profile?.last_name || "",
        },
        latestMessage: latestMessage
          ? {
              message: latestMessage.message,
              senderType: latestMessage.sender_type,
              createdAt: latestMessage.created_at,
            }
          : null,
        unreadCustomerMessages,
      };
    });

    return NextResponse.json({
      success: true,
      conversations: responseRows,
    });
  } catch (error) {
    console.error("ADMIN_SUPPORT_CONVERSATIONS_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load support conversations." },
      { status: 500 }
    );
  }
}
