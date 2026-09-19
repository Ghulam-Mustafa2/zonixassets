import { NextResponse } from "next/server";

type ProfileRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      String(
        body?.email || ""
      ).trim();

    const password =
      String(
        body?.password || ""
      );

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

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
      Authenticate with Supabase
    */

    const authResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            apikey:
              supabaseKey,
          },

          body: JSON.stringify({
            email,
            password,
          }),

          cache: "no-store",
        }
      );

    const authData =
      await authResponse
        .json()
        .catch(() => null);

    if (!authResponse.ok) {
      return NextResponse.json(
        {
          error:
            authData?.msg ||
            authData?.message ||
            authData
              ?.error_description ||
            "Invalid email or password.",
        },
        {
          status:
            authResponse.status,
        }
      );
    }

    if (
      !authData?.access_token ||
      !authData?.user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "Login succeeded but session data was not returned.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Load fresh account profile.

      We do not trust user_metadata
      for role or suspension status.
    */

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          authData.user.id
        )}&select=id,email,first_name,last_name,role,is_active`,
        {
          method: "GET",

          headers: {
            apikey:
              supabaseKey,

            Authorization:
              `Bearer ${authData.access_token}`,
          },

          cache: "no-store",
        }
      );

    let profileData:
      | ProfileRow[]
      | {
          message?: string;
        };

    try {
      profileData =
        await profileResponse.json();
    } catch {
      profileData = [];
    }

    if (!profileResponse.ok) {
      console.error(
        "LOGIN_PROFILE_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          error:
            !Array.isArray(
              profileData
            ) &&
            profileData?.message
              ? profileData.message
              : "Unable to load account profile.",
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
        ? profileData[0]
        : undefined;

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Account profile was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Block suspended account
      before creating PakStore cookies.
    */

    if (
      profile.is_active === false
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "ACCOUNT_SUSPENDED",

          error:
            "Your account has been suspended. Please contact support if you believe this is a mistake.",
        },
        {
          status: 403,
        }
      );
    }

    const role =
      String(
        profile.role ||
          "CUSTOMER"
      ).toUpperCase();

    /*
      Single-owner ADMIN protection.

      Customers may sign in normally.

      If an account has ADMIN role, it must be the exact
      Supabase Auth user configured in OWNER_ADMIN_USER_ID.
      This prevents a second accidentally-promoted ADMIN
      account from receiving a valid application session.
    */

    if (role === "ADMIN") {
      const ownerAdminUserId =
        process.env.OWNER_ADMIN_USER_ID?.trim();

      if (!ownerAdminUserId) {
        return NextResponse.json(
          {
            success: false,

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

      if (
        authData.user.id !==
        ownerAdminUserId
      ) {
        return NextResponse.json(
          {
            success: false,

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
    }

    /*
      Login successful.
      Create response first.
    */

    const nextResponse =
      NextResponse.json(
        {
          success: true,

          user: {
            id:
              profile.id ||
              authData.user.id,

            email:
              profile.email ||
              authData.user.email ||
              email,

            firstName:
              profile.first_name ||
              authData.user
                ?.user_metadata
                ?.first_name ||
              "",

            lastName:
              profile.last_name ||
              authData.user
                ?.user_metadata
                ?.last_name ||
              "",

            role,

            isActive: true,
          },

          message:
            "Signed in successfully.",
        },
        {
          status: 200,
        }
      );

    /*
      ACCESS TOKEN
    */

    nextResponse.cookies.set(
      "pakstore-access-token",
      authData.access_token,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path: "/",

        maxAge:
          typeof authData.expires_in ===
          "number"
            ? authData.expires_in
            : 3600,
      }
    );

    /*
      REFRESH TOKEN
    */

    if (
      authData.refresh_token
    ) {
      nextResponse.cookies.set(
        "pakstore-refresh-token",
        authData.refresh_token,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite: "lax",

          path: "/",

          maxAge:
            60 *
            60 *
            24 *
            30,
        }
      );
    }

    return nextResponse;
  } catch (error) {
    console.error(
      "LOGIN_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while signing in.",
      },
      {
        status: 500,
      }
    );
  }
}
