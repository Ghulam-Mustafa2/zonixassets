import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Product = {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  category?: string | null;
  price?: number | string | null;
  preview_url?: string | null;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  is_featured?: boolean | null;
};

type CategoryInfo = {
  title: string;
  eyebrow: string;
  description: string;
  categoryNames: string[];
};

const categoryMap: Record<string, CategoryInfo> = {
  "website-templates": {
    title: "Website Templates",
    eyebrow: "Web & Landing Pages",
    description:
      "Modern website templates for startups, creators, agencies and businesses.",
    categoryNames: ["Website Template", "Website Templates", "Template", "Templates"],
  },
  "ui-kits": {
    title: "UI Kits",
    eyebrow: "Interfaces & Components",
    description:
      "Beautiful UI kits and interface resources for websites and applications.",
    categoryNames: ["UI Kit", "UI Kits", "UI"],
  },
  graphics: {
    title: "Graphics",
    eyebrow: "Visual Design Assets",
    description:
      "Creative graphics, social media assets, mockups and premium design resources.",
    categoryNames: ["Graphics", "Graphic"],
  },
  "digital-tools": {
    title: "Digital Tools",
    eyebrow: "Resources & Productivity",
    description:
      "Useful digital tools and resources designed to improve your workflow.",
    categoryNames: ["Digital Tool", "Digital Tools", "Tool", "Tools"],
  },
};

