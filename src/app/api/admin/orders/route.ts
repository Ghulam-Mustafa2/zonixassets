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

  /*
    Read login cookie
  */

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
    Load admin profile
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
      "ADMIN_ORDERS_PROFILE_ERROR:",
      profileData
    );

    return {
      success: false,
      error:
        profileData?.message ||
        "Unable to verify admin account.",
      status:
        profileResponse.status ||
        500,
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
        "You do not have permission to access admin orders.",
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
  GET /api/admin/orders

  Admin only.

  Returns:
  - all orders
  - customer information
  - order item count
  - first product
  - payment information
  - dashboard order stats
  ============================================================
*/

export async function GET(
  request: Request
) {
  try {
    /*
      1. Verify admin
    */

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
      Optional URL query parameters

      Examples:

      /api/admin/orders
      /api/admin/orders?status=PAID
      /api/admin/orders?status=PENDING
    */

    const url =
      new URL(request.url);

    const requestedStatus =
      url.searchParams
        .get("status")
        ?.trim()
        .toUpperCase() || "";

    /*
      2. Build orders query
    */

    let ordersUrl =
      `${auth.supabaseUrl}/rest/v1/orders` +
      `?select=id,order_number,user_id,status,subtotal,service_fee,total,payment_provider,payment_reference,created_at`;

    /*
      Optional status filter
    */

    if (
      requestedStatus &&
      requestedStatus !== "ALL"
    ) {
      ordersUrl +=
        `&status=eq.${encodeURIComponent(
          requestedStatus
        )}`;
    }

    /*
      Newest orders first
    */

    ordersUrl +=
      "&order=created_at.desc";

    /*
      3. Fetch orders
    */

    const ordersResponse =
      await fetch(
        ordersUrl,
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

    const ordersData =
      await ordersResponse.json();

    if (!ordersResponse.ok) {
      console.error(
        "ADMIN_ORDERS_FETCH_ERROR:",
        ordersData
      );

      return NextResponse.json(
        {
          error:
            ordersData?.message ||
            "Unable to load orders.",
        },
        {
          status:
            ordersResponse.status ||
            500,
        }
      );
    }

    const orders =
      Array.isArray(ordersData)
        ? (ordersData as OrderRow[])
        : [];

    /*
      No orders is perfectly valid
    */

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: true,

          stats: {
            totalOrders: 0,
            paidOrders: 0,
            pendingOrders: 0,
            totalRevenue: 0,
          },

          count: 0,

          orders: [],
        },
        {
          status: 200,
        }
      );
    }

    /*
      4. Collect IDs
    */

    const orderIds = [
      ...new Set(
        orders.map(
          (order) =>
            order.id
        )
      ),
    ];

    const userIds = [
      ...new Set(
        orders.map(
          (order) =>
            order.user_id
        )
      ),
    ];

    /*
      5. Fetch ALL order items belonging
         to these orders
    */

    const orderFilter =
      orderIds
        .map(
          (id) =>
            `"${id}"`
        )
        .join(",");

    const itemsResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/order_items?order_id=in.(${encodeURIComponent(
          orderFilter
        )})&select=id,order_id,product_id,product_title,product_price,quantity`,
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
        "ADMIN_ORDER_ITEMS_FETCH_ERROR:",
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
            itemsResponse.status ||
            500,
        }
      );
    }

    const allItems =
      Array.isArray(itemsData)
        ? (itemsData as OrderItemRow[])
        : [];

    /*
      6. Fetch customer profiles
    */

    const userFilter =
      userIds
        .map(
          (id) =>
            `"${id}"`
        )
        .join(",");

    const customersResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/profiles?id=in.(${encodeURIComponent(
          userFilter
        )})&select=id,email,first_name,last_name,role`,
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

    const customersData =
      await customersResponse.json();

    /*
      We don't completely fail the orders page
      if customer profile reading fails.

      Orders can still be displayed.
    */

    let customers: ProfileRow[] =
      [];

    if (
      customersResponse.ok &&
      Array.isArray(
        customersData
      )
    ) {
      customers =
        customersData as ProfileRow[];
    } else {
      console.error(
        "ADMIN_ORDER_CUSTOMERS_FETCH_ERROR:",
        customersData
      );
    }

    /*
      7. Build admin-friendly order data
    */

    const formattedOrders =
      orders.map(
        (order) => {
          const customer =
            customers.find(
              (profile) =>
                profile.id ===
                order.user_id
            );

          const orderItems =
            allItems.filter(
              (item) =>
                item.order_id ===
                order.id
            );

          const firstItem =
            orderItems[0];

          const customerName =
            [
              customer?.first_name,
              customer?.last_name,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

          return {
            id:
              order.id,

            orderNumber:
              order.order_number,

            userId:
              order.user_id,

            status:
              order.status,

            subtotal:
              Number(
                order.subtotal ||
                  0
              ),

            serviceFee:
              Number(
                order.service_fee ||
                  0
              ),

            total:
              Number(
                order.total ||
                  0
              ),

            paymentProvider:
              order.payment_provider ||
              null,

            paymentReference:
              order.payment_reference ||
              null,

            createdAt:
              order.created_at,

            /*
              Customer
            */

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

            /*
              Items
            */

            itemCount:
              orderItems.reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  Number(
                    item.quantity ||
                      0
                  ),
                0
              ),

            firstProductTitle:
              firstItem
                ?.product_title ||
              "Order",

            items:
              orderItems.map(
                (item) => ({
                  id:
                    item.id,

                  productId:
                    item.product_id,

                  title:
                    item.product_title,

                  price:
                    Number(
                      item.product_price ||
                        0
                    ),

                  quantity:
                    Number(
                      item.quantity ||
                        0
                    ),
                })
              ),
          };
        }
      );

    /*
      8. Statistics

      Calculate stats from all currently
      fetched orders.

      Note:
      If status query filter is used,
      stats reflect that filtered result.
    */

    const paidOrders =
      formattedOrders.filter(
        (order) =>
          order.status?.toUpperCase() ===
          "PAID"
      );

    const pendingOrders =
      formattedOrders.filter(
        (order) =>
          order.status?.toUpperCase() ===
          "PENDING"
      );

    const totalRevenue =
      paidOrders.reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.total ||
              0
          ),
        0
      );

    /*
      9. Response
    */

    return NextResponse.json(
      {
        success: true,

        stats: {
          totalOrders:
            formattedOrders.length,

          paidOrders:
            paidOrders.length,

          pendingOrders:
            pendingOrders.length,

          totalRevenue,
        },

        count:
          formattedOrders.length,

        orders:
          formattedOrders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_ORDERS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading admin orders.",
      },
      {
        status: 500,
      }
    );
  }
}