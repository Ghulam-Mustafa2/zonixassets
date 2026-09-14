import { NextRequest, NextResponse } from "next/server";

type ContentPagePayload = {
  slug?: string;
  title?: string;
  subtitle?: string | null;
  content?: string;
  is_published?: boolean;
};

type AdminAuthSuccess = {
  ok: true;
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
};

type AdminAuthFailure = {
  ok: false;
  response: NextResponse;
};

type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

async function getAdminAuth(
  request: NextRequest
): Promise<AdminAuthResult> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Supabase is not configured.",
        },
        {
          status: 500,
        }
      ),
    };
  }

  const accessToken =
    request.cookies.get("pakstore-access-token")?.value ||
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Not authenticated.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const userResponse = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!userResponse.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Invalid session.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const user = await userResponse.json();

  if (!user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unable to identify authenticated user.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
      user.id
    )}&select=id,role,is_active&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const profiles = await profileResponse
    .json()
    .catch(() => null);

  if (!profileResponse.ok) {
    console.error(
      "ADMIN_PROFILE_FETCH_ERROR:",
      profiles
    );

    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unable to verify admin account.",
        },
        {
          status: profileResponse.status,
        }
      ),
    };
  }

  const profile =
    Array.isArray(profiles) && profiles.length > 0
      ? profiles[0]
      : null;

  if (
    !profile ||
    profile.role !== "ADMIN" ||
    profile.is_active === false
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    ok: true,
    supabaseUrl,
    supabaseKey,
    accessToken,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const auth = await getAdminAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/content_pages?select=*&order=created_at.asc`,
      {
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      console.error(
        "ADMIN_CONTENT_PAGES_FETCH_ERROR:",
        data
      );

      return NextResponse.json(
        {
          error: "Unable to load content pages.",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      pages: Array.isArray(data)
        ? data
        : [],
    });
  } catch (error) {
    console.error(
      "ADMIN_CONTENT_PAGES_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load content pages.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const auth = await getAdminAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const body =
      (await request.json()) as ContentPagePayload;

    const slug = body.slug
      ?.trim()
      .toLowerCase();

    const title = body.title?.trim();

    if (!slug || !title) {
      return NextResponse.json(
        {
          error: "Slug and title are required.",
        },
        {
          status: 400,
        }
      );
    }

    const duplicateResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/content_pages?slug=eq.${encodeURIComponent(
        slug
      )}&select=id,slug&limit=1`,
      {
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const duplicateData =
      await duplicateResponse
        .json()
        .catch(() => null);

    if (!duplicateResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Unable to validate page slug.",
          details: duplicateData,
        },
        {
          status: duplicateResponse.status,
        }
      );
    }

    if (
      Array.isArray(duplicateData) &&
      duplicateData.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "A content page with this slug already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const payload = {
      slug,
      title,
      subtitle:
        body.subtitle?.trim() || null,
      content:
        typeof body.content === "string"
          ? body.content
          : "",
      is_published:
        typeof body.is_published === "boolean"
          ? body.is_published
          : true,
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/content_pages`,
      {
        method: "POST",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      console.error(
        "ADMIN_CONTENT_PAGE_CREATE_ERROR:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.message ||
            "Unable to create page.",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    const page =
      Array.isArray(data) && data.length > 0
        ? data[0]
        : data;

    return NextResponse.json(
      {
        success: true,
        page,
        message:
          "Content page created successfully.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_CONTENT_PAGE_POST_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create content page.",
      },
      {
        status: 500,
      }
    );
  }
}
