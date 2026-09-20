import type { MetadataRoute } from "next";

type SitemapProduct = {
  slug: string;
  created_at: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://zonixassets.shop";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("SITEMAP: Supabase environment variables are missing.");
      return staticPages;
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=slug,created_at&is_active=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "SITEMAP: Unable to fetch products:",
        await response.text()
      );

      return staticPages;
    }

    const products: SitemapProduct[] = await response.json();

    const productPages: MetadataRoute.Sitemap = products
      .filter((product) => product.slug?.trim())
      .map((product) => ({
        url: `${baseUrl}/products/${encodeURIComponent(product.slug)}`,
        lastModified: product.created_at
          ? new Date(product.created_at)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error("SITEMAP GENERATION ERROR:", error);

    return staticPages;
  }
}