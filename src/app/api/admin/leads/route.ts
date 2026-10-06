import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serviceHeaders(secretKey: string): Record<string, string> {
  if (secretKey.startsWith("sb_secret_")) {
    return {
      apikey: secretKey,
      "Content-Type": "application/json",
    };
  }

  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

async function getAdminAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !publicKey || !secretKey) {
    return {
      ok: false as const,
      status: 500,
      error: "Supabase configuration is incomplete.",
    };
  }

  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("pakstore-access-token")?.value ||
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("access_token")?.value ||
    "";

  if (!accessToken) {
    return {
      ok: false as const,
      status: 401,
      error: "You must be signed in.",
    };
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: publicKey,
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

  const ownerId = process.env.OWNER_ADMIN_USER_ID?.trim();

  if (!ownerId || String(user.id) !== ownerId) {
    return {
      ok: false as const,
      status: 403,
      error: "This admin area is restricted to the store owner.",
    };
  }

  return {
    ok: true as const,
    supabaseUrl,
    secretKey,
  };
}

export async function GET() {
  const auth = await getAdminAuth();

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const response = await fetch(
    `${auth.supabaseUrl}/rest/v1/ai_leads?select=*&order=created_at.desc&limit=500`,
    {
      headers: serviceHeaders(auth.secretKey),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string" &&
      data.message.includes("ai_leads")
        ? "Lead database is not ready. Run supabase/ai_leads.sql in Supabase SQL Editor."
        : data?.message || "Unable to load leads.";

    return NextResponse.json(
      { error: message },
      { status: response.status || 500 }
    );
  }

  return NextResponse.json({
    success: true,
    leads: Array.isArray(data) ? data : [],
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAdminAuth();

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const body = (await request.json()) as {
    id?: string;
    status?: string;
    adminNotes?: string;
  };

  const id = String(body.id || "").trim();
  const status = String(body.status || "").trim().toLowerCase();
  const adminNotes =
    typeof body.adminNotes === "string"
      ? body.adminNotes.trim().slice(0, 2000)
      : "";

  const allowedStatuses = new Set([
    "new",
    "contacted",
    "qualified",
    "won",
    "closed",
  ]);

  if (!id) {
    return NextResponse.json(
      { error: "Lead id is required." },
      { status: 400 }
    );
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json(
      { error: "Invalid lead status." },
      { status: 400 }
    );
  }

  const response = await fetch(
    `${auth.supabaseUrl}/rest/v1/ai_leads?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        ...serviceHeaders(auth.secretKey),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        error: data?.message || "Unable to update lead.",
      },
      { status: response.status || 500 }
    );
  }

  return NextResponse.json({
    success: true,
    lead: Array.isArray(data) ? data[0] || null : null,
  });
}
