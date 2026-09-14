import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";

type JsonRecord = Record<string, unknown>;

type Section =
  | "site"
  | "homepage"
  | "social"
  | "offer"
  | "banner";

const allowedFields: Record<
  Section,
  string[]
> = {
  site: [
    "site_name",
    "logo_url",
    "tagline",
    "homepage_heading",
    "homepage_subheading",
    "homepage_primary_button_text",
    "homepage_primary_button_url",
    "footer_text",
  ],

  homepage: [
    "featured_products_enabled",
    "featured_products_title",
    "featured_products_subtitle",
    "featured_products_limit",
    "featured_products_auto_scroll",
    "featured_products_scroll_speed",
    "offers_enabled",
    "promotion_banner_enabled",
    "categories_title",
    "categories_subtitle",
  ],

  social: [
    "platform",
    "label",
    "url",
    "icon_key",
    "is_visible",
    "sort_order",
  ],

  offer: [
    "title",
    "description",
    "badge_text",
    "discount_text",
    "coupon_code",
    "button_text",
    "button_url",
    "starts_at",
    "ends_at",
    "is_active",
    "sort_order",
  ],

  banner: [
    "title",
    "description",
    "image_url",
    "button_text",
    "target_url",
    "open_in_new_tab",
    "is_active",
    "sort_order",
  ],
};

const tableBySection: Record<
  Section,
  string
> = {
  site: "site_settings",
  homepage: "homepage_settings",
  social: "social_links",
  offer: "offers",
  banner: "promotion_banners",
};

function filterAllowedFields(
  section: Section,
  source: unknown
) {
  const input =
    source &&
    typeof source === "object"
      ? (source as JsonRecord)
      : {};

  const result: JsonRecord = {};

  for (const field of allowedFields[
    section
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(
        input,
        field
      )
    ) {
      result[field] =
        input[field];
    }
  }

  return result;
}

function clearAuthCookies(
  response: NextResponse
) {
  for (const name of [
    "pakstore-access-token",
    "pakstore-refresh-token",
  ]) {
    response.cookies.set(
      name,
      "",
      {
        httpOnly: true,
        secure:
          process.env
            .NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }
    );
  }
}

