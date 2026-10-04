import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RentalRow = {
  id: string;
  user_id: string;
  order_item_id: string;
  product_id: string | null;
  business_name: string | null;
  website_url: string | null;
  logo_url: string | null;
  brand_color: string | null;
  allowed_origin: string | null;
  welcome_message: string | null;
  system_prompt: string | null;
  lead_capture_enabled: boolean;
  lead_goal: string | null;
  monthly_quota: number;
  status: string;
  gm_client_name: string | null;
  gm_client_slug: string | null;
  gm_api_key: string | null;
  gm_embed_code: string | null;
  gm_api_endpoint: string | null;
  expires_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

async function getAdminAuth() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const secretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (
    !supabaseUrl ||
    !publicKey ||
    !secretKey
  ) {
    return {
      error:
        "Supabase configuration is incomplete.",
      status: 500,
      supabaseUrl: null,
      publicKey: null,
      accessToken: null,
      userId: null,
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
        "You must be signed in.",
      status: 401,
      supabaseUrl,
      publicKey,
      secretKey,
      accessToken: null,
      userId: null,
    };
  }

  const userResponse =
    await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey:
            publicKey,
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache:
          "no-store",
      }
    );

  const user =
    await userResponse.json();

  if (
    !userResponse.ok ||
    !user?.id
  ) {
    return {
      error:
        "Your session is invalid or expired.",
      status: 401,
      supabaseUrl,
      publicKey,
      secretKey,
      accessToken,
      userId: null,
    };
  }

  const ownerId =
    process.env.OWNER_ADMIN_USER_ID?.trim();

  if (
    !ownerId ||
    String(user.id) !== ownerId
  ) {
    return {
      error:
        "This admin area is restricted to the store owner.",
      status: 403,
      supabaseUrl,
      publicKey,
      secretKey,
      accessToken,
      userId:
        String(user.id),
    };
  }

  return {
    error: null,
    status: 200,
    supabaseUrl,
    publicKey,
    secretKey,
    accessToken,
    userId:
      String(user.id),
  };
}

function serviceHeaders(
  secretKey: string
): Record<string, string> {
  /*
    Supabase's newer sb_secret_* keys are API keys, not JWTs.
    They belong in the apikey header and must not be sent as a
    Bearer token. Legacy service_role JWTs still support Bearer.
  */
  if (
    secretKey.startsWith(
      "sb_secret_"
    )
  ) {
    return {
      apikey: secretKey,
    };
  }

  return {
    apikey: secretKey,
    Authorization:
      `Bearer ${secretKey}`,
  };
}

