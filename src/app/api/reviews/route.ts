import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  reviewer_name: string;
  verified_purchase: boolean;
  created_at: string;
};

function serviceHeaders(secret: string) {
  return {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

function publicHeaders(key: string, token?: string) {
  return {
    apikey: key,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
  };
}

function cleanName(first?: string | null, last?: string | null) {
  const value = [first, last].filter(Boolean).join(" ").trim();
  return value || "Verified buyer";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId")?.trim();

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secret) {
      return NextResponse.json({ error: "Review service is not configured." }, { status: 500 });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/product_reviews?product_id=eq.${encodeURIComponent(productId)}&is_approved=eq.true&select=id,product_id,rating,title,body,reviewer_name,verified_purchase,created_at&order=created_at.desc`,
      { headers: serviceHeaders(secret), cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("REVIEWS_GET_ERROR", data);
      return NextResponse.json({ error: "Unable to load reviews." }, { status: 500 });
    }

    const reviews = Array.isArray(data) ? data : [];
    const count = reviews.length;
    const average =
      count > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count
        : 0;

    return NextResponse.json({
      success: true,
      count,
      average: Math.round(average * 10) / 10,
      reviews,
    });
  } catch (error) {
    console.error("REVIEWS_GET_ERROR", error);
    return NextResponse.json({ error: "Unable to load reviews." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !publicKey || !secret) {
      return NextResponse.json({ error: "Review service is not configured." }, { status: 500 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("pakstore-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Please sign in to review a purchased product." },
        { status: 401 }
      );
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: publicHeaders(publicKey, accessToken),
      cache: "no-store",
    });
    const user = await userResponse.json();

    if (!userResponse.ok || !user?.id) {
      return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
    }

    const body = await request.json();
    const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
    const rating = Number(body?.rating);
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 100) : "";
    const reviewBody = typeof body?.body === "string" ? body.body.trim().slice(0, 1200) : "";

    if (!productId) {
      return NextResponse.json({ error: "Product is required." }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Choose a rating from 1 to 5 stars." }, { status: 400 });
    }

    if (reviewBody.length < 10) {
      return NextResponse.json({ error: "Please write at least 10 characters." }, { status: 400 });
    }

    // Confirm a real paid purchase before accepting a review.
    const paidOrdersResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?user_id=eq.${encodeURIComponent(user.id)}&status=eq.PAID&select=id`,
      { headers: serviceHeaders(secret), cache: "no-store" }
    );
    const paidOrdersData = await paidOrdersResponse.json();

    if (!paidOrdersResponse.ok) {
      console.error("REVIEWS_PAID_ORDERS_ERROR", paidOrdersData);
      return NextResponse.json({ error: "Unable to verify your purchase." }, { status: 500 });
    }

    const orderIds = Array.isArray(paidOrdersData)
      ? paidOrdersData.map((order: { id?: string }) => order.id).filter(Boolean)
      : [];

    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: "Only verified buyers can review this product." },
        { status: 403 }
      );
    }

    const orderFilter = orderIds.map((id: string) => `"${id}"`).join(",");
    const itemResponse = await fetch(
      `${supabaseUrl}/rest/v1/order_items?order_id=in.(${encodeURIComponent(orderFilter)})&product_id=eq.${encodeURIComponent(productId)}&select=id&limit=1`,
      { headers: serviceHeaders(secret), cache: "no-store" }
    );
    const itemData = await itemResponse.json();

    if (!itemResponse.ok) {
      console.error("REVIEWS_ORDER_ITEMS_ERROR", itemData);
      return NextResponse.json({ error: "Unable to verify your purchase." }, { status: 500 });
    }

    if (!Array.isArray(itemData) || itemData.length === 0) {
      return NextResponse.json(
        { error: "Only verified buyers of this product can leave a review." },
        { status: 403 }
      );
    }

    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=first_name,last_name,email&limit=1`,
      { headers: serviceHeaders(secret), cache: "no-store" }
    );
    const profileData = await profileResponse.json();
    const profile = Array.isArray(profileData) ? profileData[0] : null;
    const reviewerName = cleanName(profile?.first_name, profile?.last_name);

    const saveResponse = await fetch(
      `${supabaseUrl}/rest/v1/product_reviews?on_conflict=user_id,product_id`,
      {
        method: "POST",
        headers: {
          ...serviceHeaders(secret),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          product_id: productId,
          user_id: user.id,
          rating,
          title: title || null,
          body: reviewBody,
          reviewer_name: reviewerName,
          verified_purchase: true,
          is_approved: true,
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      }
    );

    const savedData = await saveResponse.json();

    if (!saveResponse.ok) {
      console.error("REVIEWS_SAVE_ERROR", savedData);
      return NextResponse.json({ error: "Unable to save your review." }, { status: 500 });
    }

    const review = Array.isArray(savedData) ? (savedData[0] as ReviewRow | undefined) : undefined;

    return NextResponse.json({
      success: true,
      message: "Thanks — your verified purchase review is live.",
      review,
    });
  } catch (error) {
    console.error("REVIEWS_POST_ERROR", error);
    return NextResponse.json({ error: "Unable to save your review." }, { status: 500 });
  }
}
