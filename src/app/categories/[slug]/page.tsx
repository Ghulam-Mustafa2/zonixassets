import Link from "next/link";
import { notFound } from "next/navigation";

type Product = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
};

type CategoryInfo = {
  title: string;
  description: string;
  categoryNames: string[];
};

const categoryMap: Record<string, CategoryInfo> = {
  "website-templates": {
    title: "Website Templates",
    description:
      "Modern website templates for startups, creators, agencies and businesses.",
    categoryNames: [
      "Website Template",
      "Website Templates",
      "Template",
      "Templates",
    ],
  },

  "ui-kits": {
    title: "UI Kits",
    description:
      "Beautiful UI kits and interface resources for websites and applications.",
    categoryNames: [
      "UI Kit",
      "UI Kits",
      "UI",
    ],
  },

  graphics: {
    title: "Graphics",
    description:
      "Creative graphics, social media assets, mockups and premium design resources.",
    categoryNames: [
      "Graphics",
      "Graphic",
    ],
  },

  "digital-tools": {
    title: "Digital Tools",
    description:
      "Useful digital tools and resources designed to improve your workflow.",
    categoryNames: [
      "Digital Tool",
      "Digital Tools",
      "Tool",
      "Tools",
    ],
  },
};

async function getProducts(): Promise<Product[]> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=id,slug,title,description,category,price&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "CATEGORY_PRODUCTS_FETCH_ERROR:",
        errorText
      );

      return [];
    }

    const data =
      await response.json();

    return Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.error(
      "CATEGORY_PRODUCTS_ERROR:",
      error
    );

    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } =
    await params;

  const category =
    categoryMap[slug];

  if (!category) {
    notFound();
  }

  const allProducts =
    await getProducts();

  const products =
    allProducts.filter(
      (product) => {
        const productCategory =
          product.category
            ?.trim()
            .toLowerCase() || "";

        return category.categoryNames.some(
          (name) =>
            name.toLowerCase() ===
            productCategory
        );
      }
    );

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-emerald-950/20 to-black">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Link
            href="/categories"
            className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            ← All Categories
          </Link>

          <p className="mt-8 text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
            Category
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            {category.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/50">
            {category.description}
          </p>

          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50">
            {products.length}{" "}
            {products.length === 1
              ? "product"
              : "products"}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        {products.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-8 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-2xl text-emerald-400">
              ✦
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              No products found
            </h2>

            <p className="mx-auto mt-3 max-w-md text-white/45">
              There are currently no products available in this category.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(
              (product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="block"
                  >
                    <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950/40 to-black">
                      <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xl text-emerald-400">
                          ✦
                        </div>

                        <span className="mt-4 block text-sm text-white/25">
                          Product Preview
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-emerald-400">
                          {product.category ||
                            category.title}
                        </p>

                        <h2 className="mt-2 text-xl font-bold">
                          {
                            product.title
                          }
                        </h2>
                      </div>

                      <p className="shrink-0 text-lg font-bold">
                        $
                        {Number(
                          product.price ||
                            0
                        ).toFixed(2)}
                      </p>
                    </div>

                    {product.description && (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/45">
                        {
                          product.description
                        }
                      </p>
                    )}

                    <Link
                      href={`/products/${product.slug}`}
                      className="mt-6 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition hover:border-emerald-400/30 hover:bg-emerald-400 hover:text-black"
                    >
                      View Product
                    </Link>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-emerald-400/20 bg-emerald-950/20 px-8 py-10 md:flex-row">
          <div>
            <h2 className="text-2xl font-bold">
              Looking for something else?
            </h2>

            <p className="mt-2 text-white/45">
              Browse all available digital products on ZonixAssets.
            </p>
          </div>

          <Link
            href="/products"
            className="shrink-0 rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300"
          >
            Browse All Products
          </Link>
        </div>
      </section>
    </main>
  );
}