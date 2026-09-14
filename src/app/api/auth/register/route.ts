import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;

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

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("REGISTER_ENV_ERROR");

      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: "CUSTOMER",
          },
        },
      });

    if (error) {
      console.error(
        "SUPABASE_REGISTER_ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Registration failed.",
        },
        {
          status:
            error.status || 400,
        }
      );
    }

    const createdUser = data.user;

    if (!createdUser?.id) {
      console.error(
        "REGISTER_NO_USER:",
        data
      );

      return NextResponse.json(
        {
          error:
            "Account could not be created. Please try again.",
        },
        { status: 500 }
      );
    }

    const requiresConfirmation =
      !data.session;

    return NextResponse.json(
      {
        success: true,
        message: requiresConfirmation
          ? "Account created successfully. Please check your email to confirm your account before signing in."
          : "Account created successfully. You can now sign in.",
        user: {
          id: createdUser.id,
          email:
            createdUser.email || email,
          firstName,
          lastName,
          role: "CUSTOMER",
          isActive: true,
        },
        requiresConfirmation,
      },
      { status: 201 }
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
      { status: 500 }
    );
  }
}