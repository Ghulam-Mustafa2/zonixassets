import { NextResponse } from "next/server";

type AnyRow = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Store catalog is temporarily unavailable.",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const headers = {
      apikey: supabaseKey,
      "Content-Type": "application/json",
    };

    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/products?select=id,title,slug,short_description,description,price,product_type,image_url,is_active,is_featured,category_id,created_at&is_active=eq.true&order=is_featured.desc,created_at.desc`,
        {
          headers,
          cache: "no-store",
        }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/categories?select=id,name,slug&is_active=eq.true`,
        {
          headers,
          cache: "no-store",
        }
      ),
    ]);

    if (!productsResponse.ok) {
      console.error(
        "AI_CATALOG_PRODUCTS_FETCH_ERROR:",
        productsResponse.status,
        await productsResponse.text()
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load the current product catalog.",
        },
        {
          status: 502,
          headers: corsHeaders,
        }
      );
    }

    const productsData = (await productsResponse.json()) as AnyRow[];

    let categoriesData: AnyRow[] = [];

    if (categoriesResponse.ok) {
      categoriesData = (await categoriesResponse.json()) as AnyRow[];
    } else {
      console.error(
        "AI_CATALOG_CATEGORIES_FETCH_ERROR:",
        categoriesResponse.status,
        await categoriesResponse.text()
      );
    }

    const categories = new Map(
      categoriesData.map((category) => [
        text(category.id),
        {
          name: text(category.name),
          slug: text(category.slug),
        },
      ])
    );

    const baseUrl = "https://zonixassets.shop";

    const products = productsData
      .filter((product) => text(product.slug).trim())
      .map((product) => {
        const slug = text(product.slug).trim();
        const category = categories.get(text(product.category_id));

        return {
          id: text(product.id),
          title: text(product.title, "Digital Product"),
          slug,
          price: number(product.price),
          currency: "USD",
          shortDescription: text(product.short_description),
          description: text(product.description),
          productType: text(product.product_type, "DIGITAL_PRODUCT"),
          category: category?.name || null,
          categorySlug: category?.slug || null,
          featured: bool(product.is_featured),
          imageUrl: text(product.image_url) || null,
          url: `${baseUrl}/products/${encodeURIComponent(slug)}`,
          createdAt: text(product.created_at) || null,
        };
      });

    const cheapestProduct =
      products.length > 0
        ? products.reduce((cheapest, product) =>
            product.price < cheapest.price ? product : cheapest
          )
        : null;

    return NextResponse.json(
      {
        success: true,
        store: {
          name: "ZonixAssets",
          website: baseUrl,
          productsPage: `${baseUrl}/products`,
          currency: "USD",
        },
        products,
        meta: {
          productCount: products.length,
          cheapestProduct: cheapestProduct
            ? {
                title: cheapestProduct.title,
                price: cheapestProduct.price,
                currency: cheapestProduct.currency,
                url: cheapestProduct.url,
              }
            : null,
          generatedAt: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("AI_CATALOG_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load the current product catalog.",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
