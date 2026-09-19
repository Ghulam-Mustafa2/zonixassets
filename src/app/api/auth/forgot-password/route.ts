import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("Supabase configuration is missing.");
  }

  return { url, key };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const { url, key } = getSupabaseConfig();

    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const origin = configuredSiteUrl || request.nextUrl.origin;
    const redirectTo = `${origin.replace(/\/+$/, "")}/reset-password`;

    const response = await fetch(
      `${url.replace(/\/+$/, "")}/auth/v1/recover?redirect_to=${encodeURIComponent(
        redirectTo
      )}`,
      {
        method: "POST",
        headers: {
          apikey: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("FORGOT_PASSWORD_SUPABASE_ERROR:", response.status, errorText);
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to send reset email right now." },
      { status: 500 }
    );
  }
}
