import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupportConversationRow = {
  id: string;
  user_id: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

type SupportMessageRow = {
  id: string;
  conversation_id: string;
  sender_type: "customer" | "admin";
  sender_user_id: string | null;
  message: string;
  created_at: string;
};

type CustomerProfileRow = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

function serviceHeaders(secret: string) {
  return {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
  };
}

function getAccessToken(request: NextRequest) {
  return (
    request.cookies.get("pakstore-access-token")?.value ||
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("access_token")?.value ||
    ""
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getCurrentUser(
  request: NextRequest,
  supabaseUrl: string,
  supabasePublicKey: string
) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return {
      ok: false as const,
      status: 401,
      error: "You must be signed in to use live support.",
    };
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: supabasePublicKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const user = await response.json().catch(() => null);

  if (!response.ok || !user?.id) {
    return {
      ok: false as const,
      status: 401,
      error: "Your session is invalid or expired.",
    };
  }

  return {
    ok: true as const,
    user,
    accessToken,
  };
}

async function loadCustomerProfile(
  supabaseUrl: string,
  supabasePublicKey: string,
  accessToken: string,
  userId: string
) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        userId
      )}&select=email,first_name,last_name&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabasePublicKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("SUPPORT_PROFILE_LOAD_ERROR:", data);
      return null;
    }

    return Array.isArray(data) && data.length > 0
      ? (data[0] as CustomerProfileRow)
      : null;
  } catch (error) {
    console.error("SUPPORT_PROFILE_LOAD_ERROR:", error);
    return null;
  }
}

async function loadOpenConversation(
  supabaseUrl: string,
  supabaseSecretKey: string,
  userId: string
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/support_conversations?user_id=eq.${encodeURIComponent(
      userId
    )}&status=eq.open&select=id,user_id,status,created_at,updated_at,last_message_at&order=last_message_at.desc&limit=1`,
    {
      method: "GET",
      headers: serviceHeaders(supabaseSecretKey),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Unable to load support conversation.");
  }

  return Array.isArray(data) && data.length > 0
    ? (data[0] as SupportConversationRow)
    : null;
}

async function loadMessages(
  supabaseUrl: string,
  supabaseSecretKey: string,
  conversationId: string
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/support_messages?conversation_id=eq.${encodeURIComponent(
      conversationId
    )}&select=id,conversation_id,sender_type,sender_user_id,message,created_at&order=created_at.asc&limit=200`,
    {
      method: "GET",
      headers: serviceHeaders(supabaseSecretKey),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Unable to load support messages.");
  }

  const rows = Array.isArray(data) ? (data as SupportMessageRow[]) : [];

  return rows.map((row) => ({
    id: row.id,
    senderType: row.sender_type,
    message: row.message,
    createdAt: row.created_at,
  }));
}

