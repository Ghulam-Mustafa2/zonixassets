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
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
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

  const databaseProducts: DatabaseProduct[] = await productsResponse.json();
  const categories: Category[] = await categoriesResponse.json();

  const products: Product[] = databaseProducts.map((product) => ({
    ...product,
    category:
      categories.find((item) => item.id === product.category_id) ?? null,
  }));

  return { products, categories };
}

function formatPrice(price: number | string) {
  const amount = Number(price);

  if (Number.isNaN(amount)) return "$0.00";

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

  if (q) params.set("q", q);
  if (category && category !== "all") params.set("category", category);
  if (sort && sort !== "newest") params.set("sort", sort);

  const queryString = params.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

function getProductImage(product: DatabaseProduct) {
  return (
    product.preview_url?.trim() ||
    product.image_url?.trim() ||
    product.image_url_2?.trim() ||
    product.image_url_3?.trim() ||
    ""
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
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
    loadError = "Products could not be loaded. Please try again.";
  }

  let filteredProducts = [...products];

  if (searchQuery) {
    const search = searchQuery.toLowerCase();

    filteredProducts = filteredProducts.filter((product) => {
      const title = product.title.toLowerCase();
      const shortDescription = product.short_description?.toLowerCase() ?? "";
      const description = product.description?.toLowerCase() ?? "";
      const category = product.category?.name.toLowerCase() ?? "";

      return (
        title.includes(search) ||
        shortDescription.includes(search) ||
        description.includes(search) ||
        category.includes(search)
      );
    });
  }

  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (product) => product.category?.slug === selectedCategory
    );
  }

  if (selectedSort === "price-low") {
    filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (selectedSort === "price-high") {
    filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (selectedSort === "featured") {
    filteredProducts.sort(
      (a, b) => Number(b.is_featured) - Number(a.is_featured)
    );
  } else {
    filteredProducts.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6fb] text-[#0b1025]">
      <Navbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[#0b1025] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(255,107,0,0.18),transparent_28%),radial-gradient(circle_at_18%_80%,rgba(20,184,166,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          <div className="grid items-center gap-7 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-orange-300 sm:px-4 sm:text-[10px]">
                <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                Zonix Assets Marketplace
              </div>

              <h1 className="mt-4 max-w-3xl text-[2.35rem] font-black leading-[0.98] tracking-[-0.045em] sm:mt-5 sm:text-5xl lg:text-6xl">
                Premium digital assets for your next big idea.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 sm:mt-5 sm:text-base sm:leading-7">
                Discover curated templates, UI kits, graphics and digital tools with a clean buying experience and instant account access after payment.
              </p>

              <form
                action="/products"
                method="GET"
                className="mt-6 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.07] p-2 backdrop-blur sm:mt-7 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    type="text"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search templates, UI kits, graphics..."
                    className="min-w-0 w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>

                {selectedCategory !== "all" && (
                  <input type="hidden" name="category" value={selectedCategory} />
                )}
                {selectedSort !== "newest" && (
                  <input type="hidden" name="sort" value={selectedSort} />
                )}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#ff6b00] px-6 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(255,107,0,0.28)] transition hover:bg-[#e85f00] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-[#0b1025] sm:w-auto"
                >
                  <span className="relative z-10">Search</span>
                </button>
              </form>

              {searchQuery && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/55">
                  <span>Results for</span>
                  <span className="font-bold text-white">“{searchQuery}”</span>
                  <Link
                    href="/products"
                    className="font-bold text-orange-300 transition hover:text-orange-200"
                  >
                    Clear
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-white p-5 text-[#0b1025]">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                    Marketplace
                  </p>
                  <p className="mt-3 text-2xl font-black leading-tight">
                    Curated assets, ready to use.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Built for creators, startups and digital teams.
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-[#151d3a] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                    Creator first
                  </p>
                  <p className="mt-3 text-2xl font-black leading-tight">
                    Browse fast. Buy with confidence.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/52">
                    Simple discovery, secure checkout and instant access.
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-[20px] border border-white/10 bg-white/[0.05] p-3 text-center sm:p-4">
                <div>
                  <p className="text-xl font-black sm:text-2xl">{products.length}</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/35 sm:text-[9px]">
                    Products
                  </p>
                </div>

                <div className="border-x border-white/10">
                  <p className="text-xl font-black sm:text-2xl">{categories.length}</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/35 sm:text-[9px]">
                    Categories
                  </p>
                </div>

                <div>
                  <p className="text-xl font-black sm:text-2xl">24/7</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/35 sm:text-[9px]">
                    Access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:rounded-[28px] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff6b00] sm:text-[10px]">
                Explore collection
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Find your next digital asset
              </h2>
              {!loadError && (
                <p className="mt-1 text-sm text-slate-500">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "product" : "products"} available
                </p>
              )}
            </div>

            <form action="/products" method="GET" className="flex w-full gap-2 lg:w-auto">
              {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
              {selectedCategory !== "all" && (
                <input type="hidden" name="category" value={selectedCategory} />
              )}

              <select
                name="sort"
                defaultValue={selectedSort}
                aria-label="Sort products"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100 sm:px-4 lg:min-w-[210px]"
              >
                <option value="newest">Newest Products</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="featured">Featured First</option>
              </select>

              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0b1025] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ff6b00] focus:outline-none focus:ring-2 focus:ring-orange-300 sm:px-5"
              >
                <span className="relative z-10">Apply</span>
              </button>
            </form>
          </div>

          <div className="mt-5 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
            <Link
              href={buildUrl({
                q: searchQuery,
                category: "all",
                sort: selectedSort,
              })}
              className={
                selectedCategory === "all"
                  ? "inline-flex shrink-0 snap-start items-center justify-center rounded-full bg-[#0b1025] px-5 py-2.5 text-sm font-black text-white shadow-sm"
                  : "inline-flex shrink-0 snap-start items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-orange-200 hover:text-[#ff6b00]"
              }
            >
              <span className="whitespace-nowrap">All Products</span>
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
                    ? "inline-flex shrink-0 snap-start items-center justify-center rounded-full bg-[#ff6b00] px-5 py-2.5 text-sm font-black text-white shadow-sm"
                    : "inline-flex shrink-0 snap-start items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-orange-200 hover:text-[#ff6b00]"
                }
              >
                <span className="whitespace-nowrap">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {loadError && (
          <div className="mt-7 rounded-[28px] border border-red-200 bg-red-50 px-6 py-14 text-center">
            <p className="text-lg font-black text-red-700">Unable to load store</p>
            <p className="mt-2 text-sm text-red-600/80">{loadError}</p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#0b1025] px-5 py-3 text-sm font-black text-white"
            >
              Try Again
            </Link>
          </div>
        )}

        {!loadError && filteredProducts.length > 0 && (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const productImage = getProductImage(product);

              return (
                <article
                  key={product.id}
                  className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_20px_55px_rgba(15,23,42,0.10)]"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      {product.is_featured && (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#0b1025] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                          Featured
                        </span>
                      )}

                      {productImage ? (
                        <img
                          src={productImage}
                          alt={product.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="relative flex h-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc,#eef2f7)] px-6 text-center">
                          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-100/60 blur-2xl" />
                          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-cyan-100/70 blur-2xl" />

                          <div className="relative">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                              <span className="text-xl text-[#0b1025]">✦</span>
                            </div>
                            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                              Zonix Digital Asset
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="pt-1 text-[10px] font-black uppercase tracking-[0.10em] text-[#ff6b00]">
                        {product.category?.name ?? "Digital Product"}
                      </p>
                      <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-base font-black text-[#0b1025]">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                    >
                      <h3 className="mt-3 line-clamp-2 min-h-[48px] text-xl font-black leading-6 text-[#0b1025] transition group-hover:text-[#ff6b00]">
                        {product.title}
                      </h3>
                    </Link>

                    <p className="mt-2 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-500">
                      {product.short_description ||
                        product.description ||
                        "Premium digital resource with instant access after purchase."}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <span className="truncate">Instant access</span>
                      </span>

                      <Link
                        href={`/products/${product.slug}`}
                        aria-label={`View ${product.title}`}
                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0b1025] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#ff6b00] focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <span className="relative z-10 whitespace-nowrap text-white">
                          View Product
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loadError && filteredProducts.length === 0 && (
          <div className="mt-7 rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:py-20">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">
              No matching products
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0b1025]">
              Try another search or category.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              We couldn&apos;t find any products matching your current filters.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#ff6b00] px-6 py-3 text-sm font-black text-white transition hover:bg-[#e85f00]"
            >
              View All Products
            </Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="grid overflow-hidden rounded-[24px] bg-[#0b1025] text-white sm:rounded-[28px] lg:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Built for creators
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              Choose the asset. Build the idea.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Every product page keeps the details clear so you can decide quickly and return to your files from your account after purchase.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:items-center sm:p-9 lg:border-l lg:border-t-0">
            <Link
              href="/categories"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.10] focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Browse Categories
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-[#ff6b00] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e85f00] focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
