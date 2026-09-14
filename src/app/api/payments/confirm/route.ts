import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Manual payment confirmation has been disabled. Payments are confirmed by the Lemon Squeezy webhook.",
    },
    {
      status: 410,
    }
  );
}