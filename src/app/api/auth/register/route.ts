import { NextResponse } from "next/server";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

export async function POST(
  request: Request
) {
  try {
    /*
      1. Read and normalize input
    */

    const body =
      (await request.json()) as RegisterBody;

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    /*
      2. Validation
    */

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "All fields are required.",
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
      Basic email format validation.
      Supabase will still perform its own
      email validation as well.
    */

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        {
          error:
            "Email address is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length > 72) {
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

    /*
      3. Supabase configuration
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
      4. Create Supabase Auth user

      SECURITY:
      - Role is hard-coded to CUSTOMER.
      - The browser cannot choose ADMIN.
      - Account activation status belongs
        in public.profiles.is_active.
      - public.profiles.is_active already has
        a database default of true.
    */

    const signupResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/signup`,
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

            data: {
              first_name:
                firstName,

              last_name:
                lastName,

              role:
                "CUSTOMER",
            },
          }),

          cache: "no-store",
        }
      );

    const signupData =
      await signupResponse.json();

    if (!signupResponse.ok) {
      console.error(
        "SUPABASE_REGISTER_ERROR:",
        signupData
      );

      return NextResponse.json(
        {
          error:
            signupData?.msg ||
            signupData?.message ||
            signupData
              ?.error_description ||
            signupData?.error ||
            "Registration failed.",
        },
        {
          status:
            signupResponse.status,
        }
      );
    }

    /*
      5. Validate returned user
    */

    const createdUser =
      signupData?.user;

    if (!createdUser?.id) {
      return NextResponse.json(
        {
          error:
            "Account registration did not return a valid user.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Do not expose Supabase access/refresh
      tokens from signup in this response.

      PakStore login creates its own secure
      httpOnly cookies through /api/auth/login.
    */

    const requiresConfirmation =
      !signupData?.access_token &&
      !signupData?.session;

    /*
      6. Success response
    */

    return NextResponse.json(
      {
        success: true,

        message:
          requiresConfirmation
            ? "Account created successfully. Please check your email to confirm your account before signing in."
            : "Account created successfully. You can now sign in.",

        user: {
          id:
            createdUser.id,

          email:
            createdUser.email ||
            email,

          firstName,

          lastName,

          role:
            "CUSTOMER",

          /*
            public.profiles.is_active uses
            default true for new profiles.
          */
          isActive: true,
        },

        requiresConfirmation,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "REGISTER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating your account.",
      },
      {
        status: 500,
      }
    );
  }
}
