import {
  NextRequest,
  NextResponse,
} from "next/server";

type ProfileRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

export async function GET(
  request: NextRequest
) {
  try {
    /*
      Get current access token
    */

    const accessToken =
      request.cookies.get(
        "pakstore-access-token"
      )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          authenticated: false,
          error:
            "Access token not found.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      Supabase configuration
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
          authenticated: false,
          error:
            "Authentication service is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Verify Supabase Auth user
    */

    const authResponse =
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

    const authUser =
      await authResponse.json();

    if (
      !authResponse.ok ||
      !authUser?.id
    ) {
      console.error(
        "ME_AUTH_ERROR:",
        authUser
      );

      const response =
        NextResponse.json(
          {
            authenticated: false,
            error:
              authUser?.message ||
              "Session is invalid or expired.",
          },
          {
            status: 401,
          }
        );

      clearAuthCookies(response);

      return response;
    }

    /*
      Load fresh profile from database.

      Important:
      Role and account status should come
      from public.profiles instead of
      user_metadata because admin changes
      happen in the profiles table.
    */

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          authUser.id
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
        "ME_PROFILE_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          authenticated: false,
          error:
            !Array.isArray(
              profileData
            ) &&
            profileData?.message
              ? profileData.message
              : "Unable to load your account profile.",
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
          authenticated: false,
          error:
            "Account profile was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Block suspended accounts.

      The user may still possess a valid
      Supabase JWT, but PakStore will no
      longer accept the account session.
    */

    if (
      profile.is_active === false
    ) {
      const response =
        NextResponse.json(
          {
            authenticated: false,

            code:
              "ACCOUNT_SUSPENDED",

            error:
              "Your account has been suspended. Please contact support if you believe this is a mistake.",
          },
          {
            status: 403,
          }
        );

      clearAuthCookies(response);

      return response;
    }

    /*
      Normalize role
    */

    const role =
      String(
        profile.role ||
          "CUSTOMER"
      ).toUpperCase();

    /*
      Successful authenticated response
    */

    return NextResponse.json(
      {
        authenticated: true,

        user: {
          id:
            profile.id ||
            authUser.id,

          email:
            profile.email ||
            authUser.email ||
            "",

          firstName:
            profile.first_name ||
            authUser.user_metadata
              ?.first_name ||
            "",

          lastName:
            profile.last_name ||
            authUser.user_metadata
              ?.last_name ||
            "",

          role,

          isActive: true,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        error:
          "Something went wrong while checking your session.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  Remove PakStore authentication cookies.

  If your project has additional auth
  cookie names, they can also be added
  here later.
*/

function clearAuthCookies(
  response: NextResponse
) {
  response.cookies.set(
    "pakstore-access-token",
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge: 0,
    }
  );

  response.cookies.set(
    "pakstore-refresh-token",
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge: 0,
    }
  );
}