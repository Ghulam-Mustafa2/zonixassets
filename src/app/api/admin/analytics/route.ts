import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type ProductRow = {
  id: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total: number | string;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_title: string;
  product_price: number | string;
  quantity: number;
};

function isValidDateInput(
  value: string | null
) {
  if (!value) return true;

  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
}

function startOfLocalDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00`
  ).getTime();
}

function endOfLocalDate(
  value: string
) {
  return new Date(
    `${value}T23:59:59.999`
  ).getTime();
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

export async function GET(
  request: NextRequest
) {
  try {
    /*
      1. Environment
    */

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
      2. Auth cookie
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
      3. Verify user
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

      clearAuthCookies(
        response
      );

      return response;
    }

    /*
      4. Verify active ADMIN profile
    */

    const adminProfileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          userData.id
        )}&select=id,email,first_name,last_name,role,is_active`,
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

    const adminProfileData =
      await adminProfileResponse.json();

    if (
      !adminProfileResponse.ok
    ) {
      return NextResponse.json(
        {
          error:
            adminProfileData?.message ||
            "Unable to verify admin account.",
        },
        {
          status:
            adminProfileResponse.status ||
            500,
        }
      );
    }

    const adminProfile =
      Array.isArray(
        adminProfileData
      )
        ? (adminProfileData[0] as
            | ProfileRow
            | undefined)
        : undefined;

    if (!adminProfile) {
      return NextResponse.json(
        {
          error:
            "Admin profile was not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      adminProfile.is_active ===
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

      return response;
    }

    if (
      String(
        adminProfile.role || ""
      ).toUpperCase() !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to access analytics.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Single-owner protection.

      OWNER_ADMIN_USER_ID must match the one Supabase Auth user
      who owns and operates ZonixAssets. A second profile with an
      ADMIN role will still be denied access to analytics.
    */

    const ownerAdminUserId =
      process.env.OWNER_ADMIN_USER_ID?.trim();

    if (!ownerAdminUserId) {
      return NextResponse.json(
        {
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
      5. Optional date range

      /api/admin/analytics?from=2026-09-01&to=2026-09-30
    */

    const from =
      request.nextUrl.searchParams.get(
        "from"
      );

    const to =
      request.nextUrl.searchParams.get(
        "to"
      );

    if (
      !isValidDateInput(from) ||
      !isValidDateInput(to)
    ) {
      return NextResponse.json(
        {
          error:
            "Date filters must use YYYY-MM-DD format.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      from &&
      to &&
      startOfLocalDate(from) >
        endOfLocalDate(to)
    ) {
      return NextResponse.json(
        {
          error:
            "From date cannot be after To date.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      6. Fetch analytics source data
    */

    const [
      productsResponse,
      profilesResponse,
      ordersResponse,
      orderItemsResponse,
    ] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/products?select=id`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      ),

      fetch(
        `${supabaseUrl}/rest/v1/profiles?select=id,email,first_name,last_name,role,is_active,created_at&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      ),

      fetch(
        `${supabaseUrl}/rest/v1/orders?select=id,order_number,user_id,status,total,created_at&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      ),

      fetch(
        `${supabaseUrl}/rest/v1/order_items?select=id,order_id,product_title,product_price,quantity`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      ),
    ]);

    const [
      productsData,
      profilesData,
      ordersData,
      orderItemsData,
    ] = await Promise.all([
      productsResponse.json(),
      profilesResponse.json(),
      ordersResponse.json(),
      orderItemsResponse.json(),
    ]);

    if (!productsResponse.ok) {
      return NextResponse.json(
        {
          error:
            productsData?.message ||
            "Unable to load products.",
        },
        {
          status:
            productsResponse.status ||
            500,
        }
      );
    }

    if (!profilesResponse.ok) {
      return NextResponse.json(
        {
          error:
            profilesData?.message ||
            "Unable to load profiles.",
        },
        {
          status:
            profilesResponse.status ||
            500,
        }
      );
    }

    if (!ordersResponse.ok) {
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

    if (!orderItemsResponse.ok) {
      return NextResponse.json(
        {
          error:
            orderItemsData?.message ||
            "Unable to load order items.",
        },
        {
          status:
            orderItemsResponse.status ||
            500,
        }
      );
    }

    const products: ProductRow[] =
      Array.isArray(
        productsData
      )
        ? productsData
        : [];

    const profiles: ProfileRow[] =
      Array.isArray(
        profilesData
      )
        ? profilesData
        : [];

    const orders: OrderRow[] =
      Array.isArray(
        ordersData
      )
        ? ordersData
        : [];

    const orderItems: OrderItemRow[] =
      Array.isArray(
        orderItemsData
      )
        ? orderItemsData
        : [];

    /*
      7. Apply order date range
    */

    const fromTime =
      from
        ? startOfLocalDate(
            from
          )
        : null;

    const toTime =
      to
        ? endOfLocalDate(
            to
          )
        : null;

    const filteredOrders =
      orders.filter(
        (order) => {
          const createdAt =
            new Date(
              order.created_at
            ).getTime();

          if (
            Number.isNaN(
              createdAt
            )
          ) {
            return false;
          }

          if (
            fromTime !== null &&
            createdAt < fromTime
          ) {
            return false;
          }

          if (
            toTime !== null &&
            createdAt > toTime
          ) {
            return false;
          }

          return true;
        }
      );

    const filteredOrderIds =
      new Set(
        filteredOrders.map(
          (order) =>
            order.id
        )
      );

    const filteredItems =
      orderItems.filter(
        (item) =>
          filteredOrderIds.has(
            item.order_id
          )
      );

    /*
      8. Core order/revenue stats
    */

    const paidOrders =
      filteredOrders.filter(
        (order) =>
          String(
            order.status || ""
          ).toUpperCase() ===
          "PAID"
      );

    const pendingOrders =
      filteredOrders.filter(
        (order) =>
          String(
            order.status || ""
          ).toUpperCase() ===
          "PENDING"
      );

    const cancelledOrders =
      filteredOrders.filter(
        (order) =>
          String(
            order.status || ""
          ).toUpperCase() ===
          "CANCELLED"
      );

    const refundedOrders =
      filteredOrders.filter(
        (order) =>
          String(
            order.status || ""
          ).toUpperCase() ===
          "REFUNDED"
      );

    const totalRevenue =
      paidOrders.reduce(
        (sum, order) =>
          sum +
          Number(
            order.total || 0
          ),
        0
      );

    const averageOrderValue =
      paidOrders.length > 0
        ? totalRevenue /
          paidOrders.length
        : 0;

    /*
      9. Account stats
    */

    const activeAccounts =
      profiles.filter(
        (profile) =>
          profile.is_active !==
          false
      ).length;

    const suspendedAccounts =
      profiles.filter(
        (profile) =>
          profile.is_active ===
          false
      ).length;

    const adminAccounts =
      profiles.filter(
        (profile) =>
          String(
            profile.role || ""
          ).toUpperCase() ===
          "ADMIN"
      ).length;

    const customerAccounts =
      profiles.length -
      adminAccounts;

    /*
      10. Revenue by day
    */

    const revenueMap =
      new Map<
        string,
        {
          revenue: number;
          orders: number;
        }
      >();

    for (const order of paidOrders) {
      const date =
        new Date(
          order.created_at
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        continue;
      }

      const day =
        date
          .toISOString()
          .slice(0, 10);

      const current =
        revenueMap.get(day) || {
          revenue: 0,
          orders: 0,
        };

      current.revenue +=
        Number(
          order.total || 0
        );

      current.orders += 1;

      revenueMap.set(
        day,
        current
      );
    }

    const revenueByDay =
      Array.from(
        revenueMap.entries()
      )
        .map(
          ([
            date,
            value,
          ]) => ({
            date,
            revenue:
              Number(
                value.revenue.toFixed(
                  2
                )
              ),
            orders:
              value.orders,
          })
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        );

    /*
      11. Order status breakdown
    */

    const orderStatusBreakdown =
      [
        {
          status: "PAID",
          count:
            paidOrders.length,
        },
        {
          status: "PENDING",
          count:
            pendingOrders.length,
        },
        {
          status:
            "CANCELLED",
          count:
            cancelledOrders.length,
        },
        {
          status:
            "REFUNDED",
          count:
            refundedOrders.length,
        },
      ];

    /*
      12. Top selling products

      Count quantity + paid-order revenue only.
    */

    const paidOrderIds =
      new Set(
        paidOrders.map(
          (order) =>
            order.id
        )
      );

    const productMap =
      new Map<
        string,
        {
          title: string;
          quantity: number;
          revenue: number;
        }
      >();

    for (const item of filteredItems) {
      if (
        !paidOrderIds.has(
          item.order_id
        )
      ) {
        continue;
      }

      const title =
        item.product_title ||
        "Untitled Product";

      const quantity =
        Number(
          item.quantity || 0
        );

      const revenue =
        Number(
          item.product_price || 0
        ) * quantity;

      const current =
        productMap.get(title) || {
          title,
          quantity: 0,
          revenue: 0,
        };

      current.quantity +=
        quantity;

      current.revenue +=
        revenue;

      productMap.set(
        title,
        current
      );
    }

    const topProducts =
      Array.from(
        productMap.values()
      )
        .sort(
          (a, b) =>
            b.quantity -
              a.quantity ||
            b.revenue -
              a.revenue
        )
        .slice(
          0,
          10
        )
        .map(
          (product) => ({
            ...product,
            revenue:
              Number(
                product.revenue.toFixed(
                  2
                )
              ),
          })
        );

    /*
      13. Recent signups
    */

    const recentSignups =
      profiles
        .filter(
          (profile) =>
            Boolean(
              profile.created_at
            )
        )
        .slice(
          0,
          8
        )
        .map(
          (profile) => ({
            id:
              profile.id,
            email:
              profile.email ||
              "",
            name:
              [
                profile.first_name ||
                  "",
                profile.last_name ||
                  "",
              ]
                .filter(Boolean)
                .join(" ")
                .trim() ||
              profile.email ||
              "User",
            role:
              String(
                profile.role ||
                  "CUSTOMER"
              ).toUpperCase(),
            isActive:
              profile.is_active !==
              false,
            createdAt:
              profile.created_at,
          })
        );

    /*
      14. Return analytics payload
    */

    return NextResponse.json(
      {
        success: true,

        range: {
          from:
            from || null,
          to:
            to || null,
        },

        summary: {
          totalProducts:
            products.length,

          totalAccounts:
            profiles.length,

          activeAccounts,

          suspendedAccounts,

          adminAccounts,

          customerAccounts,

          totalOrders:
            filteredOrders.length,

          paidOrders:
            paidOrders.length,

          pendingOrders:
            pendingOrders.length,

          cancelledOrders:
            cancelledOrders.length,

          refundedOrders:
            refundedOrders.length,

          totalRevenue:
            Number(
              totalRevenue.toFixed(
                2
              )
            ),

          averageOrderValue:
            Number(
              averageOrderValue.toFixed(
                2
              )
            ),
        },

        revenueByDay,

        orderStatusBreakdown,

        topProducts,

        recentSignups,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_ANALYTICS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading analytics.",
      },
      {
        status: 500,
      }
    );
  }
}
