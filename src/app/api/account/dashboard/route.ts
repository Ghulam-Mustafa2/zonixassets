import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    role?: string;
  };
};

type ProfileRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
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
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  product_price: number | string;
  quantity: number;
  created_at?: string;
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

function numberValue(
  value: number | string | null | undefined
) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  try {
    /*
      1. Environment variables
    */

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
      2. Access token
    */

    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get(
        "pakstore-access-token"
      )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to view your account.",
        },
        { status: 401 }
      );
    }

    /*
      3. Verify current user
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

    const userData =
      (await userResponse.json()) as SupabaseUser;

    if (!userResponse.ok || !userData?.id) {
      const response = NextResponse.json(
        {
          error:
            "Your session is invalid or expired.",
        },
        { status: 401 }
      );

      clearAuthCookies(response);

      return response;
    }

    /*
      4. Load fresh profile + verify account status

      Role, names and account status come from
      public.profiles instead of user_metadata.
    */

    const profileResponse =
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

    const profileData =
      await profileResponse.json();

    if (!profileResponse.ok) {
      console.error(
        "DASHBOARD_PROFILE_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          error:
            profileData?.message ||
            "Unable to load your account profile.",
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
            "Your account has been suspended. Please contact support if you believe this is a mistake.",
        },
        { status: 403 }
      );

      clearAuthCookies(response);

      return response;
    }

    /*
      5. Load user's orders
    */

    const ordersResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?user_id=eq.${encodeURIComponent(
        userData.id
      )}&select=id,order_number,user_id,status,subtotal,service_fee,total,created_at&order=created_at.desc`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const ordersData =
      await ordersResponse.json();

    if (!ordersResponse.ok) {
      console.error(
        "DASHBOARD_ORDERS_ERROR:",
        ordersData
      );

      return NextResponse.json(
        {
          error:
            ordersData?.message ||
            "Unable to load your orders.",
        },
        { status: 500 }
      );
    }

    const orders = Array.isArray(ordersData)
      ? (ordersData as OrderRow[])
      : [];

    /*
      6. Load order items
    */

    let orderItems: OrderItemRow[] = [];

    if (orders.length > 0) {
      const orderIds = orders.map(
        (order) => order.id
      );

      const idsFilter =
        orderIds.join(",");

      const orderItemsResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/order_items?order_id=in.(${encodeURIComponent(
            idsFilter
          )})&select=id,order_id,product_id,product_title,product_price,quantity,created_at`,
          {
            method: "GET",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );

      const orderItemsData =
        await orderItemsResponse.json();

      if (!orderItemsResponse.ok) {
        console.error(
          "DASHBOARD_ORDER_ITEMS_ERROR:",
          orderItemsData
        );

        return NextResponse.json(
          {
            error:
              orderItemsData?.message ||
              "Unable to load order items.",
          },
          { status: 500 }
        );
      }

      orderItems = Array.isArray(
        orderItemsData
      )
        ? (orderItemsData as OrderItemRow[])
        : [];
    }

    /*
      7. Format orders
    */

    const formattedOrders =
      orders.map((order) => {
        const itemsForOrder =
          orderItems.filter(
            (item) =>
              item.order_id === order.id
          );

        return {
          id: order.id,

          orderNumber:
            order.order_number,

          status:
            order.status || "PENDING",

          subtotal: numberValue(
            order.subtotal
          ),

          serviceFee: numberValue(
            order.service_fee
          ),

          total: numberValue(
            order.total
          ),

          createdAt:
            order.created_at,

          items: itemsForOrder.map(
            (item) => ({
              id: item.id,

              productId:
                item.product_id ||
                undefined,

              productTitle:
                item.product_title,

              productPrice:
                numberValue(
                  item.product_price
                ),

              quantity:
                Number(item.quantity) ||
                1,
            })
          ),
        };
      });

    /*
      8. Paid orders
    */

    const paidOrders =
      formattedOrders.filter(
        (order) =>
          order.status.toUpperCase() ===
          "PAID"
      );

    /*
      9. Statistics
    */

    const totalPurchases =
      paidOrders.length;

    const lifetimeSpent =
      paidOrders.reduce(
        (total, order) =>
          total + order.total,
        0
      );

    /*
      10. Load actual download entitlements

      This is the important change.

      We now read from public.downloads
      instead of deriving downloads from
      PAID order items.
    */

    const downloadsResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/downloads?user_id=eq.${encodeURIComponent(
          userData.id
        )}&select=id,user_id,order_item_id,download_count,max_downloads,expires_at,created_at&order=created_at.desc`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const downloadsData =
      await downloadsResponse.json();

    if (!downloadsResponse.ok) {
      console.error(
        "DASHBOARD_DOWNLOADS_ERROR:",
        downloadsData
      );

      return NextResponse.json(
        {
          error:
            downloadsData?.message ||
            "Unable to load your downloads.",
        },
        { status: 500 }
      );
    }

    const downloadRows =
      Array.isArray(downloadsData)
        ? (downloadsData as DownloadRow[])
        : [];

    /*
      11. Join downloads with order_items

      downloads.order_item_id
      -> order_items.id
    */

    const downloads = downloadRows
      .map((download) => {
        const matchingItem =
          orderItems.find(
            (item) =>
              item.id ===
              download.order_item_id
          );

        if (!matchingItem) {
          return null;
        }

        return {
          /*
            IMPORTANT:
            This id must be downloads.id
            because secure route will be:
            /api/downloads/[download-id]
          */
          id: download.id,

          productId:
            matchingItem.product_id ||
            undefined,

          title:
            matchingItem.product_title,

          type: "Digital Product",

          downloadUrl: null,

          downloadCount:
            Number(
              download.download_count
            ) || 0,

          maxDownloads:
            Number(
              download.max_downloads
            ) || 10,

          expiresAt:
            download.expires_at,
        };
      })
      .filter(
        (
          download
        ): download is NonNullable<
          typeof download
        > => download !== null
      );

    /*
      12. Count only currently usable downloads
    */

    const now = Date.now();

    const availableDownloads =
      downloads.filter((download) => {
        const remaining =
          download.maxDownloads -
          download.downloadCount;

        const expired =
          download.expiresAt
            ? new Date(
                download.expiresAt
              ).getTime() < now
            : false;

        return (
          remaining > 0 &&
          !expired
        );
      }).length;

    /*
      13. Return dashboard
    */

    return NextResponse.json(
      {
        success: true,

        user: {
          id: profile.id || userData.id,

          email:
            profile.email ||
            userData.email ||
            "",

          firstName:
            profile.first_name ||
            userData.user_metadata
              ?.first_name ||
            "",

          lastName:
            profile.last_name ||
            userData.user_metadata
              ?.last_name ||
            "",

          role:
            String(
              profile.role ||
                "CUSTOMER"
            ).toUpperCase(),

          isActive: true,
        },

        stats: {
          totalPurchases,
          availableDownloads,
          lifetimeSpent,
        },

        orders:
          formattedOrders,

        downloads,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ACCOUNT_DASHBOARD_API_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading your dashboard.",
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

