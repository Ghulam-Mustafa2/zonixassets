import {
  NextRequest,
  NextResponse,
} from "next/server";

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const accessToken =
      request.cookies.get(
        "pakstore-access-token"
      )?.value;

    /*
      Best-effort Supabase sign-out.

      Even if this remote sign-out fails,
      the local application cookies are
      still cleared below so the user is
      signed out of ZonixAssets.
    */

    if (
      supabaseUrl &&
      supabaseKey &&
      accessToken
    ) {
      try {
        const signOutResponse =
          await fetch(
            `${supabaseUrl}/auth/v1/logout`,
            {
              method: "POST",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache: "no-store",
            }
          );

        if (!signOutResponse.ok) {
          const signOutError =
            await signOutResponse
              .json()
              .catch(() => null);

          console.error(
            "SUPABASE_LOGOUT_ERROR:",
            signOutError
          );
        }
      } catch (error) {
        console.error(
          "SUPABASE_LOGOUT_REQUEST_ERROR:",
          error
        );
      }
    }

    const response =
      NextResponse.json(
        {
          success: true,

          message:
            "Signed out successfully.",
        },
        {
          status: 200,
        }
      );

    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error(
      "LOGOUT_ERROR:",
      error
    );

    /*
      Always clear local cookies even if
      an unexpected logout error occurs.
    */

    const response =
      NextResponse.json(
        {
          success: true,

          message:
            "Signed out successfully.",
        },
        {
          status: 200,
        }
      );

    clearAuthCookies(response);

    return response;
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