function formatPrice(value: Product["price"]) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getProductImage(product: Product) {
  const candidates = [
    product.image_url,
    product.preview_url,
    product.image_url_2,
    product.image_url_3,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

async function getProducts(): Promise<Product[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=id,slug,title,short_description,description,category,price,preview_url,image_url,image_url_2,image_url_3,is_featured&is_active=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("CATEGORY_PRODUCTS_FETCH_ERROR:", await response.text());
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("CATEGORY_PRODUCTS_ERROR:", error);
    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryMap[slug];

  if (!category) notFound();

  const allProducts = await getProducts();
  const products = allProducts.filter((product) => {
    const productCategory = product.category?.trim().toLowerCase() || "";
    return category.categoryNames.some(
      (name) => name.toLowerCase() === productCategory
    );
  });

  const otherCategories = Object.entries(categoryMap).filter(
    ([categorySlug]) => categorySlug !== slug
  );

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-[#0b1220]">
      <Navbar />

      <section className="relative overflow-hidden bg-[#0b1220] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <div className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/40">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/categories" className="transition hover:text-white">Categories</Link>
            <span>/</span>
            <span className="text-white/75">{category.title}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8a2a]">
                {category.eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                {category.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                {category.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/categories"
                  className="rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.09]"
                >
                  <span className="text-white">← All Categories</span>
                </Link>
                <Link
                  href="/products"
                  className="rounded-xl bg-[#f5841f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff9540]"
                >
                  <span className="text-white">Browse Store</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-white p-5 text-[#0b1220] shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f5841f]">Available Now</p>
                <p className="mt-3 text-3xl font-black">{products.length}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {products.length === 1 ? "Product" : "Products"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-[#111c33] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Digital Store</p>
                <p className="mt-3 text-lg font-black">Ready to explore</p>
                <p className="mt-2 text-xs leading-5 text-white/45">Clear details, secure checkout and account access.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-9 sm:px-6 sm:py-11 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit space-y-4 lg:sticky lg:top-28">
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5841f]">Store Categories</p>
              <div className="mt-4 space-y-2">
                <Link
                  href={`/categories/${slug}`}
                  className="flex items-center justify-between rounded-xl bg-[#0b1220] px-4 py-3 text-sm font-black text-white"
                  style={{ color: "#ffffff" }}
                >
                  <span style={{ color: "#ffffff" }}>{category.title}</span>
                  <span style={{ color: "#ffffff" }}>✓</span>
                </Link>

                {otherCategories.map(([categorySlug, item]) => (
                  <Link
                    key={categorySlug}
                    href={`/categories/${categorySlug}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-orange-200 hover:text-[#f5841f]"
                  >
                    <span>{item.title}</span>
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5841f]">Buying on Zonix</p>
              <div className="mt-4 space-y-4">
                {[
                  ["01", "Review", "Check product details before buying."],
                  ["02", "Checkout", "Complete payment securely."],
                  ["03", "Access", "Open eligible files from your account."],
                ].map(([number, title, copy]) => (
                  <div key={number} className="flex gap-3">
                    <span className="pt-0.5 text-[10px] font-black text-[#f5841f]">{number}</span>
                    <div>
                      <p className="text-sm font-black text-[#0b1220]">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5841f]">Available Right Now</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{category.title}</h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b1220] text-xl text-white">✦</div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f5841f]">Collection Empty</p>
                <h3 className="mt-2 text-2xl font-black">No products in this category yet.</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  New products added from the admin panel will appear here automatically.
                </p>
                <Link
                  href="/products"
                  className="mt-7 inline-flex rounded-xl bg-[#f5841f] px-6 py-3 text-sm font-black text-white transition hover:bg-[#ff9540]"
                >
                  <span className="text-white">Browse All Products</span>
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  const image = getProductImage(product);

                  return (
                    <article
                      key={product.id}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                    >
                      <Link href={`/products/${product.slug}`} className="block">
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f7fa]">
                          {product.is_featured && (
                            <span className="absolute left-3 top-3 z-10 rounded-full bg-[#0b1220] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                              Featured
                            </span>
                          )}

                          {image ? (
                            <img
                              src={image}
                              alt={product.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#eef2f7)] px-6 text-center">
                              <div>
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">✦</div>
                                <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Zonix Digital Asset</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#f5841f]">
                          {product.category || category.title}
                        </p>

                        <Link href={`/products/${product.slug}`}>
                          <h3 className="mt-2 line-clamp-2 min-h-[44px] text-lg font-black leading-[22px] text-[#0b1220] transition group-hover:text-[#f5841f]">
                            {product.title}
                          </h3>
                        </Link>

                        <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
                          {product.short_description || product.description || "Premium digital resource with instant account access after purchase."}
                        </p>

                        <div className="mt-auto border-t border-slate-100 pt-4">
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-xl font-black text-[#0b1220]">{formatPrice(product.price)}</p>
                              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Instant access
                              </p>
                            </div>

                            <Link
                              href={`/products/${product.slug}`}
                              className="inline-flex min-w-[112px] items-center justify-center rounded-xl bg-[#0b1220] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#f5841f]"
                              style={{ color: "#ffffff" }}
                            >
                              <span style={{ color: "#ffffff" }}>View Product</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-7 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#f5841f]">More from Zonix</p>
                  <p className="mt-1 text-sm font-bold text-[#0b1220]">Explore every category in the ZonixAssets store.</p>
                </div>
                <Link
                  href="/categories"
                  className="mt-4 inline-flex rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-xs font-black text-[#0b1220] transition hover:border-orange-200 hover:text-[#f5841f] sm:mt-0"
                >
                  Browse Categories →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-16 lg:px-8">
        <div className="grid overflow-hidden rounded-[28px] bg-[#0b1220] text-white lg:grid-cols-[1fr_auto]">
          <div className="p-7 sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Explore More</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Looking for something else?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Browse the full ZonixAssets store and compare products across every category.
            </p>
          </div>
          <div className="flex items-center border-t border-white/10 p-7 lg:border-l lg:border-t-0 lg:p-9">
            <Link
              href="/products"
              className="w-full rounded-xl bg-[#f5841f] px-6 py-3.5 text-center text-sm font-black text-white transition hover:bg-[#ff9540]"
              style={{ color: "#ffffff" }}
            >
              <span style={{ color: "#ffffff" }}>Browse All Products</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