async function requireActiveAdmin() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Supabase environment variables are missing.",
          },
          {
            status: 500,
          }
        ),
    };
  }

  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      "pakstore-access-token"
    )?.value;

  if (!accessToken) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "You must be signed in.",
          },
          {
            status: 401,
          }
        ),
    };
  }

  const userResponse =
    await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey:
            supabaseKey,
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

  const user =
    await userResponse.json();

  if (
    !userResponse.ok ||
    !user?.id
  ) {
    const response =
      NextResponse.json(
        {
          error:
            "Your session is invalid or expired.",
        },
        {
          status: 401,
        }
      );

    clearAuthCookies(
      response
    );

    return {
      error: response,
    };
  }

  const profileResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        user.id
      )}&select=id,role,is_active`,
      {
        headers: {
          apikey:
            supabaseKey,
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

  const profileData =
    await profileResponse.json();

  if (
    !profileResponse.ok
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              profileData?.message ||
              "Unable to verify administrator account.",
          },
          {
            status:
              profileResponse.status ||
              500,
          }
        ),
    };
  }

  const profile =
    Array.isArray(
      profileData
    )
      ? profileData[0]
      : null;

  if (!profile) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Administrator profile not found.",
          },
          {
            status: 404,
          }
        ),
    };
  }

  if (
    profile.is_active ===
    false
  ) {
    const response =
      NextResponse.json(
        {
          code:
            "ACCOUNT_SUSPENDED",
          error:
            "Your administrator account has been suspended.",
        },
        {
          status: 403,
        }
      );

    clearAuthCookies(
      response
    );

    return {
      error: response,
    };
  }

  if (
    String(
      profile.role || ""
    ).toUpperCase() !==
    "ADMIN"
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "You do not have permission to manage site settings.",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    supabaseUrl,
    supabaseKey,
    accessToken,
    user,
  };
}

async function restFetch(
  url: string,
  accessToken: string,
  supabaseKey: string,
  init: RequestInit = {}
) {
  return fetch(
    url,
    {
      ...init,
      headers: {
        apikey: supabaseKey,
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
        ...(init.headers ||
          {}),
      },
      cache: "no-store",
    }
  );
}

export async function GET() {
  try {
    const auth =
      await requireActiveAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const {
      supabaseUrl,
      supabaseKey,
      accessToken,
    } = auth;

    const [
      siteResponse,
      homepageResponse,
      socialsResponse,
      offersResponse,
      bannersResponse,
    ] = await Promise.all([
      restFetch(
        `${supabaseUrl}/rest/v1/site_settings?select=*&limit=1`,
        accessToken,
        supabaseKey
      ),

      restFetch(
        `${supabaseUrl}/rest/v1/homepage_settings?select=*&limit=1`,
        accessToken,
        supabaseKey
      ),

      restFetch(
        `${supabaseUrl}/rest/v1/social_links?select=*&order=sort_order.asc,created_at.asc`,
        accessToken,
        supabaseKey
      ),

      restFetch(
        `${supabaseUrl}/rest/v1/offers?select=*&order=sort_order.asc,created_at.desc`,
        accessToken,
        supabaseKey
      ),

      restFetch(
        `${supabaseUrl}/rest/v1/promotion_banners?select=*&order=sort_order.asc,created_at.desc`,
        accessToken,
        supabaseKey
      ),
    ]);

    const [
      siteData,
      homepageData,
      socialsData,
      offersData,
      bannersData,
    ] = await Promise.all([
      siteResponse.json(),
      homepageResponse.json(),
      socialsResponse.json(),
      offersResponse.json(),
      bannersResponse.json(),
    ]);

    const checks = [
      [
        siteResponse,
        siteData,
        "site settings",
      ],
      [
        homepageResponse,
        homepageData,
        "homepage settings",
      ],
      [
        socialsResponse,
        socialsData,
        "social links",
      ],
      [
        offersResponse,
        offersData,
        "offers",
      ],
      [
        bannersResponse,
        bannersData,
        "promotion banners",
      ],
    ] as const;

    for (const [
      response,
      body,
      label,
    ] of checks) {
      if (!response.ok) {
        return NextResponse.json(
          {
            error:
              body?.message ||
              `Unable to load ${label}.`,
          },
          {
            status:
              response.status ||
              500,
          }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        site:
          Array.isArray(
            siteData
          )
            ? siteData[0] ||
              null
            : null,
        homepage:
          Array.isArray(
            homepageData
          )
            ? homepageData[0] ||
              null
            : null,
        socialLinks:
          Array.isArray(
            socialsData
          )
            ? socialsData
            : [],
        offers:
          Array.isArray(
            offersData
          )
            ? offersData
            : [],
        promotionBanners:
          Array.isArray(
            bannersData
          )
            ? bannersData
            : [],
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_SITE_SETTINGS_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading site settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const auth =
      await requireActiveAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body =
      (await request.json()) as {
        section?: Section;
        id?: string;
        data?: unknown;
      };

    const section =
      body.section;

    if (
      !section ||
      !tableBySection[
        section
      ]
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid settings section.",
        },
        {
          status: 400,
        }
      );
    }

    const payload =
      filterAllowedFields(
        section,
        body.data
      );

    if (
      Object.keys(
        payload
      ).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No valid fields were provided.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      section ===
        "homepage" &&
      typeof payload.featured_products_limit ===
        "number"
    ) {
      payload.featured_products_limit =
        Math.min(
          30,
          Math.max(
            1,
            payload.featured_products_limit as number
          )
        );
    }

    if (
      section ===
        "homepage" &&
      typeof payload.featured_products_scroll_speed ===
        "number"
    ) {
      payload.featured_products_scroll_speed =
        Math.min(
          120,
          Math.max(
            5,
            payload.featured_products_scroll_speed as number
          )
        );
    }

    const {
      supabaseUrl,
      supabaseKey,
      accessToken,
    } = auth;

    const table =
      tableBySection[
        section
      ];

    let filter =
      "";

    if (
      section ===
        "site" ||
      section ===
        "homepage"
    ) {
      const existingResponse =
        await restFetch(
          `${supabaseUrl}/rest/v1/${table}?select=id&limit=1`,
          accessToken,
          supabaseKey
        );

      const existing =
        await existingResponse.json();

      if (
        !existingResponse.ok
      ) {
        return NextResponse.json(
          {
            error:
              existing?.message ||
              "Unable to find settings row.",
          },
          {
            status:
              existingResponse.status ||
              500,
          }
        );
      }

      const id =
        Array.isArray(
          existing
        )
          ? existing[0]?.id
          : null;

      if (!id) {
        return NextResponse.json(
          {
            error:
              "Settings row not found.",
          },
          {
            status: 404,
          }
        );
      }

      filter =
        `id=eq.${encodeURIComponent(
          id
        )}`;
    } else {
      if (!body.id) {
        return NextResponse.json(
          {
            error:
              "Record ID is required.",
          },
          {
            status: 400,
          }
        );
      }

      filter =
        `id=eq.${encodeURIComponent(
          body.id
        )}`;
    }

    const response =
      await restFetch(
        `${supabaseUrl}/rest/v1/${table}?${filter}`,
        accessToken,
        supabaseKey,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=representation",
          },
          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            result?.message ||
            "Unable to update settings.",
        },
        {
          status:
            response.status ||
            500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Settings updated successfully.",
        record:
          Array.isArray(
            result
          )
            ? result[0] ||
              null
            : result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_SITE_SETTINGS_PATCH_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating settings.",
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
    const auth =
      await requireActiveAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body =
      (await request.json()) as {
        section?: Section;
        data?: unknown;
      };

    const section =
      body.section;

    if (
      !section ||
      ![
        "social",
        "offer",
        "banner",
      ].includes(
        section
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This section does not support creating new records.",
        },
        {
          status: 400,
        }
      );
    }

    const payload =
      filterAllowedFields(
        section,
        body.data
      );

    if (
      Object.keys(
        payload
      ).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No valid fields were provided.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      section ===
        "social" &&
      (!payload.platform ||
        !payload.url)
    ) {
      return NextResponse.json(
        {
          error:
            "Platform and URL are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      (section ===
        "offer" ||
        section ===
          "banner") &&
      !payload.title
    ) {
      return NextResponse.json(
        {
          error:
            "Title is required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      supabaseUrl,
      supabaseKey,
      accessToken,
    } = auth;

    const table =
      tableBySection[
        section
      ];

    const response =
      await restFetch(
        `${supabaseUrl}/rest/v1/${table}`,
        accessToken,
        supabaseKey,
        {
          method: "POST",
          headers: {
            Prefer:
              "return=representation",
          },
          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            result?.message ||
            "Unable to create record.",
        },
        {
          status:
            response.status ||
            500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Record created successfully.",
        record:
          Array.isArray(
            result
          )
            ? result[0] ||
              null
            : result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_SITE_SETTINGS_POST_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the record.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth =
      await requireActiveAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const section =
      request.nextUrl.searchParams.get(
        "section"
      ) as Section | null;

    const id =
      request.nextUrl.searchParams.get(
        "id"
      );

    if (
      !section ||
      ![
        "social",
        "offer",
        "banner",
      ].includes(
        section
      ) ||
      !id
    ) {
      return NextResponse.json(
        {
          error:
            "Valid section and record ID are required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      supabaseUrl,
      supabaseKey,
      accessToken,
    } = auth;

    const table =
      tableBySection[
        section
      ];

    const response =
      await restFetch(
        `${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(
          id
        )}`,
        accessToken,
        supabaseKey,
        {
          method: "DELETE",
          headers: {
            Prefer:
              "return=minimal",
          },
        }
      );

    if (!response.ok) {
      const result =
        await response.json();

      return NextResponse.json(
        {
          error:
            result?.message ||
            "Unable to delete record.",
        },
        {
          status:
            response.status ||
            500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Record deleted successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_SITE_SETTINGS_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while deleting the record.",
      },
      {
        status: 500,
      }
    );
  }
}
