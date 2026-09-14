import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProfileRow = {
  id: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  subtotal: number | string;
  service_fee: number | string;
  total: number | string;
  payment_provider: string | null;
  payment_reference: string | null;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  product_price: number | string;
  quantity: number;
};

type DownloadRow = {
  id: string;
  user_id: string;
  order_item_id: string;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
  created_at?: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getAdminAuth() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      error:
        "Supabase environment variables are missing.",
      status: 500,
      supabaseUrl: null,
      supabaseKey: null,
      accessToken: null,
      user: null,
      profile: null,
    };
  }

  const cookieStore = await cookies();

  const accessToken =
    cookieStore.get(
      "pakstore-access-token"
    )?.value;

  if (!accessToken) {
    return {
      success: false,
      error: "You must be signed in.",
      status: 401,
      supabaseUrl,
      supabaseKey,
      accessToken: null,
      user: null,
      profile: null,
    };
  }

  /*
    Verify Supabase user
  */

  const userResponse = await fetch(
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
    await userResponse.json();

  if (
    !userResponse.ok ||
    !user?.id
  ) {
    return {
      success: false,
      error:
        "Your session is invalid or expired.",
      status: 401,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user: null,
      profile: null,
    };
  }

  /*
    Load current user's profile
  */

  const profileResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        user.id
      )}&select=id,email,first_name,last_name,role`,
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
      "ADMIN_ORDER_DETAIL_PROFILE_ERROR:",
      profileData
    );

    return {
      success: false,
      error:
        profileData?.message ||
        "Unable to verify admin account.",
      status:
        profileResponse.status || 500,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
      profile: null,
    };
  }

  const profile =
    Array.isArray(profileData)
      ? (profileData[0] as
          | ProfileRow
          | undefined)
      : undefined;

  if (!profile) {
    return {
      success: false,
      error: "Admin profile not found.",
      status: 404,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
      profile: null,
    };
  }

  /*
    ADMIN protection
  */

  if (
    profile.role?.toUpperCase() !==
    "ADMIN"
  ) {
    return {
      success: false,
      error:
        "You do not have permission to access this admin resource.",
      status: 403,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
      profile,
    };
  }

  return {
    success: true,
    error: null,
    status: 200,
    supabaseUrl,
    supabaseKey,
    accessToken,
    user,
    profile,
  };
}

/*
  ============================================================
  GET /api/admin/orders/[id]

  Admin only.

  Returns one complete order with:
  - order details
  - customer profile
  - purchased items
  - download entitlements
  - payment information
  ============================================================
*/

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const auth =
      await getAdminAuth();

    if (
      !auth.success ||
      !auth.supabaseUrl ||
      !auth.supabaseKey ||
      !auth.accessToken
    ) {
      return NextResponse.json(
        {
          error:
            auth.error ||
            "Unable to verify admin.",
        },
        {
          status: auth.status,
        }
      );
    }

    /*
      Read order ID from URL
    */

    const { id } =
      await context.params;

    const orderId =
      id?.trim();

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
      1. Fetch order
    */

    const orderResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
          orderId
        )}&select=id,order_number,user_id,status,subtotal,service_fee,total,payment_provider,payment_reference,created_at`,
        {
          method: "GET",
          headers: {
            apikey:
              auth.supabaseKey,
            Authorization:
              `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

    const orderData =
      await orderResponse.json();

    if (!orderResponse.ok) {
      console.error(
        "ADMIN_ORDER_DETAIL_FETCH_ERROR:",
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

    const order =
      Array.isArray(orderData)
        ? (orderData[0] as
            | OrderRow
            | undefined)
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
      2. Fetch customer profile
    */

    const customerResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          order.user_id
        )}&select=id,email,first_name,last_name,role`,
        {
          method: "GET",
          headers: {
            apikey:
              auth.supabaseKey,
            Authorization:
              `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

    const customerData =
      await customerResponse.json();

    let customer:
      | ProfileRow
      | undefined;

    if (
      customerResponse.ok &&
      Array.isArray(customerData)
    ) {
      customer =
        customerData[0] as
          | ProfileRow
          | undefined;
    } else {
      console.error(
        "ADMIN_ORDER_CUSTOMER_ERROR:",
        customerData
      );
    }

    /*
      3. Fetch order items
    */

    const itemsResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/order_items?order_id=eq.${encodeURIComponent(
          order.id
        )}&select=id,order_id,product_id,product_title,product_price,quantity`,
        {
          method: "GET",
          headers: {
            apikey:
              auth.supabaseKey,
            Authorization:
              `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

    const itemsData =
      await itemsResponse.json();

    if (!itemsResponse.ok) {
      console.error(
        "ADMIN_ORDER_DETAIL_ITEMS_ERROR:",
        itemsData
      );

      return NextResponse.json(
        {
          error:
            itemsData?.message ||
            "Unable to load order items.",
        },
        {
          status:
            itemsResponse.status || 500,
        }
      );
    }

    const orderItems =
      Array.isArray(itemsData)
        ? (itemsData as OrderItemRow[])
        : [];

    /*
      4. Fetch download entitlements
    */

    let downloads: DownloadRow[] =
      [];

    if (orderItems.length > 0) {
      const orderItemIds =
        orderItems
          .map((item) => item.id)
          .map(
            (id) =>
              `"${id}"`
          )
          .join(",");

      const downloadsResponse =
        await fetch(
          `${auth.supabaseUrl}/rest/v1/downloads?order_item_id=in.(${encodeURIComponent(
            orderItemIds
          )})&select=id,user_id,order_item_id,download_count,max_downloads,expires_at,created_at`,
          {
            method: "GET",
            headers: {
              apikey:
                auth.supabaseKey,
              Authorization:
                `Bearer ${auth.accessToken}`,
            },
            cache: "no-store",
          }
        );

      const downloadsData =
        await downloadsResponse.json();

      if (
        downloadsResponse.ok &&
        Array.isArray(downloadsData)
      ) {
        downloads =
          downloadsData as DownloadRow[];
      } else {
        console.error(
          "ADMIN_ORDER_DOWNLOADS_ERROR:",
          downloadsData
        );
      }
    }

    /*
      5. Format customer name
    */

    const customerName =
      [
        customer?.first_name,
        customer?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    /*
      6. Join download entitlement
         with each purchased item
    */

    const formattedItems =
      orderItems.map(
        (item) => {
          const entitlement =
            downloads.find(
              (download) =>
                download.order_item_id ===
                item.id
            );

          const price =
            Number(
              item.product_price || 0
            );

          const quantity =
            Number(
              item.quantity || 0
            );

          return {
            id: item.id,

            productId:
              item.product_id,

            title:
              item.product_title,

            price,

            quantity,

            lineTotal:
              price * quantity,

            download:
              entitlement
                ? {
                    id:
                      entitlement.id,

                    downloadCount:
                      Number(
                        entitlement.download_count ||
                          0
                      ),

                    maxDownloads:
                      Number(
                        entitlement.max_downloads ||
                          0
                      ),

                    remaining:
                      Math.max(
                        0,
                        Number(
                          entitlement.max_downloads ||
                            0
                        ) -
                          Number(
                            entitlement.download_count ||
                              0
                          )
                      ),

                    expiresAt:
                      entitlement.expires_at,

                    createdAt:
                      entitlement.created_at ||
                      null,
                  }
                : null,
          };
        }
      );

    /*
      7. Calculate item count
    */

    const itemCount =
      formattedItems.reduce(
        (total, item) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      );

    /*
      8. Final response
    */

    return NextResponse.json(
      {
        success: true,

        order: {
          id:
            order.id,

          orderNumber:
            order.order_number,

          status:
            order.status,

          userId:
            order.user_id,

          subtotal:
            Number(
              order.subtotal || 0
            ),

          serviceFee:
            Number(
              order.service_fee || 0
            ),

          total:
            Number(
              order.total || 0
            ),

          paymentProvider:
            order.payment_provider ||
            null,

          paymentReference:
            order.payment_reference ||
            null,

          createdAt:
            order.created_at,

          itemCount,

          customer: {
            id:
              customer?.id ||
              order.user_id,

            email:
              customer?.email ||
              null,

            firstName:
              customer?.first_name ||
              "",

            lastName:
              customer?.last_name ||
              "",

            name:
              customerName ||
              customer?.email ||
              "Customer",

            role:
              customer?.role ||
              "CUSTOMER",
          },

          items:
            formattedItems,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_ORDER_DETAIL_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading the admin order.",
      },
      {
        status: 500,
      }
    );
  }
}
/*
  ============================================================
  PATCH /api/admin/orders/[id]

  Admin only.

  Allows controlled order status updates:
  - PENDING
  - PAID
  - CANCELLED

  When an order becomes PAID, missing download entitlements
  are created automatically for its order items.
  ============================================================
*/

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuth();

    if (
      !auth.success ||
      !auth.supabaseUrl ||
      !auth.supabaseKey ||
      !auth.accessToken
    ) {
      return NextResponse.json(
        {
          error:
            auth.error ||
            "Unable to verify admin.",
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } = await context.params;
    const orderId = id?.trim();

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "A valid JSON body is required.",
        },
        {
          status: 400,
        }
      );
    }

    const requestedStatus =
      typeof (body as { status?: unknown })?.status === "string"
        ? ((body as { status: string }).status)
            .trim()
            .toUpperCase()
        : "";

    const allowedStatuses = new Set([
      "PENDING",
      "PAID",
      "CANCELLED",
    ]);

    if (!allowedStatuses.has(requestedStatus)) {
      return NextResponse.json(
        {
          error:
            "Invalid order status. Allowed values are PENDING, PAID and CANCELLED.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      1. Fetch the current order first.
    */

    const orderResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
        orderId
      )}&select=id,order_number,user_id,status,total,payment_provider,payment_reference`,
      {
        method: "GET",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error(
        "ADMIN_ORDER_PATCH_FETCH_ERROR:",
        orderData
      );

      return NextResponse.json(
        {
          error:
            orderData?.message ||
            "Unable to load order.",
        },
        {
          status: orderResponse.status || 500,
        }
      );
    }

    const existingOrder = Array.isArray(orderData)
      ? orderData[0]
      : undefined;

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Avoid writing the same status again.
    */

    if (
      typeof existingOrder.status === "string" &&
      existingOrder.status.toUpperCase() === requestedStatus
    ) {
      return NextResponse.json(
        {
          success: true,
          message: `Order is already ${requestedStatus}.`,
          order: existingOrder,
        },
        {
          status: 200,
        }
      );
    }

    /*
      2. Prepare order update.
    */

    const updatePayload: {
      status: string;
      payment_provider?: string | null;
      payment_reference?: string | null;
    } = {
      status: requestedStatus,
    };

    /*
      This project is still using TEST/admin payment state.
      If the order is moved back to PENDING or CANCELLED,
      clear the test/admin payment metadata.

      Later, with Stripe/PayPal/etc., do not blindly clear
      provider data without refund/cancellation verification.
    */

    if (
      requestedStatus === "PENDING" ||
      requestedStatus === "CANCELLED"
    ) {
      updatePayload.payment_provider = null;
      updatePayload.payment_reference = null;
    }

    /*
      If an admin manually marks an unpaid order as PAID,
      create a clear admin reference when none already exists.
    */

    if (
      requestedStatus === "PAID" &&
      !existingOrder.payment_reference
    ) {
      updatePayload.payment_provider = "ADMIN";
      updatePayload.payment_reference = `ADMIN-${Date.now()}`;
    }

    const updateResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(
        orderId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.accessToken}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    const updatedOrderData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error(
        "ADMIN_ORDER_PATCH_ERROR:",
        updatedOrderData
      );

      return NextResponse.json(
        {
          error:
            updatedOrderData?.message ||
            "Unable to update order.",
        },
        {
          status: updateResponse.status || 500,
        }
      );
    }

    const updatedOrder = Array.isArray(updatedOrderData)
      ? updatedOrderData[0]
      : updatedOrderData;

    /*
      3. If the order becomes PAID, make sure every order item
         has a download entitlement.
    */

    if (requestedStatus === "PAID") {
      const itemsResponse = await fetch(
        `${auth.supabaseUrl}/rest/v1/order_items?order_id=eq.${encodeURIComponent(
          orderId
        )}&select=id`,
        {
          method: "GET",
          headers: {
            apikey: auth.supabaseKey,
            Authorization: `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

      const itemsData = await itemsResponse.json();

      if (!itemsResponse.ok) {
        console.error(
          "ADMIN_ORDER_PATCH_ITEMS_ERROR:",
          itemsData
        );

        return NextResponse.json(
          {
            error:
              itemsData?.message ||
              "Order was updated, but its items could not be loaded.",
          },
          {
            status: 500,
          }
        );
      }

      const orderItems = Array.isArray(itemsData)
        ? (itemsData as Array<{ id: string }>)
        : [];

      for (const item of orderItems) {
        const entitlementResponse = await fetch(
          `${auth.supabaseUrl}/rest/v1/downloads?order_item_id=eq.${encodeURIComponent(
            item.id
          )}&select=id`,
          {
            method: "GET",
            headers: {
              apikey: auth.supabaseKey,
              Authorization: `Bearer ${auth.accessToken}`,
            },
            cache: "no-store",
          }
        );

        const entitlementData =
          await entitlementResponse.json();

        if (!entitlementResponse.ok) {
          console.error(
            "ADMIN_ORDER_ENTITLEMENT_CHECK_ERROR:",
            entitlementData
          );

          return NextResponse.json(
            {
              error:
                entitlementData?.message ||
                "Order was updated, but download access could not be verified.",
            },
            {
              status: 500,
            }
          );
        }

        const entitlementExists =
          Array.isArray(entitlementData) &&
          entitlementData.length > 0;

        if (!entitlementExists) {
          const createEntitlementResponse = await fetch(
            `${auth.supabaseUrl}/rest/v1/downloads`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: auth.supabaseKey,
                Authorization: `Bearer ${auth.accessToken}`,
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                user_id: existingOrder.user_id,
                order_item_id: item.id,
                download_count: 0,
                max_downloads: 10,
                expires_at: null,
              }),
            }
          );

          if (!createEntitlementResponse.ok) {
            let entitlementError: unknown = null;

            try {
              entitlementError =
                await createEntitlementResponse.json();
            } catch {
              entitlementError = {
                message:
                  "Unknown download entitlement error.",
              };
            }

            console.error(
              "ADMIN_ORDER_ENTITLEMENT_CREATE_ERROR:",
              entitlementError
            );

            return NextResponse.json(
              {
                error:
                  "Order was marked PAID, but download access could not be created.",
              },
              {
                status: 500,
              }
            );
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Order status updated to ${requestedStatus}.`,
        order: updatedOrder,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_ORDER_UPDATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating the order.",
      },
      {
        status: 500,
      }
    );
  }
}