async function sendOwnerEmailNotification(args: {
  customerName: string;
  customerEmail: string;
  message: string;
  conversationId: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const supportNotificationEmail =
    process.env.SUPPORT_NOTIFICATION_EMAIL?.trim();

  if (!resendApiKey || !supportNotificationEmail) {
    console.warn(
      "SUPPORT_EMAIL_NOTIFICATION_SKIPPED: RESEND_API_KEY or SUPPORT_NOTIFICATION_EMAIL is missing."
    );
    return;
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "ZonixAssets Support <onboarding@resend.dev>";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, "") ||
    "https://zonixassets.shop";

  const adminSupportUrl = `${siteUrl}/admin/support`;

  const safeName = escapeHtml(args.customerName || "Customer");
  const safeEmail = escapeHtml(args.customerEmail || "Unknown email");
  const safeMessage = escapeHtml(args.message).replaceAll("\n", "<br />");
  const safeConversationId = escapeHtml(args.conversationId);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [supportNotificationEmail],
        subject: `New ZonixAssets support message from ${args.customerName || args.customerEmail || "customer"}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
            <div style="background:#0b1220;color:#fff;border-radius:18px;padding:22px 24px;">
              <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#fb923c;font-weight:700;">
                ZonixAssets Live Support
              </div>
              <h1 style="font-size:24px;line-height:1.2;margin:10px 0 4px;">
                New customer message
              </h1>
              <p style="margin:0;color:#cbd5e1;font-size:14px;">
                A customer has started or continued a live support conversation.
              </p>
            </div>

            <div style="padding:24px 4px;">
              <p style="margin:0 0 8px;font-size:14px;">
                <strong>Customer:</strong> ${safeName}
              </p>
              <p style="margin:0 0 8px;font-size:14px;">
                <strong>Email:</strong> ${safeEmail}
              </p>
              <p style="margin:0 0 18px;font-size:14px;">
                <strong>Conversation ID:</strong> ${safeConversationId}
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;font-size:15px;line-height:1.6;">
                ${safeMessage}
              </div>

              <div style="margin-top:24px;">
                <a
                  href="${adminSupportUrl}"
                  style="display:inline-block;background:#ff6b13;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;"
                >
                  Open Support Inbox
                </a>
              </div>
            </div>
          </div>
        `,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("SUPPORT_EMAIL_NOTIFICATION_ERROR:", data);
      return;
    }

    console.log("SUPPORT_EMAIL_NOTIFICATION_SENT:", data?.id || "sent");
  } catch (error) {
    console.error("SUPPORT_EMAIL_NOTIFICATION_ERROR:", error);
  }
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
        { error: "Support chat configuration is incomplete." },
        { status: 500 }
      );
    }

    const auth = await getCurrentUser(
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

    const conversation = await loadOpenConversation(
      supabaseUrl,
      supabaseSecretKey,
      auth.user.id
    );

    if (!conversation) {
      return NextResponse.json({
        success: true,
        conversation: null,
        messages: [],
      });
    }

    const messages = await loadMessages(
      supabaseUrl,
      supabaseSecretKey,
      conversation.id
    );

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        status: conversation.status,
      },
      messages,
    });
  } catch (error) {
    console.error("SUPPORT_CHAT_GET_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load support chat." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabasePublicKey || !supabaseSecretKey) {
      return NextResponse.json(
        { error: "Support chat configuration is incomplete." },
        { status: 500 }
      );
    }

    const auth = await getCurrentUser(
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

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 }
      );
    }

    let conversation = await loadOpenConversation(
      supabaseUrl,
      supabaseSecretKey,
      auth.user.id
    );

    if (!conversation) {
      const createConversationResponse = await fetch(
        `${supabaseUrl}/rest/v1/support_conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...serviceHeaders(supabaseSecretKey),
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            user_id: auth.user.id,
            status: "open",
            subject: "Live support",
            last_message_at: new Date().toISOString(),
          }),
          cache: "no-store",
        }
      );

      const createdConversationData =
        await createConversationResponse.json().catch(() => null);

      if (!createConversationResponse.ok) {
        console.error(
          "SUPPORT_CONVERSATION_CREATE_ERROR:",
          createdConversationData
        );

        return NextResponse.json(
          { error: "Unable to start support conversation." },
          { status: 500 }
        );
      }

      conversation = Array.isArray(createdConversationData)
        ? (createdConversationData[0] as SupportConversationRow)
        : (createdConversationData as SupportConversationRow);
    }

    if (!conversation?.id) {
      return NextResponse.json(
        { error: "Support conversation could not be created." },
        { status: 500 }
      );
    }

    if (conversation.status !== "open") {
      return NextResponse.json(
        { error: "This support conversation is closed." },
        { status: 409 }
      );
    }

    const createMessageResponse = await fetch(
      `${supabaseUrl}/rest/v1/support_messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...serviceHeaders(supabaseSecretKey),
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_type: "customer",
          sender_user_id: auth.user.id,
          message,
        }),
        cache: "no-store",
      }
    );

    const createdMessageData =
      await createMessageResponse.json().catch(() => null);

    if (!createMessageResponse.ok) {
      console.error(
        "SUPPORT_MESSAGE_CREATE_ERROR:",
        createdMessageData
      );

      return NextResponse.json(
        { error: "Unable to send support message." },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    await fetch(
      `${supabaseUrl}/rest/v1/support_conversations?id=eq.${encodeURIComponent(
        conversation.id
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

    /*
      Email notification is intentionally non-blocking for the chat flow:
      if Resend fails, the customer message still remains saved successfully.
    */
    const customerProfile = await loadCustomerProfile(
      supabaseUrl,
      supabasePublicKey,
      auth.accessToken,
      auth.user.id
    );

    const customerName =
      `${customerProfile?.first_name || ""} ${
        customerProfile?.last_name || ""
      }`.trim() ||
      auth.user.email ||
      "Customer";

    const customerEmail =
      customerProfile?.email ||
      auth.user.email ||
      "Unknown";

    await sendOwnerEmailNotification({
      customerName,
      customerEmail,
      message,
      conversationId: conversation.id,
    });

    const messages = await loadMessages(
      supabaseUrl,
      supabaseSecretKey,
      conversation.id
    );

    return NextResponse.json(
      {
        success: true,
        conversation: {
          id: conversation.id,
          status: "open",
        },
        messages,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SUPPORT_CHAT_POST_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to send support message." },
      { status: 500 }
    );
  }
}
