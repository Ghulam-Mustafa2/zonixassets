import { NextResponse } from "next/server";

type AnyRow = Record<string, unknown>;

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeProduct(product: AnyRow) {
  const id = text(product.id);
  const slug = text(product.slug) || id;

  return {
    id,
    slug,
    title:
      text(product.title) ||
      text(product.name) ||
      "Digital Product",
    description:
      text(product.short_description) ||
      text(product.description) ||
      "Premium digital product available on PakStore.",
    category:
      text(product.category) ||
      text(product.category_name) ||
      text(product.type) ||
      "Digital Product",
    price: num(product.price),
    imageUrl:
      text(product.image_url) ||
      text(product.thumbnail_url) ||
      text(product.cover_url) ||
      text(product.preview_image_url),
    createdAt: text(product.created_at),
  };
}

function productIsPublic(product: AnyRow) {
  if (
    product.is_active === false ||
    product.is_published === false
  ) {
    return false;
  }

  const status = text(product.status).toUpperCase();

  return ![
    "INACTIVE",
    "DRAFT",
    "ARCHIVED",
    "HIDDEN",
  ].includes(status);
}

export async function GET() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    /*
      IMPORTANT:
      This is a PUBLIC endpoint.

      We use the Supabase publishable/anon key.
      RLS policies still control what public visitors
      are allowed to read.
    */
    const headers = {
  apikey: supabaseKey,
};

    const [
      siteResponse,
      homepageResponse,
      socialsResponse,
      offersResponse,
      bannersResponse,
      productsResponse,
    ] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/site_settings?select=*&limit=1`,
        {
          headers,
          cache: "no-store",
        }
      ),

      fetch(
        `${supabaseUrl}/rest/v1/homepage_settings?select=*&limit=1`,
        {
          headers,
          cache: "no-store",
        }
      ),

      /*
        Social links:
        Only visible links are returned to the website.
      */
      fetch(
        `${supabaseUrl}/rest/v1/social_links?select=*&is_visible=eq.true&order=sort_order.asc,created_at.asc`,
        {
          headers,
          cache: "no-store",
        }
      ),

      fetch(
        `${supabaseUrl}/rest/v1/offers?select=*&is_active=eq.true&order=sort_order.asc,created_at.desc`,
        {
          headers,
          cache: "no-store",
        }
      ),

      fetch(
        `${supabaseUrl}/rest/v1/promotion_banners?select=*&is_active=eq.true&order=sort_order.asc,created_at.desc`,
        {
          headers,
          cache: "no-store",
        }
      ),

      fetch(
        `${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`,
        {
          headers,
          cache: "no-store",
        }
      ),
    ]);

    const [
      siteData,
      homepageData,
      socialsData,
      offersData,
      bannersData,
      productsData,
    ] = await Promise.all([
      safeJson(siteResponse),
      safeJson(homepageResponse),
      safeJson(socialsResponse),
      safeJson(offersResponse),
      safeJson(bannersResponse),
      safeJson(productsResponse),
    ]);

    /*
      Log exact public fetch errors in the terminal.
      If a table has an RLS/GRANT problem, you will
      immediately see which table is blocked.
    */
    const checks = [
      ["site_settings", siteResponse, siteData],
      ["homepage_settings", homepageResponse, homepageData],
      ["social_links", socialsResponse, socialsData],
      ["offers", offersResponse, offersData],
      ["promotion_banners", bannersResponse, bannersData],
      ["products", productsResponse, productsData],
    ] as const;

    for (const [table, response, body] of checks) {
      if (!response.ok) {
        console.error(
          `PUBLIC_${table.toUpperCase()}_FETCH_ERROR:`,
          {
            status: response.status,
            body,
          }
        );
      }
    }

    const site =
      Array.isArray(siteData) && siteData.length > 0
        ? siteData[0]
        : null;

    const homepage =
      Array.isArray(homepageData) && homepageData.length > 0
        ? homepageData[0]
        : null;

    const socialLinks =
      Array.isArray(socialsData)
        ? socialsData.map((row: AnyRow) => ({
            id: text(row.id),
            platform: text(row.platform),
            label: text(row.label),
            url: text(row.url),
            icon_key: text(row.icon_key),
            sort_order: num(row.sort_order),
            is_visible: bool(row.is_visible, true),
          }))
        : [];

    const now = new Date();

    const offers =
      Array.isArray(offersData)
        ? offersData.filter((offer: AnyRow) => {
            const startsAt = offer.starts_at
              ? new Date(String(offer.starts_at))
              : null;

            const endsAt = offer.ends_at
              ? new Date(String(offer.ends_at))
              : null;

            return (
              (!startsAt || startsAt <= now) &&
              (!endsAt || endsAt >= now)
            );
          })
        : [];

    const promotionBanners =
      Array.isArray(bannersData)
        ? bannersData
        : [];

    const configuredLimit =
      num(
        (homepage as AnyRow | null)
          ?.featured_products_limit,
        10
      );

    const productLimit =
      configuredLimit > 0
        ? Math.min(configuredLimit, 30)
        : 10;

    const featuredProducts =
      Array.isArray(productsData)
        ? productsData
            .filter((product: AnyRow) =>
              productIsPublic(product)
            )
            .map((product: AnyRow) =>
              normalizeProduct(product)
            )
            .filter((product) =>
              Boolean(product.id && product.slug)
            )
            .slice(0, productLimit)
        : [];

    return NextResponse.json(
      {
        success: true,
        site,
        homepage,
        socialLinks,
        offers,
        promotionBanners,
        featuredProducts,

        /*
          Handy count for testing:
          open /api/site-content in the browser and
          confirm socialLinksCount becomes 1, 2, etc.
        */
        meta: {
          socialLinksCount: socialLinks.length,
          offersCount: offers.length,
          promotionBannersCount:
            promotionBanners.length,
          featuredProductsCount:
            featuredProducts.length,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "SITE_CONTENT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load public site content.",
      },
      { status: 500 }
    );
  }
}
