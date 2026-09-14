import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        {
          error: "Page slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Supabase is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const normalizedSlug = slug
      .trim()
      .toLowerCase();

    const response = await fetch(
      `${supabaseUrl}/rest/v1/content_pages?slug=eq.${encodeURIComponent(
        normalizedSlug
      )}&is_published=eq.true&select=id,slug,title,subtitle,content,is_published,created_at,updated_at&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      console.error(
        "PUBLIC_CONTENT_PAGE_FETCH_ERROR:",
        data
      );

      return NextResponse.json(
        {
          error: "Unable to load content page.",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    const page =
      Array.isArray(data) && data.length > 0
        ? data[0]
        : null;

    if (!page) {
      return NextResponse.json(
        {
          error: "Content page not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        page,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUBLIC_CONTENT_PAGE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load content page.",
      },
      {
        status: 500,
      }
    );
  }
}