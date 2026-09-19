import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  is_active?: boolean | null;
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
  product_title: string;
  product_price: number | string;
  quantity: number;
};

export async function GET() {
  try {
    /*
      1. Environment variables
    */

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      2. Read login cookie
    */

    const cookieStore =
      await cookies();

    const accessToken =
      cookieStore.get(
        "pakstore-access-token"
      )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      3. Verify Supabase user
    */

    const userResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/user`,
        {
          method: "GET",

          headers: {
            apikey:
              supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const userData =
      await userResponse.json();

    if (
      !userResponse.ok ||
      !userData?.id
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

      clearAuthCookies(response);

      return response;
    }

    /*
      4. Load profile and verify ADMIN role
         + account status
    */

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          userData.id
        )}&select=id,email,first_name,last_name,role,is_active`,
        {
          method: "GET",

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

    if (!profileResponse.ok) {
      console.error(
        "ADMIN_PROFILE_FETCH_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          error:
            profileData?.message ||
            "Unable to verify admin account.",
        },
        {
          status:
            profileResponse.status ||
            500,
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
            "Profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      profile.is_active === false
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

      clearAuthCookies(response);

      return response;
    }

    if (
      profile.role?.toUpperCase() !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to access the admin dashboard.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Single-owner protection.

      OWNER_ADMIN_USER_ID must match the one Supabase Auth user
      who owns and operates ZonixAssets. Even if another profile
      is accidentally assigned ADMIN, this dashboard route will
      still deny access.
    */

    const ownerAdminUserId =
      process.env.OWNER_ADMIN_USER_ID?.trim();

    if (!ownerAdminUserId) {
      return NextResponse.json(
        {
          code:
            "OWNER_ADMIN_NOT_CONFIGURED",
          error:
            "OWNER_ADMIN_USER_ID is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (userData.id !== ownerAdminUserId) {
      return NextResponse.json(
        {
          code:
            "SINGLE_OWNER_ADMIN_ONLY",
          error:
            "This store is restricted to one owner administrator.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      5. Fetch products
    */

    const productsResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/products?select=id`,
        {
          method: "GET",

          headers: {
            apikey:
              supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const productsData =
      await productsResponse.json();

    if (!productsResponse.ok) {
      console.error(
        "ADMIN_PRODUCTS_FETCH_ERROR:",
        productsData
      );

      return NextResponse.json(
        {
          error:
            productsData?.message ||
            "Unable to load products.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      6. Fetch all profiles for account stats
    */

    const profilesResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=id,role,is_active`,
        {
          method: "GET",

          headers: {
            apikey:
              supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const profilesData =
      await profilesResponse.json();

    if (!profilesResponse.ok) {
      console.error(
        "ADMIN_PROFILES_FETCH_ERROR:",
        profilesData
      );

      return NextResponse.json(
        {
          error:
            profilesData?.message ||
            "Unable to load account statistics.",
        },
        {
          status:
            profilesResponse.status ||
            500,
        }
      );
    }

    const profiles: ProfileRow[] =
      Array.isArray(profilesData)
        ? profilesData
        : [];

    /*
      7. Fetch all orders
    */

    const ordersResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/orders?select=id,order_number,user_id,status,subtotal,service_fee,total,payment_provider,payment_reference,created_at&order=created_at.desc`,
        {
          method: "GET",

          headers: {
            apikey:
              supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
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
          status: 500,
        }
      );
    }

    const orders: OrderRow[] =
      Array.isArray(ordersData)
        ? ordersData
        : [];

    /*
      8. Fetch order items
    */

    const orderItemsResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/order_items?select=id,order_id,product_title,product_price,quantity`,
        {
          method: "GET",

          headers: {
            apikey:
              supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const orderItemsData =
      await orderItemsResponse.json();

    if (!orderItemsResponse.ok) {
      console.error(
        "ADMIN_ORDER_ITEMS_FETCH_ERROR:",
        orderItemsData
      );

      return NextResponse.json(
        {
          error:
            orderItemsData?.message ||
            "Unable to load order items.",
        },
        {
          status: 500,
        }
      );
    }

    const orderItems: OrderItemRow[] =
      Array.isArray(orderItemsData)
        ? orderItemsData
        : [];

    /*
      9. Calculate dashboard stats
    */

    const totalProducts =
      Array.isArray(productsData)
        ? productsData.length
        : 0;

    const totalOrders =
      orders.length;

    const paidOrders =
      orders.filter(
        (order) =>
          order.status?.toUpperCase() ===
          "PAID"
      );

    const pendingOrders =
      orders.filter(
        (order) =>
          order.status?.toUpperCase() ===
          "PENDING"
      );

    const totalRevenue =
      paidOrders.reduce(
        (total, order) =>
          total +
          Number(order.total || 0),
        0
      );

    const totalAccounts =
      profiles.length;

    const activeAccounts =
      profiles.filter(
        (item) =>
          item.is_active !== false
      ).length;

    const suspendedAccounts =
      profiles.filter(
        (item) =>
          item.is_active === false
      ).length;

    const adminAccounts =
      profiles.filter(
        (item) =>
          String(
            item.role || ""
          ).toUpperCase() ===
          "ADMIN"
      ).length;

    const customerAccounts =
      profiles.filter(
        (item) =>
          String(
            item.role || ""
          ).toUpperCase() !==
          "ADMIN"
      ).length;

    /*
      10. Build recent orders
    */

    const recentOrders =
      orders
        .slice(0, 8)
        .map((order) => {
          const items =
            orderItems.filter(
              (item) =>
                item.order_id ===
                order.id
            );

          const itemCount =
            items.reduce(
              (total, item) =>
                total +
                Number(
                  item.quantity || 0
                ),
              0
            );

          const firstProductTitle =
            items[0]?.product_title ||
            "Order";

          return {
            id:
              order.id,

            orderNumber:
              order.order_number,

            userId:
              order.user_id,

            status:
              order.status,

            total:
              Number(
                order.total || 0
              ),

            createdAt:
              order.created_at,

            itemCount,

            firstProductTitle,
          };
        });

    /*
      11. Return admin dashboard
    */

    return NextResponse.json(
      {
        success: true,

        admin: {
          id:
            profile.id,

          email:
            profile.email ||
            userData.email ||
            "",

          firstName:
            profile.first_name ||
            "",

          lastName:
            profile.last_name ||
            "",

          role:
            profile.role ||
            "ADMIN",

          isActive: true,
        },

        stats: {
          totalProducts,

          totalOrders,

          paidOrders:
            paidOrders.length,

          pendingOrders:
            pendingOrders.length,

          totalRevenue,

          totalAccounts,

          activeAccounts,

          suspendedAccounts,

          adminAccounts,

          customerAccounts,
        },

        recentOrders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_DASHBOARD_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading the admin dashboard.",
      },
      {
        status: 500,
      }
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
