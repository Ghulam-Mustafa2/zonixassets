import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Signed out successfully.",
    },
    {
      status: 200,
    }
  );

  /*
    IMPORTANT:
    These cookie names must exactly match
    the names used by login and protected APIs.
  */

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

  return response;
}
