import { NextResponse } from "next/server";
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

type OrderRow = {
  id: string;
  user_id: string;
  status: string;
  total: number | string;
  created_at?: string | null;
};

async function getAdminAuth() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      status: 500,
      error:
        "Supabase environment variables are missing.",
      supabaseUrl: null,
      supabaseKey: null,
      accessToken: null,
      user: null,
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
      success: false,
      status: 401,
      error:
        "You must be signed in.",
      supabaseUrl,
      supabaseKey,
      accessToken: null,
      user: null,
    };
  }

  /*
    Verify Supabase user
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
    await userResponse.json();

  if (
    !userResponse.ok ||
    !user?.id
  ) {
    return {
      success: false,
      status: 401,
      error:
        "Your session is invalid or expired.",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user: null,
    };
  }

  /*
    Load logged-in user's profile
    and verify ADMIN role.
  */

  const profileResponse =
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        user.id
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

  const profileData =
    await profileResponse.json();

  if (!profileResponse.ok) {
    console.error(
      "ADMIN_CUSTOMERS_AUTH_PROFILE_ERROR:",
      profileData
    );

    return {
      success: false,
      status:
        profileResponse.status ||
        500,
      error:
        profileData?.message ||
        "Unable to verify admin account.",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  const profile =
    Array.isArray(profileData)
      ? profileData[0]
      : undefined;

  if (!profile) {
    return {
      success: false,
      status: 404,
      error:
        "Admin profile was not found.",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  if (
    profile.is_active === false
  ) {
    return {
      success: false,
      status: 403,
      error:
        "Your administrator account has been suspended.",
      code:
        "ACCOUNT_SUSPENDED",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  if (
    String(
      profile.role || ""
    ).toUpperCase() !== "ADMIN"
  ) {
    return {
      success: false,
      status: 403,
      error:
        "You do not have permission to access this resource.",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  return {
    success: true,
    status: 200,
    error: null,
    supabaseUrl,
    supabaseKey,
    accessToken,
    user,
  };
}

/*
  ==========================================================
  GET /api/admin/customers

  ADMIN ONLY

  Returns:
  - customer profile
  - order count
  - paid order count
  - pending order count
  - total spent
  - last order date
  ==========================================================
*/

export async function GET() {
  try {
    const auth =
      await getAdminAuth();

    if (
      !auth.success ||
      !auth.supabaseUrl ||
      !auth.supabaseKey ||
      !auth.accessToken
    ) {
      const response =
        NextResponse.json(
          {
            error:
              auth.error ||
              "Unable to verify admin.",

            ...("code" in auth &&
            auth.code
              ? {
                  code:
                    auth.code,
                }
              : {}),
          },
          {
            status:
              auth.status,
          }
        );

      if (
        auth.status === 401 ||
        ("code" in auth &&
          auth.code ===
            "ACCOUNT_SUSPENDED")
      ) {
        clearAuthCookies(response);
      }

      return response;
    }

    /*
      1. Fetch profiles
    */

    const profilesResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/profiles?select=id,email,first_name,last_name,role,is_active,created_at&order=created_at.desc`,
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

    const profilesData =
      await profilesResponse.json();

    if (!profilesResponse.ok) {
      console.error(
        "ADMIN_CUSTOMERS_PROFILES_ERROR:",
        profilesData
      );

      return NextResponse.json(
        {
          error:
            profilesData?.message ||
            "Unable to load customers.",
        },
        {
          status:
            profilesResponse.status ||
            500,
        }
      );
    }

    const profiles =
      Array.isArray(profilesData)
        ? (profilesData as ProfileRow[])
        : [];

    /*
      2. Fetch orders.

      We use these orders to calculate
      customer purchase statistics.
    */

    const ordersResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/orders?select=id,user_id,status,total,created_at&order=created_at.desc`,
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
        "ADMIN_CUSTOMERS_ORDERS_ERROR:",
        ordersData
      );

      return NextResponse.json(
        {
          error:
            ordersData?.message ||
            "Unable to load customer orders.",
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
      3. Build customer list
    */

    const customers =
      profiles.map(
        (profile) => {
          const customerOrders =
            orders.filter(
              (order) =>
                order.user_id ===
                profile.id
            );

          const paidOrders =
            customerOrders.filter(
              (order) =>
                String(
                  order.status || ""
                ).toUpperCase() ===
                "PAID"
            );

          const pendingOrders =
            customerOrders.filter(
              (order) =>
                String(
                  order.status || ""
                ).toUpperCase() ===
                "PENDING"
            );

          const cancelledOrders =
            customerOrders.filter(
              (order) =>
                [
                  "CANCELLED",
                  "CANCELED",
                ].includes(
                  String(
                    order.status || ""
                  ).toUpperCase()
                )
            );

          /*
            Revenue should only count
            PAID orders.
          */

          const totalSpent =
            paidOrders.reduce(
              (
                total,
                order
              ) =>
                total +
                Number(
                  order.total || 0
                ),
              0
            );

          const firstName =
            profile.first_name ||
            "";

          const lastName =
            profile.last_name ||
            "";

          const name =
            [
              firstName,
              lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

          const latestOrder =
            customerOrders[0];

          return {
            id:
              profile.id,

            email:
              profile.email,

            firstName,

            lastName,

            name:
              name ||
              profile.email ||
              "Customer",

            role:
              profile.role ||
              "CUSTOMER",

            isActive:
              profile.is_active !== false,

            createdAt:
              profile.created_at ||
              null,

            stats: {
              totalOrders:
                customerOrders.length,

              paidOrders:
                paidOrders.length,

              pendingOrders:
                pendingOrders.length,

              cancelledOrders:
                cancelledOrders.length,

              totalSpent,

              lastOrderAt:
                latestOrder
                  ?.created_at ||
                null,
            },
          };
        }
      );

    /*
      4. Dashboard summary
    */

    const customerOnly =
      customers.filter(
        (customer) =>
          String(
            customer.role || ""
          ).toUpperCase() !==
          "ADMIN"
      );

    const admins =
      customers.filter(
        (customer) =>
          String(
            customer.role || ""
          ).toUpperCase() ===
          "ADMIN"
      );

    const activeAccounts =
      customers.filter(
        (customer) =>
          customer.isActive !== false
      );

    const suspendedAccounts =
      customers.filter(
        (customer) =>
          customer.isActive === false
      );

    const totalRevenue =
      orders
        .filter(
          (order) =>
            String(
              order.status || ""
            ).toUpperCase() ===
            "PAID"
        )
        .reduce(
          (total, order) =>
            total +
            Number(
              order.total || 0
            ),
          0
        );

    /*
      5. Return result
    */

    return NextResponse.json(
      {
        success: true,

        stats: {
          totalAccounts:
            customers.length,

          customers:
            customerOnly.length,

          admins:
            admins.length,

          activeAccounts:
            activeAccounts.length,

          suspendedAccounts:
            suspendedAccounts.length,

          totalOrders:
            orders.length,

          totalRevenue,
        },

        customers,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_CUSTOMERS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading customers.",
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

