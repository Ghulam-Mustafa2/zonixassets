import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type IncomingCartItem = {
  id: string;
  quantity: number;
};

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  price: number | string;
};

type ProfileRow = {
  id: string;
  is_active?: boolean | null;
};

function createOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `PKS-${timestamp}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    /*
      -----------------------------------
      1. Get logged-in user's access token
      -----------------------------------
    */

    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get("pakstore-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to create an order.",
        },
        { status: 401 }
      );
    }

    /*
      -----------------------------------
      2. Verify user with Supabase
      -----------------------------------
    */

    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const userData = await userResponse.json();

    if (!userResponse.ok || !userData?.id) {
      const response = NextResponse.json(
        {
          error:
            userData?.message ||
            userData?.msg ||
            "Your session is invalid or expired.",
        },
        { status: 401 }
      );

      clearAuthCookies(response);

      return response;
    }

    /*
      -----------------------------------
      3. Verify account status
      -----------------------------------

      A valid Supabase session is not enough.
      Suspended accounts must not be able
      to create new orders.
      -----------------------------------
    */

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          userData.id
        )}&select=id,is_active`,
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

    const profileData =
      await profileResponse.json();

    if (!profileResponse.ok) {
      console.error(
        "ORDER_PROFILE_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          error:
            profileData?.message ||
            "Unable to verify your account status.",
        },
        {
          status:
            profileResponse.status || 500,
        }
      );
    }

    const profile =
      Array.isArray(profileData)
        ? (profileData[0] as
            | ProfileRow
            | undefined)
        : undefined;

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Account profile was not found.",
        },
        { status: 404 }
      );
    }

    if (profile.is_active === false) {
      const response = NextResponse.json(
        {
          code:
            "ACCOUNT_SUSPENDED",
          error:
            "Your account has been suspended. You cannot place new orders.",
        },
        { status: 403 }
      );

      clearAuthCookies(response);

      return response;
    }

    /*
      -----------------------------------
      4. Read incoming cart
      -----------------------------------
    */

    const body = await request.json();

    const items = body?.items as
      | IncomingCartItem[]
      | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    /*
      -----------------------------------
      5. Validate cart items
      -----------------------------------
    */

    const normalizedItems = items
      .filter(
        (item) =>
          typeof item?.id === "string" &&
          item.id.trim().length > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      )
      .map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

    if (normalizedItems.length !== items.length) {
      return NextResponse.json(
        {
          error: "Invalid cart data.",
        },
        { status: 400 }
      );
    }

    /*
      -----------------------------------
      6. Remove duplicate product IDs
      -----------------------------------
    */

    const productIds = [
      ...new Set(
        normalizedItems.map((item) => item.id)
      ),
    ];

    /*
      -----------------------------------
      7. Fetch real product data
      -----------------------------------

      IMPORTANT:
      Price browser/localStorage se trust nahi karna.
      Real price database se aa raha hai.
      -----------------------------------
    */

    const filter = productIds
      .map((id) => `"${id}"`)
      .join(",");

    const productsResponse = await fetch(
      `${supabaseUrl}/rest/v1/products?id=in.(${encodeURIComponent(
        filter
      )})&select=id,title,slug,price`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const productsData =
      await productsResponse.json();

    if (!productsResponse.ok) {
      console.error(
        "ORDER_PRODUCTS_FETCH_ERROR:",
        productsData
      );

      return NextResponse.json(
        {
          error: "Unable to verify products.",
        },
        { status: 500 }
      );
    }

    const products = productsData as ProductRow[];

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more products no longer exist.",
        },
        { status: 400 }
      );
    }

    /*
      -----------------------------------
      8. Calculate totals server-side
      -----------------------------------
    */

    let subtotal = 0;

    const preparedOrderItems =
      normalizedItems.map((cartItem) => {
        const product = products.find(
          (item) => item.id === cartItem.id
        );

        if (!product) {
          throw new Error(
            `Product not found: ${cartItem.id}`
          );
        }

        const productPrice = Number(
          product.price
        );

        if (
          Number.isNaN(productPrice) ||
          productPrice < 0
        ) {
          throw new Error(
            `Invalid price for product: ${product.id}`
          );
        }

        const lineTotal =
          productPrice * cartItem.quantity;

        subtotal += lineTotal;

        return {
          product_id: product.id,
          product_title: product.title,
          product_price: productPrice,
          quantity: cartItem.quantity,
        };
      });

    /*
      -----------------------------------
      9. Order totals
      -----------------------------------

      Abhi service fee zero rakhi hai.
      Payment integration baad mein add hogi.
      -----------------------------------
    */

    const serviceFee = 0;

    const total = subtotal + serviceFee;

    /*
      Numeric values ko 2 decimals tak normalize
    */

    const finalSubtotal =
      Math.round(subtotal * 100) / 100;

    const finalServiceFee =
      Math.round(serviceFee * 100) / 100;

    const finalTotal =
      Math.round(total * 100) / 100;

    /*
      -----------------------------------
      10. Generate unique order number
      -----------------------------------
    */

    const orderNumber = createOrderNumber();

    /*
      -----------------------------------
      11. Create order
      -----------------------------------
    */

    const orderResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          order_number: orderNumber,
          user_id: userData.id,

          /*
            Your database accepts:
            PENDING
            PAID
            CANCELLED
            REFUNDED
          */

          status: "PENDING",

          subtotal: finalSubtotal,

          service_fee: finalServiceFee,

          total: finalTotal,

          /*
            Abhi real payment gateway nahi hai.
          */

          payment_provider: null,

          payment_reference: null,
        }),
      }
    );

    const orderData =
      await orderResponse.json();

    if (!orderResponse.ok) {
      console.error(
        "ORDER_CREATE_ERROR:",
        orderData
      );

      return NextResponse.json(
        {
          error:
            orderData?.message ||
            orderData?.details ||
            "Unable to create order.",
        },
        {
          status:
            orderResponse.status || 500,
        }
      );
    }

    const createdOrder = Array.isArray(
      orderData
    )
      ? orderData[0]
      : orderData;

    if (!createdOrder?.id) {
      return NextResponse.json(
        {
          error:
            "Order was not created correctly.",
        },
        { status: 500 }
      );
    }

    /*
      -----------------------------------
      12. Prepare order_items payload
      -----------------------------------

      Actual DB columns:

      order_id
      product_id
      product_title
      product_price
      quantity
      -----------------------------------
    */

    const orderItemsPayload =
      preparedOrderItems.map((item) => ({
        order_id: createdOrder.id,

        product_id: item.product_id,

        product_title: item.product_title,

        product_price: item.product_price,

        quantity: item.quantity,
      }));

    /*
      -----------------------------------
      13. Create order items
      -----------------------------------
    */

    const orderItemsResponse = await fetch(
      `${supabaseUrl}/rest/v1/order_items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(
          orderItemsPayload
        ),
      }
    );

    /*
      -----------------------------------
      14. If items fail, delete order
      -----------------------------------

      Is se incomplete/empty order database
      mein rehne se bach jayega.
      -----------------------------------
    */

    if (!orderItemsResponse.ok) {
      let orderItemsError: unknown = null;

      try {
        orderItemsError =
          await orderItemsResponse.json();
      } catch {
        orderItemsError =
          "Unable to read order items error.";
      }

      console.error(
        "ORDER_ITEMS_CREATE_ERROR:",
        orderItemsError
      );

      /*
        Cleanup partially-created order.

        order_items foreign key has
        ON DELETE CASCADE as well.
      */

      try {
        await fetch(
          `${supabaseUrl}/rest/v1/orders?id=eq.${createdOrder.id}`,
          {
            method: "DELETE",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      } catch (cleanupError) {
        console.error(
          "ORDER_CLEANUP_ERROR:",
          cleanupError
        );
      }

      return NextResponse.json(
        {
          error:
            "Order items could not be saved. Your order was not completed.",
        },
        { status: 500 }
      );
    }

    /*
      -----------------------------------
      15. Success
      -----------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Order created successfully.",

        order: {
          id: createdOrder.id,

          orderNumber:
            createdOrder.order_number,

          status: createdOrder.status,

          subtotal: Number(
            createdOrder.subtotal ??
              finalSubtotal
          ),

          serviceFee: Number(
            createdOrder.service_fee ??
              finalServiceFee
          ),

          total: Number(
            createdOrder.total ??
              finalTotal
          ),

          paymentProvider:
            createdOrder.payment_provider ??
            null,

          paymentReference:
            createdOrder.payment_reference ??
            null,

          createdAt:
            createdOrder.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE_ORDER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating your order.",
      },
      { status: 500 }
    );
  }
}

function clearAuthCookies(
  response: NextResponse
) {
  response.cookies.set(
    "pakstore-access-token",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );

  response.cookies.set(
    "pakstore-refresh-token",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );
}

