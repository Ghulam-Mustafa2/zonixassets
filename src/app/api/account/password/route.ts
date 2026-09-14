import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type PasswordBody = {
  newPassword?: string;
  confirmPassword?: string;
};

type ProfileRow = {
  id: string;
  is_active?: boolean | null;
};

export async function PATCH(
  request: Request
) {
  try {
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
            "You must be signed in to change your password.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      Verify logged-in user
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
              "Your session is invalid or expired. Please sign in again.",
          },
          {
            status: 401,
          }
        );

      clearAuthCookies(response);

      return response;
    }

    /*
      Verify account status

      A valid Supabase session is not enough.
      Suspended accounts must not be able
      to change their password.
    */

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          userData.id
        )}&select=id,is_active`,
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
        "PASSWORD_PROFILE_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          error:
            profileData?.message ||
            "Unable to verify your account status.",
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
            "Account profile was not found.",
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
              "Your account has been suspended. Password changes are not available.",
          },
          {
            status: 403,
          }
        );

      clearAuthCookies(response);

      return response;
    }

    /*
      Read request body
    */

    const body =
      (await request.json()) as PasswordBody;

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    /*
      Validation
    */

    if (!newPassword) {
      return NextResponse.json(
        {
          error:
            "New password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters long.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length > 72) {
      return NextResponse.json(
        {
          error:
            "Password is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      newPassword !== confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "New password and confirm password do not match.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Update Supabase Auth password

      This endpoint changes the password
      for the currently authenticated user.
    */

    const updateResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/user`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            apikey: supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            password: newPassword,
          }),

          cache: "no-store",
        }
      );

    const updatedUser =
      await updateResponse.json();

    if (!updateResponse.ok) {
      console.error(
        "PASSWORD_UPDATE_ERROR:",
        updatedUser
      );

      return NextResponse.json(
        {
          error:
            updatedUser?.message ||
            updatedUser?.msg ||
            updatedUser
              ?.error_description ||
            "Unable to update your password.",
        },
        {
          status:
            updateResponse.status ||
            500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Password updated successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ACCOUNT_PASSWORD_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while changing your password.",
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
