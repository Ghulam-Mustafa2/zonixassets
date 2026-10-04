import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{
    orderItemId: string;
  }>;
};

async function getCustomerAuth() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      error:
        "Supabase configuration is missing.",
      status: 500,
      supabaseUrl: null,
      supabaseKey: null,
      accessToken: null,
      userId: null,
    };
  }

  const cookieStore = await cookies();

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
      supabaseKey,
      accessToken: null,
      userId: null,
    };
  }

  const userResponse =
    await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: supabaseKey,
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
    return {
      error:
        "Your session is invalid or expired.",
      status: 401,
      supabaseUrl,
      supabaseKey,
      accessToken,
      userId: null,
    };
  }

  return {
    error: null,
    status: 200,
    supabaseUrl,
    supabaseKey,
    accessToken,
    userId:
      String(user.id),
  };
}

function customerHeaders(
  supabaseKey: string,
  accessToken: string
) {
  return {
    apikey: supabaseKey,
    Authorization:
      `Bearer ${accessToken}`,
  };
}

function serviceHeaders(
  secretKey: string
): Record<string, string> {
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

const rentalSelect =
  "id,user_id,order_item_id,product_id,business_name,website_url,logo_url,brand_color,allowed_origin,welcome_message,system_prompt,lead_capture_enabled,lead_goal,monthly_quota,status,gm_client_name,gm_client_slug,gm_embed_code,gm_api_endpoint,expires_at,created_at,updated_at";

async function repairMissingRental(
  supabaseUrl: string,
  secretKey: string,
  userId: string,
  orderItemId: string
) {
  const headers =
    serviceHeaders(secretKey);

  const itemResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/order_items?id=eq.${encodeURIComponent(
        orderItemId
      )}&select=id,order_id,product_id&limit=1`,
      {
        headers,
        cache: "no-store",
      }
    );

  const itemData =
    await itemResponse
      .json()
      .catch(() => null);

  if (!itemResponse.ok) {
    return {
      ok: false,
      status: 500,
      error:
        "Unable to verify this AI rental purchase.",
    };
  }

  const item =
    Array.isArray(itemData)
      ? itemData[0]
      : null;

  if (
    !item?.id ||
    !item?.order_id ||
    !item?.product_id
  ) {
    return {
      ok: false,
      status: 404,
      error:
        "AI rental access was not found for this purchase.",
    };
  }

  const orderResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
        String(item.order_id)
      )}&user_id=eq.${encodeURIComponent(
        userId
      )}&status=eq.PAID&select=id&limit=1`,
      {
        headers,
        cache: "no-store",
      }
    );

  const orderData =
    await orderResponse
      .json()
      .catch(() => null);

  if (
    !orderResponse.ok ||
    !Array.isArray(orderData) ||
    !orderData[0]?.id
  ) {
    return {
      ok: false,
      status: 404,
      error:
        "A paid AI rental purchase could not be verified.",
    };
  }

  const productResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(
        String(item.product_id)
      )}&select=id,product_type&limit=1`,
      {
        headers,
        cache: "no-store",
      }
    );

  const productData =
    await productResponse
      .json()
      .catch(() => null);

  if (
    !productResponse.ok ||
    !Array.isArray(productData) ||
    !productData[0]?.id
  ) {
    return {
      ok: false,
      status: 404,
      error:
        "The purchased product record could not be found.",
    };
  }

  const purchasedProductType =
    String(
      productData[0]?.product_type ||
        ""
    )
      .trim()
      .toUpperCase();

  if (
    purchasedProductType !==
      "AI_RENTAL"
  ) {
    console.error(
      "AI_RENTAL_SELF_HEAL_TYPE_MISMATCH",
      {
        orderItemId,
        productId:
          String(item.product_id),
        productType:
          productData[0]?.product_type ??
          null,
      }
    );

    return {
      ok: false,
      status: 404,
      error:
        "This purchase is not an AI rental product.",
    };
  }

  const existingResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/ai_rentals?order_item_id=eq.${encodeURIComponent(
        orderItemId
      )}&select=id,user_id&limit=1`,
      {
        headers,
        cache: "no-store",
      }
    );

  const existingData =
    await existingResponse
      .json()
      .catch(() => null);

  if (!existingResponse.ok) {
    return {
      ok: false,
      status: 500,
      error:
        "Unable to verify AI rental provisioning.",
    };
  }

  const existing =
    Array.isArray(existingData)
      ? existingData[0]
      : null;

  if (existing?.id) {
    if (
      String(existing.user_id) !==
      userId
    ) {
      return {
        ok: false,
        status: 409,
        error:
          "This AI rental is linked to a different customer.",
      };
    }

    return {
      ok: true,
      status: 200,
      error: null,
    };
  }

  const createResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/ai_rentals`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          ...headers,
          Prefer:
            "return=minimal",
        },
        body: JSON.stringify({
          user_id: userId,
          order_item_id:
            orderItemId,
          product_id:
            String(item.product_id),
          status:
            "PENDING_SETUP",
        }),
        cache: "no-store",
      }
    );

  if (!createResponse.ok) {
    const detail =
      await createResponse
        .text()
        .catch(() => "");

    console.error(
      "AI_RENTAL_SELF_HEAL_CREATE_ERROR",
      detail
    );

    return {
      ok: false,
      status: 500,
      error:
        "Your payment is confirmed, but the AI rental setup could not be created yet.",
    };
  }

  return {
    ok: true,
    status: 200,
    error: null,
  };
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth =
    await getCustomerAuth();

  if (
    auth.error ||
    !auth.supabaseUrl ||
    !auth.supabaseKey ||
    !auth.accessToken ||
    !auth.userId
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

  const { orderItemId } =
    await context.params;

  const id =
    orderItemId?.trim();

  if (!id) {
    return NextResponse.json(
      {
        error:
          "Order item ID is required.",
      },
      {
        status: 400,
      }
    );
  }

  const loadRental =
    async () => {
      const response =
        await fetch(
          `${auth.supabaseUrl}/rest/v1/ai_rentals?user_id=eq.${encodeURIComponent(
            auth.userId
          )}&order_item_id=eq.${encodeURIComponent(
            id
          )}&select=${rentalSelect}`,
          {
            headers:
              customerHeaders(
                auth.supabaseKey,
                auth.accessToken
              ),
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      return {
        response,
        data,
        rental:
          Array.isArray(data)
            ? data[0]
            : null,
      };
    };

  let loaded =
    await loadRental();

  if (!loaded.response.ok) {
    return NextResponse.json(
      {
        error:
          loaded.data?.message ||
          "Unable to load your AI rental.",
      },
      {
        status:
          loaded.response.status ||
          500,
      }
    );
  }

  if (!loaded.rental) {
    const secretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "Your payment is confirmed, but AI rental provisioning is not configured on the server.",
        },
        {
          status: 500,
        }
      );
    }

    const repair =
      await repairMissingRental(
        auth.supabaseUrl,
        secretKey,
        auth.userId,
        id
      );

    if (!repair.ok) {
      return NextResponse.json(
        {
          error: repair.error,
        },
        {
          status: repair.status,
        }
      );
    }

    loaded =
      await loadRental();

    if (
      !loaded.response.ok ||
      !loaded.rental
    ) {
      return NextResponse.json(
        {
          error:
            "Your payment is confirmed, but the AI rental setup is still being prepared. Please refresh in a moment.",
        },
        {
          status: 503,
        }
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      rental: loaded.rental,
    }
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth =
    await getCustomerAuth();

  if (
    auth.error ||
    !auth.supabaseUrl ||
    !auth.supabaseKey ||
    !auth.accessToken ||
    !auth.userId
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

  const { orderItemId } =
    await context.params;

  const id =
    orderItemId?.trim();

  if (!id) {
    return NextResponse.json(
      {
        error:
          "Order item ID is required.",
      },
      {
        status: 400,
      }
    );
  }

  const body =
    await request
      .json()
      .catch(() => null);

  const businessName =
    String(
      body?.businessName || ""
    ).trim();

  if (!businessName) {
    return NextResponse.json(
      {
        error:
          "Business name is required.",
      },
      {
        status: 400,
      }
    );
  }

  const websiteUrl =
    String(
      body?.websiteUrl || ""
    ).trim();

  const logoUrl =
    String(
      body?.logoUrl || ""
    ).trim();

  const brandColor =
    String(
      body?.brandColor ||
        "#1d4ed8"
    ).trim();

  const allowedOrigin =
    String(
      body?.allowedOrigin ||
        websiteUrl ||
        ""
    ).trim();

  const welcomeMessage =
    String(
      body?.welcomeMessage ||
        "Hi! How can I help your business today?"
    ).trim();

  const systemPrompt =
    String(
      body?.systemPrompt || ""
    ).trim();

  const leadGoal =
    String(
      body?.leadGoal || ""
    ).trim();

  const leadCaptureEnabled =
    body?.leadCaptureEnabled !==
    false;

  if (
    websiteUrl &&
    !/^https:\/\//i.test(
      websiteUrl
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Website URL must start with https://",
      },
      {
        status: 400,
      }
    );
  }

  const response =
    await fetch(
      `${auth.supabaseUrl}/rest/v1/ai_rentals?user_id=eq.${encodeURIComponent(
        auth.userId
      )}&order_item_id=eq.${encodeURIComponent(
        id
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
          ...customerHeaders(
            auth.supabaseKey,
            auth.accessToken
          ),
          Prefer:
            "return=representation",
        },
        body: JSON.stringify({
          business_name:
            businessName,
          website_url:
            websiteUrl || null,
          logo_url:
            logoUrl || null,
          brand_color:
            brandColor,
          allowed_origin:
            allowedOrigin || null,
          welcome_message:
            welcomeMessage,
          system_prompt:
            systemPrompt || null,
          lead_capture_enabled:
            leadCaptureEnabled,
          lead_goal:
            leadGoal || null,
          status:
            "READY_FOR_PROVISIONING",
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
          "Unable to save your AI setup.",
      },
      {
        status:
          response.status || 500,
      }
    );
  }

  const rental =
    Array.isArray(data)
      ? data[0]
      : null;

  return NextResponse.json(
    {
      success: true,
      message:
        "Your AI setup has been submitted. We will provision your assistant and publish the integration details here.",
      rental,
    }
  );
}