export async function GET() {
  const auth =
    await getAdminAuth();

  if (
    auth.error ||
    !auth.supabaseUrl ||
    !auth.secretKey
  ) {
    return NextResponse.json(
      {
        error: auth.error,
      },
      {
        status: auth.status,
      }
    );
  }

  const rentalsResponse =
    await fetch(
      `${auth.supabaseUrl}/rest/v1/ai_rentals?select=*&order=created_at.desc`,
      {
        headers:
          serviceHeaders(
            auth.secretKey
          ),
        cache:
          "no-store",
      }
    );

  const rentalsData =
    await rentalsResponse.json();

  if (!rentalsResponse.ok) {
    return NextResponse.json(
      {
        error:
          rentalsData?.message ||
          "Unable to load AI rentals. Run supabase/ai_rentals.sql first.",
      },
      {
        status:
          rentalsResponse.status ||
          500,
      }
    );
  }

  const rentals =
    Array.isArray(rentalsData)
      ? (rentalsData as RentalRow[])
      : [];

  const userIds =
    Array.from(
      new Set(
        rentals.map(
          (rental) =>
            rental.user_id
        )
      )
    );

  const orderItemIds =
    Array.from(
      new Set(
        rentals.map(
          (rental) =>
            rental.order_item_id
        )
      )
    );

  const emailMap =
    new Map<string, string>();

  const titleMap =
    new Map<string, string>();

  if (userIds.length > 0) {
    const filter =
      userIds
        .map(
          (id) =>
            `"${id}"`
        )
        .join(",");

    const response =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/profiles?id=in.(${encodeURIComponent(
          filter
        )})&select=id,email`,
        {
          headers:
            serviceHeaders(
            auth.secretKey
          ),
          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (response.ok) {
      (
        Array.isArray(data)
          ? data
          : []
      ).forEach(
        (
          profile: {
            id?: string;
            email?: string;
          }
        ) => {
          if (profile.id) {
            emailMap.set(
              profile.id,
              profile.email || ""
            );
          }
        }
      );
    }
  }

  if (orderItemIds.length > 0) {
    const filter =
      orderItemIds
        .map(
          (id) =>
            `"${id}"`
        )
        .join(",");

    const response =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/order_items?id=in.(${encodeURIComponent(
          filter
        )})&select=id,product_title`,
        {
          headers:
            serviceHeaders(
            auth.secretKey
          ),
          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (response.ok) {
      (
        Array.isArray(data)
          ? data
          : []
      ).forEach(
        (
          item: {
            id?: string;
            product_title?: string;
          }
        ) => {
          if (item.id) {
            titleMap.set(
              item.id,
              item.product_title ||
                "AI Rental"
            );
          }
        }
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      rentals:
        rentals.map(
          (rental) => ({
            ...rental,
            customer_email:
              emailMap.get(
                rental.user_id
              ) || "",
            product_title:
              titleMap.get(
                rental.order_item_id
              ) ||
              "AI Rental",
          })
        ),
    }
  );
}

export async function PATCH(
  request: Request
) {
  const auth =
    await getAdminAuth();

  if (
    auth.error ||
    !auth.supabaseUrl ||
    !auth.secretKey
  ) {
    return NextResponse.json(
      {
        error: auth.error,
      },
      {
        status: auth.status,
      }
    );
  }

  const body =
    await request
      .json()
      .catch(() => null);

  const id =
    String(
      body?.id || ""
    ).trim();

  if (!id) {
    return NextResponse.json(
      {
        error:
          "AI rental ID is required.",
      },
      {
        status: 400,
      }
    );
  }

  const status =
    String(
      body?.status ||
        "READY_FOR_PROVISIONING"
    )
      .trim()
      .toUpperCase();

  const allowedStatuses =
    new Set([
      "PENDING_SETUP",
      "READY_FOR_PROVISIONING",
      "ACTIVE",
      "SUSPENDED",
      "EXPIRED",
    ]);

  if (!allowedStatuses.has(status)) {
    return NextResponse.json(
      {
        error:
          "Unsupported AI rental status.",
      },
      {
        status: 400,
      }
    );
  }

  const monthlyQuota =
    Number(
      body?.monthlyQuota || 1000
    );

  if (
    !Number.isFinite(
      monthlyQuota
    ) ||
    monthlyQuota <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Monthly quota must be greater than zero.",
      },
      {
        status: 400,
      }
    );
  }

  const gmEmbedCode =
    String(
      body?.gmEmbedCode || ""
    ).trim();

  if (
    status === "ACTIVE" &&
    !gmEmbedCode
  ) {
    return NextResponse.json(
      {
        error:
          "Paste the GM AI embed code before activating this rental.",
      },
      {
        status: 400,
      }
    );
  }

  const response =
    await fetch(
      `${auth.supabaseUrl}/rest/v1/ai_rentals?id=eq.${encodeURIComponent(
        id
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
          ...serviceHeaders(
            auth.secretKey
          ),
          Prefer:
            "return=representation",
        },
        body: JSON.stringify({
          status,
          monthly_quota:
            Math.round(
              monthlyQuota
            ),
          expires_at:
            body?.expiresAt ||
            null,
          gm_client_name:
            String(
              body?.gmClientName ||
                ""
            ).trim() ||
            null,
          gm_client_slug:
            String(
              body?.gmClientSlug ||
                ""
            ).trim() ||
            null,
          gm_api_key:
            String(
              body?.gmApiKey ||
                ""
            ).trim() ||
            null,
          gm_embed_code:
            gmEmbedCode ||
            null,
          gm_api_endpoint:
            String(
              body?.gmApiEndpoint ||
                "https://gm-ai-boss.lovable.app/api/public/client-chat"
            ).trim(),
          admin_notes:
            String(
              body?.adminNotes ||
                ""
            ).trim() ||
            null,
        }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          data?.message ||
          "Unable to update AI rental.",
      },
      {
        status:
          response.status || 500,
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message:
        status === "ACTIVE"
          ? "AI rental activated. The customer can now see their integration details."
          : "AI rental updated.",
      rental:
        Array.isArray(data)
          ? data[0]
          : data,
    }
  );
}
