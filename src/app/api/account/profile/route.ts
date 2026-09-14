import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProfileBody = {
  firstName?: string;
  lastName?: string;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

export async function PATCH(
  request: Request
) {
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
      2. Login cookie
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
            "You must be signed in to update your profile.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      3. Verify current user
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
      4. Load fresh profile and verify status

      public.profiles is the source of truth
      for role and suspension status.
    */

    const currentProfileResponse =
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

    const currentProfileData =
      await currentProfileResponse.json();

    if (!currentProfileResponse.ok) {
      console.error(
        "PROFILE_STATUS_FETCH_ERROR:",
        currentProfileData
      );

      return NextResponse.json(
        {
          error:
            currentProfileData?.message ||
            "Unable to verify your account status.",
        },
        {
          status:
            currentProfileResponse.status ||
            500,
        }
      );
    }

    const currentProfile =
      Array.isArray(
        currentProfileData
      )
        ? (currentProfileData[0] as
            | ProfileRow
            | undefined)
        : undefined;

    if (!currentProfile) {
      return NextResponse.json(
        {
          error:
            "Your profile record could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      currentProfile.is_active ===
      false
    ) {
      const response =
        NextResponse.json(
          {
            code:
              "ACCOUNT_SUSPENDED",

            error:
              "Your account has been suspended. Profile changes are not available.",
          },
          {
            status: 403,
          }
        );

      clearAuthCookies(response);

      return response;
    }

    /*
      5. Read form data
    */

    const body =
      (await request.json()) as ProfileBody;

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    /*
      6. Validation
    */

    if (!firstName) {
      return NextResponse.json(
        {
          error:
            "First name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!lastName) {
      return NextResponse.json(
        {
          error:
            "Last name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (firstName.length > 80) {
      return NextResponse.json(
        {
          error:
            "First name is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (lastName.length > 80) {
      return NextResponse.json(
        {
          error:
            "Last name is too long.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      7. Update public.profiles

      Only first_name and last_name are
      updated here. Role and account status
      cannot be changed by this customer route.
    */

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          userData.id
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            apikey: supabaseKey,

            Authorization:
              `Bearer ${accessToken}`,

            Prefer:
              "return=representation",
          },

          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
          }),

          cache: "no-store",
        }
      );

    const profileData =
      await profileResponse.json();

    if (!profileResponse.ok) {
      console.error(
        "PROFILE_DATABASE_UPDATE_ERROR:",
        profileData
      );

      return NextResponse.json(
        {
          error:
            profileData?.message ||
            "Unable to update your profile.",
        },
        {
          status:
            profileResponse.status ||
            500,
        }
      );
    }

    const updatedProfile =
      Array.isArray(profileData)
        ? (profileData[0] as
            | ProfileRow
            | undefined)
        : (profileData as
            | ProfileRow
            | undefined);

    if (!updatedProfile) {
      return NextResponse.json(
        {
          error:
            "Your profile record could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      8. Keep Supabase Auth metadata synced

      Role comes from public.profiles,
      not from browser input or stale metadata.
    */

    const currentRole =
      String(
        updatedProfile.role ||
          currentProfile.role ||
          "CUSTOMER"
      ).toUpperCase();

    const authUpdateResponse =
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
            data: {
              ...userData.user_metadata,

              first_name: firstName,

              last_name: lastName,

              role: currentRole,
            },
          }),

          cache: "no-store",
        }
      );

    const updatedAuthUser =
      await authUpdateResponse.json();

    if (!authUpdateResponse.ok) {
      console.error(
        "PROFILE_AUTH_METADATA_UPDATE_ERROR:",
        updatedAuthUser
      );

      return NextResponse.json(
        {
          error:
            updatedAuthUser?.message ||
            updatedAuthUser?.msg ||
            "Profile database was updated, but account metadata could not be synchronized.",
        },
        {
          status:
            authUpdateResponse.status ||
            500,
        }
      );
    }

    /*
      9. Return updated profile
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Profile updated successfully.",

        user: {
          id: userData.id,

          email:
            updatedProfile.email ||
            updatedAuthUser?.email ||
            userData.email ||
            "",

          firstName,

          lastName,

          role: currentRole,

          isActive: true,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PROFILE_UPDATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating your profile.",
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
