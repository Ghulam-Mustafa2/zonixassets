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

  const response =
    await fetch(
      `${auth.supabaseUrl}/rest/v1/ai_rentals?user_id=eq.${encodeURIComponent(
        auth.userId
      )}&order_item_id=eq.${encodeURIComponent(
        id
      )}&select=id,user_id,order_item_id,product_id,business_name,website_url,logo_url,brand_color,allowed_origin,welcome_message,system_prompt,lead_capture_enabled,lead_goal,monthly_quota,status,gm_client_name,gm_client_slug,gm_embed_code,gm_api_endpoint,expires_at,created_at,updated_at`,
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

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          data?.message ||
          "Unable to load your AI rental.",
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

  if (!rental) {
    return NextResponse.json(
      {
        error:
          "AI rental access was not found for this purchase.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      rental,
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
