import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  coupon_code?: string | null;
  discount_text?: string | null;
  is_active?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

type ParsedDiscount =
  | { kind: "percent"; value: number }
  | { kind: "fixed"; value: number };

function parseDiscountText(value: unknown): ParsedDiscount | null {
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);

  if (percentMatch) {
    const percent = Number(percentMatch[1]);

    if (Number.isFinite(percent) && percent > 0 && percent <= 100) {
      return {
        kind: "percent",
        value: percent,
      };
    }
  }

  const fixedMatch = text.match(
    /(?:\$|USD\s*)?(\d+(?:\.\d+)?)\s*(?:USD|DOLLARS?)?(?:\s*OFF)?/i
  );

  if (fixedMatch) {
    const amount = Number(fixedMatch[1]);

    if (Number.isFinite(amount) && amount > 0) {
      return {
        kind: "fixed",
        value: amount,
      };
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Coupon validation is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);

    const couponCode =
      typeof body?.couponCode === "string"
        ? body.couponCode.trim().toUpperCase()
        : "";

    if (!couponCode) {
      return NextResponse.json(
        {
          error: "Enter a coupon code.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/offers?coupon_code=eq.${encodeURIComponent(
        couponCode
      )}&is_active=eq.true&select=id,coupon_code,discount_text,is_active,starts_at,ends_at&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("COUPON_VALIDATE_FETCH_ERROR:", data);

      return NextResponse.json(
        {
          error: "Unable to validate this coupon right now.",
        },
        { status: 500 }
      );
    }

    const offer =
      Array.isArray(data) && data.length > 0
        ? (data[0] as OfferRow)
        : null;

    if (!offer) {
      return NextResponse.json(
        {
          error: "This coupon code is invalid or inactive.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const startsAt = offer.starts_at
      ? new Date(offer.starts_at)
      : null;
    const endsAt = offer.ends_at
      ? new Date(offer.ends_at)
      : null;

    if (
      (startsAt && Number.isFinite(startsAt.getTime()) && startsAt > now) ||
      (endsAt && Number.isFinite(endsAt.getTime()) && endsAt < now)
    ) {
      return NextResponse.json(
        {
          error: "This coupon is not currently active.",
        },
        { status: 400 }
      );
    }

    const discount = parseDiscountText(offer.discount_text);

    if (!discount) {
      console.error(
        "COUPON_VALIDATE_INVALID_DISCOUNT:",
        offer.discount_text
      );

      return NextResponse.json(
        {
          error:
            "This coupon is configured incorrectly. Please contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code:
          offer.coupon_code?.trim().toUpperCase() ||
          couponCode,
        discountText:
          offer.discount_text?.trim() ||
          (discount.kind === "percent"
            ? `${discount.value}% OFF`
            : `$${discount.value.toFixed(2)} OFF`),
        kind: discount.kind,
        value: discount.value,
      },
    });
  } catch (error) {
    console.error("COUPON_VALIDATE_ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to validate this coupon right now.",
      },
      { status: 500 }
    );
  }
}
