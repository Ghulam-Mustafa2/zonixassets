import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
  order_number: string;
  user_id: string;
  status: string;
  subtotal?: number | string | null;
  service_fee?: number | string | null;
  total: number | string;
  payment_provider?: string | null;
  payment_reference?: string | null;
  created_at?: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  product_price: number | string;
  quantity: number;
};

type PatchBody = {
  role?: string;
  isActive?: boolean;
};

type AuditLogInsert = {
  admin_id: string;
  target_user_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
};


async function writeAuditLogs({
  supabaseUrl,
  supabaseKey,
  accessToken,
  rows,
}: {
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
  rows: AuditLogInsert[];
}) {
  if (rows.length === 0) {
    return true;
  }

  try {
    const auditResponse = await fetch(
      `${supabaseUrl}/rest/v1/admin_audit_logs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization:
            `Bearer ${accessToken}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(rows),
        cache: "no-store",
      }
    );

    if (!auditResponse.ok) {
      let auditError: unknown = null;

      try {
        auditError =
          await auditResponse.json();
      } catch {
        auditError =
          "Unable to read audit log error.";
      }

      console.error(
        "ADMIN_AUDIT_LOG_INSERT_ERROR:",
        auditError
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "ADMIN_AUDIT_LOG_ERROR:",
      error
    );

    return false;
  }
}

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

  const cookieStore = await cookies();

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
    Verify logged-in Supabase user
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
    Verify ADMIN role
  */

  const adminProfileResponse =
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

  const adminProfileData =
    await adminProfileResponse.json();

  if (!adminProfileResponse.ok) {
    return {
      success: false,
      status:
        adminProfileResponse.status ||
        500,
      error:
        adminProfileData?.message ||
        "Unable to verify admin account.",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  const adminProfile =
    Array.isArray(
      adminProfileData
    )
      ? adminProfileData[0]
      : undefined;

  if (!adminProfile) {
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
    String(
      adminProfile.role || ""
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

  /*
    Single-owner protection.

    Set OWNER_ADMIN_USER_ID in .env.local to the Supabase Auth
    user ID of the one account that owns and operates the store.
    Even if another profile is accidentally assigned ADMIN in the
    database, that account will not be able to use admin APIs.
  */

  const ownerAdminUserId =
    process.env.OWNER_ADMIN_USER_ID?.trim();

  if (!ownerAdminUserId) {
    return {
      success: false,
      status: 500,
      error:
        "OWNER_ADMIN_USER_ID is not configured.",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  if (user.id !== ownerAdminUserId) {
    return {
      success: false,
      status: 403,
      error:
        "This store is restricted to one owner administrator.",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  if (adminProfile.is_active === false) {
    return {
      success: false,
      status: 403,
      error:
        "Your account is suspended.",
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
  GET /api/admin/customers/[id]

  Returns:
  - customer profile
  - order stats
  - customer orders
  - order items
  ==========================================================
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
          status:
            auth.status,
        }
      );
    }

    const { id } =
      await context.params;

    const customerId =
      id?.trim();

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "Customer ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      1. Load customer profile
    */

    const profileResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          customerId
        )}&select=id,email,first_name,last_name,role,is_active,created_at`,
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

    const profileData =
      await profileResponse.json();

    if (!profileResponse.ok) {
      return NextResponse.json(
        {
          error:
            profileData?.message ||
            "Unable to load customer profile.",
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
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      2. Load customer orders
    */

    const ordersResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/orders?user_id=eq.${encodeURIComponent(
          customerId
        )}&select=id,order_number,user_id,status,subtotal,service_fee,total,payment_provider,payment_reference,created_at&order=created_at.desc`,
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
      3. Load order items
    */

    const orderIds =
      orders.map(
        (order) => order.id
      );

    let orderItems: OrderItemRow[] =
      [];

    if (orderIds.length > 0) {
      const idsFilter =
        orderIds
          .map(
            (orderId) =>
              `"${orderId}"`
          )
          .join(",");

      const itemsResponse =
        await fetch(
          `${auth.supabaseUrl}/rest/v1/order_items?order_id=in.(${encodeURIComponent(
            idsFilter
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

      if (itemsResponse.ok) {
        orderItems =
          Array.isArray(itemsData)
            ? (itemsData as OrderItemRow[])
            : [];
      } else {
        console.error(
          "ADMIN_CUSTOMER_ITEMS_ERROR:",
          itemsData
        );
      }
    }

    /*
      4. Format orders
    */

    const formattedOrders =
      orders.map((order) => {
        const items =
          orderItems.filter(
            (item) =>
              item.order_id ===
              order.id
          );

        const itemCount =
          items.reduce(
            (count, item) =>
              count +
              Number(
                item.quantity || 0
              ),
            0
          );

        return {
          id:
            order.id,

          orderNumber:
            order.order_number,

          status:
            order.status,

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
            order.created_at ||
            null,

          itemCount,

          items:
            items.map(
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
                    item.quantity || 0
                  ),

                lineTotal:
                  Number(
                    item.product_price ||
                      0
                  ) *
                  Number(
                    item.quantity || 0
                  ),
              })
            ),
        };
      });

    /*
      5. Stats
    */

    const paidOrders =
      orders.filter(
        (order) =>
          String(
            order.status || ""
          ).toUpperCase() ===
          "PAID"
      );

    const pendingOrders =
      orders.filter(
        (order) =>
          String(
            order.status || ""
          ).toUpperCase() ===
          "PENDING"
      );

    const cancelledOrders =
      orders.filter(
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

    const totalSpent =
      paidOrders.reduce(
        (total, order) =>
          total +
          Number(
            order.total || 0
          ),
        0
      );

    const firstName =
      profile.first_name || "";

    const lastName =
      profile.last_name || "";

    const fullName =
      [firstName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return NextResponse.json(
      {
        success: true,

        customer: {
          id:
            profile.id,

          email:
            profile.email,

          firstName,

          lastName,

          name:
            fullName ||
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
              orders.length,

            paidOrders:
              paidOrders.length,

            pendingOrders:
              pendingOrders.length,

            cancelledOrders:
              cancelledOrders.length,

            totalSpent,

            lastOrderAt:
              orders[0]
                ?.created_at ||
              null,
          },

          orders:
            formattedOrders,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_CUSTOMER_DETAILS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading customer details.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  ==========================================================
  PATCH /api/admin/customers/[id]

  Single-owner store rules:
  - The configured owner remains the only ADMIN.
  - Customers cannot be promoted to ADMIN.
  - The owner cannot remove their own ADMIN role.
  - Customer activation / suspension is still supported.

  Supported bodies:
  { role: "CUSTOMER" }
  { isActive: false }
  { isActive: true }
  ==========================================================
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
      !auth.accessToken ||
      !auth.user
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
    const customerId = id?.trim();

    if (!customerId) {
      return NextResponse.json(
        {
          error: "Customer ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    let body: PatchBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const hasRoleUpdate =
      typeof body?.role === "string";

    const hasActiveUpdate =
      typeof body?.isActive === "boolean";

    if (!hasRoleUpdate && !hasActiveUpdate) {
      return NextResponse.json(
        {
          error:
            "Provide role or isActive to update.",
        },
        {
          status: 400,
        }
      );
    }

    const targetResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        customerId
      )}&select=id,email,first_name,last_name,role,is_active,created_at`,
      {
        method: "GET",
        headers: {
          apikey: auth.supabaseKey,
          Authorization:
            `Bearer ${auth.accessToken}`,
        },
        cache: "no-store",
      }
    );

    const targetData =
      await targetResponse.json();

    if (!targetResponse.ok) {
      return NextResponse.json(
        {
          error:
            targetData?.message ||
            "Unable to load customer.",
        },
        {
          status:
            targetResponse.status || 500,
        }
      );
    }

    const targetProfile =
      Array.isArray(targetData)
        ? (targetData[0] as
            | ProfileRow
            | undefined)
        : undefined;

    if (!targetProfile) {
      return NextResponse.json(
        {
          error: "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const updatePayload: {
      role?: string;
      is_active?: boolean;
    } = {};

    let requestedRole: string | null = null;

    if (hasRoleUpdate) {
      requestedRole = String(body.role)
        .trim()
        .toUpperCase();

      if (
        !["ADMIN", "CUSTOMER"].includes(
          requestedRole
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Role must be ADMIN or CUSTOMER.",
          },
          {
            status: 400,
          }
        );
      }

      /*
        The owner account is the only ADMIN account allowed.
        Any attempt to promote a different profile is rejected
        at the API layer, even if the UI is bypassed.
      */
      if (
        requestedRole === "ADMIN" &&
        customerId !== auth.user.id
      ) {
        return NextResponse.json(
          {
            error:
              "This store supports one owner administrator only. Customer accounts cannot be promoted to ADMIN.",
            code: "SINGLE_OWNER_ADMIN_ONLY",
          },
          {
            status: 403,
          }
        );
      }

      if (
        customerId === auth.user.id &&
        requestedRole !== "ADMIN"
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot remove your own ADMIN role.",
          },
          {
            status: 400,
          }
        );
      }

      const currentRole = String(
        targetProfile.role || "CUSTOMER"
      ).toUpperCase();

      if (currentRole !== requestedRole) {
        updatePayload.role = requestedRole;
      }
    }

    if (hasActiveUpdate) {
      const requestedIsActive =
        body.isActive as boolean;

      if (
        customerId === auth.user.id &&
        requestedIsActive === false
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot suspend your own account.",
          },
          {
            status: 400,
          }
        );
      }

      const currentIsActive =
        targetProfile.is_active !== false;

      if (
        currentIsActive !== requestedIsActive
      ) {
        updatePayload.is_active =
          requestedIsActive;
      }
    }

    if (
      Object.keys(updatePayload).length === 0
    ) {
      return NextResponse.json(
        {
          success: true,
          message:
            "No changes were required.",
          customer: {
            id: targetProfile.id,
            email: targetProfile.email,
            firstName:
              targetProfile.first_name || "",
            lastName:
              targetProfile.last_name || "",
            role:
              String(
                targetProfile.role ||
                  "CUSTOMER"
              ).toUpperCase(),
            isActive:
              targetProfile.is_active !== false,
          },
        },
        {
          status: 200,
        }
      );
    }

    const updateResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        customerId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
          apikey: auth.supabaseKey,
          Authorization:
            `Bearer ${auth.accessToken}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      let updateErrorData: {
        message?: string;
      } | null = null;

      try {
        updateErrorData =
          await updateResponse.json();
      } catch {
        updateErrorData = null;
      }

      console.error(
        "ADMIN_CUSTOMER_UPDATE_ERROR:",
        updateErrorData
      );

      return NextResponse.json(
        {
          error:
            updateErrorData?.message ||
            "Unable to update customer account.",
        },
        {
          status:
            updateResponse.status || 500,
        }
      );
    }

    const refreshedProfileResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          customerId
        )}&select=id,email,first_name,last_name,role,is_active,created_at`,
        {
          method: "GET",
          headers: {
            apikey: auth.supabaseKey,
            Authorization:
              `Bearer ${auth.accessToken}`,
          },
          cache: "no-store",
        }
      );

    const refreshedProfileData =
      await refreshedProfileResponse.json();

    if (!refreshedProfileResponse.ok) {
      console.error(
        "ADMIN_CUSTOMER_REFRESH_ERROR:",
        refreshedProfileData
      );

      return NextResponse.json(
        {
          error:
            refreshedProfileData?.message ||
            "Account was updated, but the customer profile could not be refreshed.",
        },
        {
          status:
            refreshedProfileResponse.status ||
            500,
        }
      );
    }

    const updatedProfile =
      Array.isArray(refreshedProfileData)
        ? (refreshedProfileData[0] as
            | ProfileRow
            | undefined)
        : undefined;

    if (!updatedProfile) {
      return NextResponse.json(
        {
          error:
            "Account update completed, but customer profile could not be found afterward.",
        },
        {
          status: 404,
        }
      );
    }

    const finalRole = String(
      updatedProfile.role || "CUSTOMER"
    ).toUpperCase();

    const finalIsActive =
      updatedProfile.is_active !== false;

    if (
      requestedRole !== null &&
      finalRole !== requestedRole
    ) {
      return NextResponse.json(
        {
          error:
            "The database did not apply the requested role change. Please check the profiles UPDATE RLS policy.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      hasActiveUpdate &&
      finalIsActive !== body.isActive
    ) {
      return NextResponse.json(
        {
          error:
            "The database did not apply the requested account status change. Please check the profiles UPDATE RLS policy.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Write audit logs only after the database
      update has been successfully verified.
    */

    const auditRows: AuditLogInsert[] = [];

    const oldRole = String(
      targetProfile.role || "CUSTOMER"
    ).toUpperCase();

    const oldIsActive =
      targetProfile.is_active !== false;

    if (
      updatePayload.role &&
      oldRole !== finalRole
    ) {
      auditRows.push({
        admin_id: auth.user.id,
        target_user_id: customerId,
        action:
          finalRole === "ADMIN"
            ? "ROLE_CHANGED_TO_ADMIN"
            : "ROLE_CHANGED_TO_CUSTOMER",
        old_value: {
          role: oldRole,
        },
        new_value: {
          role: finalRole,
        },
      });
    }

    if (
      typeof updatePayload.is_active ===
        "boolean" &&
      oldIsActive !== finalIsActive
    ) {
      auditRows.push({
        admin_id: auth.user.id,
        target_user_id: customerId,
        action:
          finalIsActive
            ? "ACCOUNT_ACTIVATED"
            : "ACCOUNT_SUSPENDED",
        old_value: {
          isActive:
            oldIsActive,
        },
        new_value: {
          isActive:
            finalIsActive,
        },
      });
    }

    const auditLogged =
      await writeAuditLogs({
        supabaseUrl:
          auth.supabaseUrl,
        supabaseKey:
          auth.supabaseKey,
        accessToken:
          auth.accessToken,
        rows: auditRows,
      });

    let message =
      "Customer account updated successfully.";

    if (
      hasRoleUpdate &&
      hasActiveUpdate
    ) {
      message =
        `Account role updated to ${finalRole} and account ${
          finalIsActive
            ? "activated"
            : "suspended"
        }.`;
    } else if (hasRoleUpdate) {
      message =
        `Account role updated to ${finalRole}.`;
    } else if (hasActiveUpdate) {
      message = finalIsActive
        ? "Customer account activated successfully."
        : "Customer account suspended successfully.";
    }

    return NextResponse.json(
      {
        success: true,
        message,
        auditLogged,
        customer: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          firstName:
            updatedProfile.first_name || "",
          lastName:
            updatedProfile.last_name || "",
          role: finalRole,
          isActive: finalIsActive,
          createdAt:
            updatedProfile.created_at || null,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_CUSTOMER_UPDATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating the customer.",
      },
      {
        status: 500,
      }
    );
  }
}
