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
    String(profile.role || "").toUpperCase() !== "ADMIN" ||
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

  /*
    Single-owner protection.

    OWNER_ADMIN_USER_ID must match the one Supabase Auth user
    who owns and operates ZonixAssets. Even if another profile
    is accidentally assigned ADMIN, this route will deny it.
  */

  const ownerAdminUserId =
    process.env.OWNER_ADMIN_USER_ID?.trim();

  if (!ownerAdminUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "OWNER_ADMIN_NOT_CONFIGURED",
          error:
            "OWNER_ADMIN_USER_ID is not configured.",
        },
        {
          status: 500,
        }
      ),
    };
  }

  if (user.id !== ownerAdminUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "SINGLE_OWNER_ADMIN_ONLY",
          error:
            "This store is restricted to one owner administrator.",
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
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const auth = await getAdminAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Page ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/content_pages?id=eq.${encodeURIComponent(
        id
      )}&select=*&limit=1`,
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
        "ADMIN_CONTENT_PAGE_FETCH_ERROR:",
        data
      );

      return NextResponse.json(
        {
          error: "Unable to load content page.",
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
        : null;

    if (!page) {
      return NextResponse.json(
        {
          error: "Content page not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error(
      "ADMIN_CONTENT_PAGE_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load content page.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const auth = await getAdminAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Page ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as ContentPagePayload;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.slug === "string") {
      const slug = body.slug
        .trim()
        .toLowerCase();

      if (!slug) {
        return NextResponse.json(
          {
            error: "Slug cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      updatePayload.slug = slug;
    }

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return NextResponse.json(
          {
            error: "Title cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      updatePayload.title = title;
    }

    if (body.subtitle !== undefined) {
      updatePayload.subtitle =
        typeof body.subtitle === "string"
          ? body.subtitle.trim() || null
          : null;
    }

    if (typeof body.content === "string") {
      updatePayload.content = body.content;
    }

    if (typeof body.is_published === "boolean") {
      updatePayload.is_published =
        body.is_published;
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json(
        {
          error: "No changes were provided.",
        },
        {
          status: 400,
        }
      );
    }

    if (typeof updatePayload.slug === "string") {
      const duplicateResponse = await fetch(
        `${auth.supabaseUrl}/rest/v1/content_pages?slug=eq.${encodeURIComponent(
          updatePayload.slug
        )}&id=neq.${encodeURIComponent(
          id
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
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/content_pages?id=eq.${encodeURIComponent(
        id
      )}`,
      {
        method: "PATCH",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => null);

      console.error(
        "ADMIN_CONTENT_PAGE_UPDATE_ERROR:",
        errorBody
      );

      return NextResponse.json(
        {
          error:
            errorBody?.message ||
            "Unable to update content page.",
          details: errorBody,
        },
        {
          status: response.status,
        }
      );
    }

    const updatedResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/content_pages?id=eq.${encodeURIComponent(
        id
      )}&select=*&limit=1`,
      {
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const updatedData = await updatedResponse
      .json()
      .catch(() => null);

    const page =
      Array.isArray(updatedData) &&
      updatedData.length > 0
        ? updatedData[0]
        : null;

    if (!updatedResponse.ok || !page) {
      return NextResponse.json(
        {
          error:
            "Page updated but updated record could not be loaded.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      page,
      message:
        "Content page updated successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN_CONTENT_PAGE_PATCH_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update content page.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const auth = await getAdminAuth(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Page ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/content_pages?id=eq.${encodeURIComponent(
        id
      )}`,
      {
        method: "DELETE",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
          Prefer: "return=minimal",
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => null);

      console.error(
        "ADMIN_CONTENT_PAGE_DELETE_ERROR:",
        errorBody
      );

      return NextResponse.json(
        {
          error:
            errorBody?.message ||
            "Unable to delete content page.",
          details: errorBody,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Content page deleted successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN_CONTENT_PAGE_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete content page.",
      },
      {
        status: 500,
      }
    );
  }
}
