import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type DatabaseProduct = {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number | string;
  product_type: string | null;
  preview_url: string | null;
  file_path: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
};

type Product = DatabaseProduct & {
  category: Category | null;
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
};

async function getStoreData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const headers = {
    apikey: supabaseKey,
    "Content-Type": "application/json",
  };

  const [productsResponse, categoriesResponse] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/products?select=*&is_active=eq.true&order=created_at.desc`,
      {
        headers,
        cache: "no-store",
      }
    ),

    fetch(
      `${supabaseUrl}/rest/v1/categories?select=*&is_active=eq.true&order=name.asc`,
      {
        headers,
        cache: "no-store",
      }
    ),
  ]);

  if (!productsResponse.ok) {
    const error = await productsResponse.text();

    console.error("PRODUCTS FETCH ERROR:", error);

    throw new Error("Unable to load products.");
  }

  if (!categoriesResponse.ok) {
    const error = await categoriesResponse.text();

    console.error("CATEGORIES FETCH ERROR:", error);

    throw new Error("Unable to load categories.");
  }

  const databaseProducts: DatabaseProduct[] =
    await productsResponse.json();

  const categories: Category[] =
    await categoriesResponse.json();

  const products: Product[] = databaseProducts.map((product) => {
    const category =
      categories.find(
        (item) => item.id === product.category_id
      ) ?? null;

    return {
      ...product,
      category,
    };
  });

  return {
    products,
    categories,
  };
}

function formatPrice(price: number | string) {
  const amount = Number(price);

  if (Number.isNaN(amount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function buildUrl({
  q,
  category,
  sort,
}: {
  q?: string;
  category?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (category && category !== "all") {
    params.set("category", category);
  }

  if (sort && sort !== "newest") {
    params.set("sort", sort);
  }

  const queryString = params.toString();

  return queryString
    ? `/products?${queryString}`
    : "/products";
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;

  const searchQuery = params.q?.trim() ?? "";
  const selectedCategory = params.category ?? "all";
  const selectedSort = params.sort ?? "newest";

  let products: Product[] = [];
  let categories: Category[] = [];
  let loadError = "";

  try {
    const data = await getStoreData();

    products = data.products;
    categories = data.categories;
  } catch (error) {
    console.error("STORE DATA ERROR:", error);

    loadError =
      "Products could not be loaded. Please try again.";
  }

  let filteredProducts = [...products];

  // Search
  if (searchQuery) {
    const search = searchQuery.toLowerCase();

    filteredProducts = filteredProducts.filter((product) => {
      const title = product.title.toLowerCase();

      const shortDescription =
        product.short_description?.toLowerCase() ?? "";

      const description =
        product.description?.toLowerCase() ?? "";

      const category =
        product.category?.name.toLowerCase() ?? "";

      return (
        title.includes(search) ||
        shortDescription.includes(search) ||
        description.includes(search) ||
        category.includes(search)
      );
    });
  }

  // Category filter
  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category?.slug === selectedCategory
    );
  }

  // Sorting
  if (selectedSort === "price-low") {
    filteredProducts.sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  } else if (selectedSort === "price-high") {
    filteredProducts.sort(
      (a, b) => Number(b.price) - Number(a.price)
    );
  } else if (selectedSort === "featured") {
    filteredProducts.sort(
      (a, b) =>
        Number(b.is_featured) - Number(a.is_featured)
    );
  } else {
    filteredProducts.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-medium text-emerald-400">
            Digital Marketplace
          </p>

          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Explore Digital Products
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/50">
            Browse premium templates, UI kits, creative assets and
            digital tools built for modern creators.
          </p>

          {/* Search */}
          <form
            action="/products"
            method="GET"
            className="mt-10 flex max-w-2xl items-center rounded-2xl border border-white/10 bg-white/[0.03] p-2"
          >
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search products..."
              className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />

            {selectedCategory !== "all" && (
              <input
                type="hidden"
                name="category"
                value={selectedCategory}
              />
            )}

            {selectedSort !== "newest" && (
              <input
                type="hidden"
                name="sort"
                value={selectedSort}
              />
            )}

            <button
              type="submit"
              className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              Search
            </button>
          </form>

          {searchQuery && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="text-white/40">
                Search results for:
              </span>

              <span className="text-emerald-400">
                &ldquo;{searchQuery}&rdquo;
              </span>

              <Link
                href="/products"
                className="text-white/40 underline transition hover:text-white"
              >
                Clear
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Products Area */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        {/* Filters */}
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildUrl({
                q: searchQuery,
                category: "all",
                sort: selectedSort,
              })}
              className={
                selectedCategory === "all"
                  ? "rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-black"
                  : "rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
              }
            >
              All
            </Link>

            {categories.map((category) => (
              <Link
                key={category.id}
                href={buildUrl({
                  q: searchQuery,
                  category: category.slug,
                  sort: selectedSort,
                })}
                className={
                  selectedCategory === category.slug
                    ? "rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-black"
                    : "rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
                }
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Sort */}
          <form
            action="/products"
            method="GET"
            className="flex items-center gap-3"
          >
            {searchQuery && (
              <input
                type="hidden"
                name="q"
                value={searchQuery}
              />
            )}

            {selectedCategory !== "all" && (
              <input
                type="hidden"
                name="category"
                value={selectedCategory}
              />
            )}

            <select
              name="sort"
              defaultValue={selectedSort}
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
            >
              <option value="newest">
                Newest Products
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="featured">
                Featured First
              </option>
            </select>

            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
            >
              Apply
            </button>
          </form>
        </div>

        {/* Result Count */}
        {!loadError && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-white/40">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "product"
                : "products"}{" "}
              found
            </p>
          </div>
        )}

        {/* Database Error */}
        {loadError && (
          <div className="rounded-3xl border border-red-400/20 bg-red-400/5 px-6 py-10 text-center">
            <p className="font-medium text-red-300">
              Unable to load store
            </p>

            <p className="mt-2 text-sm text-white/40">
              {loadError}
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Product Grid */}
        {!loadError && filteredProducts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30"
              >
                {product.is_featured && (
                  <div className="absolute left-4 top-4 z-10 rounded-full border border-emerald-400/20 bg-black/70 px-3 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-xl">
                    Featured
                  </div>
                )}

                <Link href={`/products/${product.slug}`}>
                  <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-black">
                    <div className="absolute h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl transition duration-500 group-hover:scale-150" />

                    {product.preview_url ? (
                      <img
                        src={product.preview_url}
                        alt={product.title}
                        className="relative h-full w-full object-cover"
                      />
                    ) : (
                      <div className="relative text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xl text-emerald-400">
                          ✦
                        </div>

                        <span className="mt-4 block text-xs text-white/30">
                          Product Preview
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-emerald-400">
                      {product.category?.name ??
                        "Digital Product"}
                    </p>

                    <span className="text-lg font-bold">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <Link href={`/products/${product.slug}`}>
                    <h2 className="mt-3 text-xl font-semibold transition group-hover:text-emerald-300">
                      {product.title}
                    </h2>
                  </Link>

                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-6 text-white/40">
                    {product.short_description ||
                      product.description ||
                      "Premium digital resource with instant access."}
                  </p>

                  <div className="mt-6 flex gap-3">
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-medium transition hover:bg-white/10"
                    >
                      View Details
                    </Link>

                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                    >
                      Buy
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loadError && filteredProducts.length === 0 && (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-400">
              ✦
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              No products found
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
              We couldn&apos;t find any products matching your
              current search or category.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              View All Products
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}