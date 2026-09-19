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

type AuditLogRow = {
  id: string;
  admin_id: string;
  target_user_id: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
};

async function getAdminAuth() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      status: 500,
      error:
        "Supabase environment variables are missing.",
      code: null as string | null,
      supabaseUrl: null as string | null,
      supabaseKey: null as string | null,
      accessToken: null as string | null,
      user: null as
        | {
            id?: string;
          }
        | null,
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
      code: null as string | null,
      supabaseUrl,
      supabaseKey,
      accessToken: null as string | null,
      user: null as
        | {
            id?: string;
          }
        | null,
    };
  }

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
      code: null as string | null,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user: null as
        | {
            id?: string;
          }
        | null,
    };
  }

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
    return {
      success: false,
      status:
        profileResponse.status || 500,
      error:
        profileData?.message ||
        "Unable to verify admin account.",
      code: null as string | null,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
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
      status: 404,
      error:
        "Admin profile was not found.",
      code: null as string | null,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  if (profile.is_active === false) {
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
        "You do not have permission to access audit logs.",
      code: null as string | null,
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  /*
    Single-owner protection.

    OWNER_ADMIN_USER_ID must match the one Supabase Auth user
    who owns and operates ZonixAssets. Even if another profile
    is assigned ADMIN, it cannot access audit logs.
  */

  const ownerAdminUserId =
    process.env.OWNER_ADMIN_USER_ID?.trim();

  if (!ownerAdminUserId) {
    return {
      success: false,
      status: 500,
      error:
        "OWNER_ADMIN_USER_ID is not configured.",
      code:
        "OWNER_ADMIN_NOT_CONFIGURED",
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
      code:
        "SINGLE_OWNER_ADMIN_ONLY",
      supabaseUrl,
      supabaseKey,
      accessToken,
      user,
    };
  }

  return {
    success: true,
    status: 200,
    error: null as string | null,
    code: null as string | null,
    supabaseUrl,
    supabaseKey,
    accessToken,
    user,
  };
}

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
            ...(auth.code
              ? {
                  code: auth.code,
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
        auth.code ===
          "ACCOUNT_SUSPENDED"
      ) {
        clearAuthCookies(response);
      }

      return response;
    }

    /*
      1. Load audit log rows
    */

    const logsResponse =
      await fetch(
        `${auth.supabaseUrl}/rest/v1/admin_audit_logs?select=id,admin_id,target_user_id,action,old_value,new_value,created_at&order=created_at.desc&limit=200`,
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

    const logsData =
      await logsResponse.json();

    if (!logsResponse.ok) {
      console.error(
        "ADMIN_AUDIT_LOGS_FETCH_ERROR:",
        logsData
      );

      return NextResponse.json(
        {
          error:
            logsData?.message ||
            "Unable to load audit logs.",
        },
        {
          status:
            logsResponse.status ||
            500,
        }
      );
    }

    const logs =
      Array.isArray(logsData)
        ? (logsData as AuditLogRow[])
        : [];

    /*
      2. Collect all related profile IDs
    */

    const relatedIds =
      Array.from(
        new Set(
          logs
            .flatMap((log) => [
              log.admin_id,
              log.target_user_id,
            ])
            .filter(
              (
                value
              ): value is string =>
                typeof value ===
                  "string" &&
                value.length > 0
            )
        )
      );

    let profiles: ProfileRow[] = [];

    if (relatedIds.length > 0) {
      const idsFilter =
        relatedIds
          .map(
            (id) =>
              `"${id}"`
          )
          .join(",");

      const profilesResponse =
        await fetch(
          `${auth.supabaseUrl}/rest/v1/profiles?id=in.(${encodeURIComponent(
            idsFilter
          )})&select=id,email,first_name,last_name,role,is_active`,
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
          "ADMIN_AUDIT_PROFILES_FETCH_ERROR:",
          profilesData
        );

        return NextResponse.json(
          {
            error:
              profilesData?.message ||
              "Unable to load audit log account details.",
          },
          {
            status:
              profilesResponse.status ||
              500,
          }
        );
      }

      profiles =
        Array.isArray(
          profilesData
        )
          ? (profilesData as ProfileRow[])
          : [];
    }

    /*
      3. Build profile lookup
    */

    const profileMap =
      new Map(
        profiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    /*
      4. Format logs
    */

    const formattedLogs =
      logs.map((log) => {
        const admin =
          profileMap.get(
            log.admin_id
          );

        const target =
          log.target_user_id
            ? profileMap.get(
                log.target_user_id
              )
            : undefined;

        const adminName =
          [
            admin?.first_name ||
              "",
            admin?.last_name ||
              "",
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

        const targetName =
          [
            target?.first_name ||
              "",
            target?.last_name ||
              "",
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return {
          id:
            log.id,

          action:
            log.action,

          createdAt:
            log.created_at,

          oldValue:
            log.old_value,

          newValue:
            log.new_value,

          admin: {
            id:
              log.admin_id,

            name:
              adminName ||
              admin?.email ||
              "Unknown Admin",

            email:
              admin?.email ||
              null,

            role:
              admin?.role ||
              null,
          },

          targetUser:
            log.target_user_id
              ? {
                  id:
                    log.target_user_id,

                  name:
                    targetName ||
                    target?.email ||
                    "Unknown User",

                  email:
                    target?.email ||
                    null,

                  role:
                    target?.role ||
                    null,

                  isActive:
                    target
                      ? target.is_active !==
                        false
                      : null,
                }
              : null,
        };
      });

    /*
      5. Summary stats
    */

    const stats = {
      totalLogs:
        formattedLogs.length,

      suspended:
        formattedLogs.filter(
          (log) =>
            log.action ===
            "ACCOUNT_SUSPENDED"
        ).length,

      activated:
        formattedLogs.filter(
          (log) =>
            log.action ===
            "ACCOUNT_ACTIVATED"
        ).length,

      promotedToAdmin:
        formattedLogs.filter(
          (log) =>
            log.action ===
            "ROLE_CHANGED_TO_ADMIN"
        ).length,

      changedToCustomer:
        formattedLogs.filter(
          (log) =>
            log.action ===
            "ROLE_CHANGED_TO_CUSTOMER"
        ).length,
    };

    return NextResponse.json(
      {
        success: true,
        stats,
        logs:
          formattedLogs,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_AUDIT_LOGS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading audit logs.",
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
