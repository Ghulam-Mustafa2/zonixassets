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

    const accessToken =
      typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";
    const confirmPassword =
      typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has expired." },
        { status: 401 }
      );
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      return NextResponse.json(
        { error: "Password must be between 8 and 72 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirm password do not match." },
        { status: 400 }
      );
    }

    const { url, key } = getSupabaseConfig();

    const response = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        payload?.msg ||
        payload?.message ||
        payload?.error_description ||
        "Unable to update your password.";

      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { error: "Unable to update your password right now." },
      { status: 500 }
    );
  }
}
