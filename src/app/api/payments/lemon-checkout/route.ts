import { NextRequest, NextResponse } from "next/server";

type OrderRow = {
  id: string;
  user_id: string;
  order_number: string;
  total: number | string;
  status: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    /*
      ENVIRONMENT VARIABLES
    */

    const lemonApiKey =
      process.env.LEMON_SQUEEZY_API_KEY;

    const lemonStoreId =
      process.env.LEMON_SQUEEZY_STORE_ID;

    const lemonVariantId =
      process.env.LEMON_SQUEEZY_VARIANT_ID;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !lemonApiKey ||
      !lemonStoreId ||
      !lemonVariantId
    ) {
      return NextResponse.json(
        {
          error:
            "Lemon Squeezy configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      CHECK LOGIN
    */

    const accessToken =
      request.cookies.get(
        "pakstore-access-token"
      )?.value ||
      request.cookies.get(
        "sb-access-token"
      )?.value ||
      request.cookies.get(
        "access_token"
      )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to continue.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      GET CURRENT USER
    */

    const userResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/user`,
        {
          method: "GET",

          headers: {
            apikey: supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const user =
      await userResponse
        .json()
        .catch(() => null);

    if (
      !userResponse.ok ||
      !user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "Your session is invalid or expired.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      READ REQUEST
    */

    const body =
      await request
        .json()
        .catch(() => null);

    const orderId =
      typeof body?.orderId === "string"
        ? body.orderId.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      LOAD ORDER

      Very important:
      user_id filter prevents one customer
      from paying another customer's order.
    */

    const orderResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
          orderId
        )}&user_id=eq.${encodeURIComponent(
          user.id
        )}&select=id,user_id,order_number,total,status&limit=1`,
        {
          method: "GET",

          headers: {
            apikey: supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const orderData =
      await orderResponse
        .json()
        .catch(() => null);

    if (!orderResponse.ok) {
      console.error(
        "LEMON_ORDER_LOAD_ERROR:",
        orderData
      );

      return NextResponse.json(
        {
          error:
            orderData?.message ||
            "Unable to load order.",
        },
        {
          status:
            orderResponse.status || 500,
        }
      );
    }

    const order: OrderRow | undefined =
      Array.isArray(orderData)
        ? orderData[0]
        : undefined;

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      DON'T PAY AN ALREADY PAID ORDER
    */

    const status =
      String(
        order.status || ""
      ).toUpperCase();

    if (status === "PAID") {
      return NextResponse.json(
        {
          error:
            "This order has already been paid.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      status === "CANCELLED" ||
      status === "REFUNDED"
    ) {
      return NextResponse.json(
        {
          error:
            `This ${status.toLowerCase()} order cannot be paid.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
      CALCULATE PRICE IN CENTS

      Lemon Squeezy custom_price expects cents.
      Example:
      $2.00 -> 200
    */

    const total =
      Number(order.total);

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Order total is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const totalInCents =
      Math.round(total * 100);

    /*
      OUR SITE URL

      Local:
      http://localhost:3000

      Production:
      automatically uses the current site origin.
    */

    const origin =
      request.nextUrl.origin;

    const successUrl =
      `${origin}/order-success/${encodeURIComponent(
        order.id
      )}`;

    /*
      CREATE LEMON SQUEEZY CHECKOUT
    */

    const lemonResponse =
      await fetch(
        "https://api.lemonsqueezy.com/v1/checkouts",
        {
          method: "POST",

          headers: {
            Accept:
              "application/vnd.api+json",

            "Content-Type":
              "application/vnd.api+json",

            Authorization:
              `Bearer ${lemonApiKey}`,
          },

          body: JSON.stringify({
            data: {
              type: "checkouts",

              attributes: {
                custom_price:
                  totalInCents,

                test_mode: true,

                product_options: {
                  name:
                    `ZonixAssets Order ${order.order_number}`,

                  description:
                    "Digital product purchase from ZonixAssets.",

                  redirect_url:
                    successUrl,

                  enabled_variants: [
                    Number(
                      lemonVariantId
                    ),
                  ],
                },

                checkout_options: {
                  embed: false,
                  media: false,
                  logo: true,
                  desc: true,
                  discount: false,
                },

                checkout_data: {
                  email:
                    user.email || undefined,

                  custom: {
                    order_id:
                      order.id,

                    order_number:
                      order.order_number,

                    user_id:
                      user.id,
                  },
                },
              },

              relationships: {
                store: {
                  data: {
                    type: "stores",
                    id: String(
                      lemonStoreId
                    ),
                  },
                },

                variant: {
                  data: {
                    type: "variants",
                    id: String(
                      lemonVariantId
                    ),
                  },
                },
              },
            },
          }),
        }
      );

    const lemonData =
      await lemonResponse
        .json()
        .catch(() => null);

    if (!lemonResponse.ok) {
      console.error(
        "LEMON_CHECKOUT_ERROR:",
        lemonData
      );

      const apiMessage =
        lemonData?.errors?.[0]?.detail ||
        lemonData?.errors?.[0]?.title ||
        "Unable to create payment checkout.";

      return NextResponse.json(
        {
          error:
            apiMessage,

          details:
            process.env.NODE_ENV ===
            "development"
              ? lemonData
              : undefined,
        },
        {
          status:
            lemonResponse.status || 500,
        }
      );
    }

    /*
      CHECKOUT URL
    */

    const checkoutUrl =
      lemonData?.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error(
        "LEMON_CHECKOUT_URL_MISSING:",
        lemonData
      );

      return NextResponse.json(
        {
          error:
            "Lemon Squeezy did not return a checkout URL.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      SUCCESS
    */

    return NextResponse.json(
      {
        success: true,

        checkoutUrl,

        checkoutId:
          lemonData?.data?.id || null,

        orderId:
          order.id,

        orderNumber:
          order.order_number,

        amount:
          total,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "LEMON_CHECKOUT_ROUTE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the payment checkout.",
      },
      {
        status: 500,
      }
    );
  }
}