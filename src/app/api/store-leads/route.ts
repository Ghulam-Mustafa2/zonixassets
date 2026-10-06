import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serviceHeaders(secretKey: string): Record<string, string> {
  if (secretKey.startsWith("sb_secret_")) {
    return {
      apikey: secretKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeWhatsApp(value: string) {
  return value.replace(/[^\d+]/g, "").slice(0, 24);
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead capture is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const name = clean(body.name, 120);
    const email = clean(body.email, 180).toLowerCase();
    const whatsapp = normalizeWhatsApp(clean(body.whatsapp, 40));
    const interest = clean(body.interest, 300);
    const lastMessage = clean(body.lastMessage, 1000);
    const consent = body.consent === true;
    const website = clean(body.website, 200);

    // Honeypot field: real visitors never fill this.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!consent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please confirm that ZonixAssets may use your details to follow up about your enquiry.",
        },
        { status: 400 }
      );
    }

    if (!email && !whatsapp) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide an email address or WhatsApp number.",
        },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (whatsapp && whatsapp.replace(/\D/g, "").length < 7) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid WhatsApp number.",
        },
        { status: 400 }
      );
    }

    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) && typeof item === "object"
          )
          .slice(-8)
          .map((item) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: clean(item.content, 700),
          }))
          .filter((item) => item.content)
      : [];

    const payload = {
      name: name || null,
      email: email || null,
      whatsapp: whatsapp || null,
      interest: interest || null,
      source: "store_chat",
      status: "new",
      consent_text:
        "Visitor explicitly agreed that ZonixAssets may use these contact details to follow up about this enquiry.",
      last_message: lastMessage || null,
      conversation_excerpt: messages,
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_leads`,
      {
        method: "POST",
        headers: serviceHeaders(secretKey),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("STORE_LEAD_SAVE_ERROR:", data);

      const message =
        typeof data?.message === "string" &&
        data.message.includes("relation") &&
        data.message.includes("ai_leads")
          ? "Lead database is not ready yet. Run supabase/ai_leads.sql in Supabase SQL Editor."
          : "Unable to save your details right now.";

      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Thanks! Your details have been saved. ZonixAssets can follow up about your enquiry.",
    });
  } catch (error) {
    console.error("STORE_LEAD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save your details right now.",
      },
      { status: 500 }
    );
  }
}
