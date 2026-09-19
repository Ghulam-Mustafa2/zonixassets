import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductActions from "@/components/ProductActions";
import ProductGallery from "@/components/ProductGallery";

export const dynamic = "force-dynamic";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number | string;
  product_type: string | null;
  preview_url: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  file_path: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
};

type ProductWithCategory = Product & {
  category: Category | null;
};

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return {
    supabaseUrl,
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
  };
}

async function getProduct(slug: string): Promise<ProductWithCategory | null> {
  const { supabaseUrl, headers } = getSupabaseConfig();

  const productResponse = await fetch(
    `${supabaseUrl}/rest/v1/products?select=*&slug=eq.${encodeURIComponent(
      slug
    )}&is_active=eq.true&limit=1`,
    {
      headers,
      cache: "no-store",
    }
  );

  if (!productResponse.ok) {
    const error = await productResponse.text();
    console.error("PRODUCT DETAIL FETCH ERROR:", error);
    throw new Error("Unable to load product.");
  }

  const products: Product[] = await productResponse.json();

  if (products.length === 0) {
    return null;
  }

  const product = products[0];
  let category: Category | null = null;

  if (product.category_id) {
    const categoryResponse = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=id,name,slug&id=eq.${encodeURIComponent(
        product.category_id
      )}&is_active=eq.true&limit=1`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (categoryResponse.ok) {
      const categories: Category[] = await categoryResponse.json();
      category = categories[0] ?? null;
    }
  }

  return {
    ...product,
    category,
  };
}

async function getRelatedProducts(
  product: ProductWithCategory
): Promise<Product[]> {
  const { supabaseUrl, headers } = getSupabaseConfig();

  async function fetchProducts(extraFilters: string[]) {
    const filters = [
      "is_active=eq.true",
      `id=neq.${encodeURIComponent(product.id)}`,
      ...extraFilters,
    ];

    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=id,title,slug,short_description,description,price,product_type,preview_url,image_url,image_url_2,image_url_3,file_path,is_active,is_featured,created_at,category_id&${filters.join(
        "&"
      )}&order=is_featured.desc,created_at.desc&limit=4`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("RELATED PRODUCTS FETCH ERROR:", await response.text());
      return [] as Product[];
    }

    return (await response.json()) as Product[];
  }

  // First preference: products from the same category.
  if (product.category_id) {
    const sameCategory = await fetchProducts([
      `category_id=eq.${encodeURIComponent(product.category_id)}`,
    ]);

    if (sameCategory.length > 0) {
      return sameCategory;
    }
  }

  // Fallback: show other active products so the section never disappears
  // just because the current category has no additional products.
  return fetchProducts([]);
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

function getFeatures(product: ProductWithCategory) {
  const slug = product.category?.slug;

  if (slug === "ui-kits") {
    return [
      "Premium interface components",
      "Responsive layouts",
      "Modern dashboard sections",
      "Easy customization",
      "Commercial-ready usage",
      "Instant digital access",
    ];
  }

  if (slug === "website-templates") {
    return [
      "Modern landing pages",
      "Responsive design",
      "Reusable sections",
      "Conversion-focused layouts",
      "Easy customization",
      "Instant digital access",
    ];
  }

  if (slug === "graphics") {
    return [
      "Premium creative assets",
      "Multiple design-ready files",
      "Creator-friendly resources",
      "Easy customization",
      "Professional quality",
      "Instant digital access",
    ];
  }

  if (slug === "digital-tools") {
    return [
      "Ready-to-use digital tools",
      "Productivity-focused workflow",
      "Easy setup",
      "Modern resources",
      "Account-based access",
      "Instant digital delivery",
    ];
  }

  return [
    "Premium digital resource",
    "Professional quality",
    "Easy to use",
    "Secure purchase",
    "Account-based access",
    "Instant digital access",
  ];
}

function getPrimaryImage(product: Product) {
  return (
    product.image_url?.trim() ||
    product.preview_url?.trim() ||
    product.image_url_2?.trim() ||
    product.image_url_3?.trim() ||
    ""
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product: ProductWithCategory | null;

  try {
    product = await getProduct(slug);
  } catch (error) {
    console.error("PRODUCT PAGE ERROR:", error);
    throw error;
  }

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);
  const price = formatPrice(product.price);
  const features = getFeatures(product);
  const productImages = [
    product.image_url?.trim() || product.preview_url?.trim() || "",
    product.image_url_2?.trim() || "",
    product.image_url_3?.trim() || "",
  ].filter(
    (image, index, images) => Boolean(image) && images.indexOf(image) === index
  );

  const description =
    product.description?.trim() ||
    product.short_description?.trim() ||
    "Premium digital product with secure checkout and access from your Zonix Assets account after successful payment.";

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#0b1025]">
      <Navbar />

      {/* Breadcrumb */}
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
            <Link href="/" className="transition hover:text-[#ff6b00]">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="transition hover:text-[#ff6b00]">
              Products
            </Link>

            {product.category && (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="transition hover:text-[#ff6b00]"
                >
                  {product.category.name}
                </Link>
              </>
            )}

            <span>/</span>
            <span className="max-w-[240px] truncate font-semibold text-slate-900 sm:max-w-none">
              {product.title}
            </span>
          </div>
        </div>
      </section>

      {/* Main product area */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
          {/* Product gallery */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.09)] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                    Product Preview
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Preview the included design before purchase
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                  Digital Product
                </span>
              </div>

              <ProductGallery title={product.title} images={productImages} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ["Instant", "Digital access", "↓"],
                ["Secure", "Checkout", "✓"],
                ["Account", "Downloads", "⌂"],
              ].map(([title, subtitle, icon]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-base font-black text-[#ff6b00]">
                    {icon}
                  </div>
                  <p className="mt-2 text-sm font-black text-[#0b1025]">{title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase panel */}
          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <div className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-orange-50/70 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6b00]">
                    {product.category?.name || "Digital Product"}
                  </span>

                  {product.is_featured && (
                    <span className="rounded-full bg-[#0b1025] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                      Featured
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black leading-[1.04] tracking-[-0.04em] text-[#0b1025] sm:text-4xl lg:text-[46px]">
                  {product.title}
                </h1>

                <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-[16px] sm:leading-7">
                  {product.short_description?.trim() || description}
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Premium digital asset
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      One-time payment
                    </p>
                    <p className="mt-1 text-4xl font-black tracking-tight text-[#0b1025] sm:text-5xl">
                      {price}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                    <p className="text-xs font-black text-emerald-700">
                      Instant access
                    </p>
                    <p className="mt-0.5 text-[11px] text-emerald-600">
                      after payment
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <ProductActions
                    product={{
                      id: product.id,
                      slug: product.slug,
                      title: product.title,
                      category: product.category?.name ?? "Digital Product",
                      price: Number(product.price),
                    }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    ["Secure checkout", "Protected purchase"],
                    ["Digital delivery", "No shipping needed"],
                    ["Account access", "Download after payment"],
                    ["Customer support", "Help when needed"],
                  ].map(([title, subtitle]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-3.5"
                    >
                      <p className="text-xs font-black text-[#0b1025]">{title}</p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        {subtitle}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                      ↓
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#0b1025]">
                        Download after payment
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Your purchased files become available inside your Zonix Assets account after payment confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Product details + included */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
              Product Details
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Everything you need to know.
            </h2>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                {description}
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Type
                </p>
                <p className="mt-2 text-sm font-black text-[#0b1025]">
                  {product.product_type || "Digital Product"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Delivery
                </p>
                <p className="mt-2 text-sm font-black text-[#0b1025]">
                  Account Download
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Category
                </p>
                <p className="mt-2 text-sm font-black text-[#0b1025]">
                  {product.category?.name || "Digital Product"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-gradient-to-br from-[#0b1025] to-[#172554] p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
              What&apos;s Included
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Built for a professional workflow.
            </h2>

            <div className="mt-6 grid gap-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-xs font-black text-white">
                    ✓
                  </span>
                  <span className="text-sm font-semibold text-white/85">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                Simple buying process
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                From product to download in four steps.
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Review", "Check the product details and preview."],
              ["02", "Purchase", "Complete checkout securely."],
              ["03", "Payment", "Wait for payment confirmation."],
              ["04", "Download", "Access your files from your account."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5"
              >
                <p className="text-xs font-black text-[#ff6b00]">{number}</p>
                <h3 className="mt-3 text-base font-black text-[#0b1025]">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Payment guide */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_.92fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                Secure Payment
              </p>

              <h2 className="mt-2 max-w-2xl text-2xl font-black tracking-tight text-[#0b1025] sm:text-3xl">
                How to pay and get your digital product.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Buying from Zonix Assets is simple. Choose your product, complete
                the secure checkout, wait for payment confirmation, then download
                your files from your account.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  [
                    "01",
                    "Choose your product",
                    "Review the product details and click Add to Cart or Buy Now.",
                  ],
                  [
                    "02",
                    "Secure checkout",
                    "Complete your payment through the configured secure payment provider.",
                  ],
                  [
                    "03",
                    "Payment confirmation",
                    "Your order is confirmed automatically after a successful payment.",
                  ],
                  [
                    "04",
                    "Download from account",
                    "Open your Zonix Assets account and access your purchased files.",
                  ],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-[#ff6b00]">
                        {number}
                      </span>

                      <div>
                        <h3 className="text-sm font-black text-[#0b1025]">
                          {title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0b1025] to-[#172554] p-6 text-white sm:p-8 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
                Payment Methods
              </p>

              <h3 className="mt-2 text-2xl font-black tracking-tight">
                Trusted checkout for digital purchases.
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/65">
                Your payment is handled through a secure checkout. Zonix Assets
                never needs to store your card details.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="flex min-h-[94px] items-center justify-center rounded-2xl border border-white/10 bg-white p-4 shadow-sm">
                  <img
                    src="/payments/visa-mastercard.png"
                    alt="Visa and Mastercard"
                    className="max-h-12 w-auto object-contain"
                  />
                </div>

                <div className="flex min-h-[94px] items-center justify-center rounded-2xl border border-white/10 bg-white p-4 shadow-sm">
                  <img
                    src="/payments/lemon-squeezy.jpeg"
                    alt="Lemon Squeezy"
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  ["✓", "Secure checkout", "Protected payment experience"],
                  ["↓", "Instant digital access", "Files unlock after confirmation"],
                  ["⌂", "Account delivery", "Downloads stay inside your account"],
                  ["?", "Customer support", "Help is available if you need it"],
                ].map(([icon, title, text]) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black text-orange-300">
                      {icon}
                    </span>

                    <div>
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-white/55">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm font-black text-emerald-200">
                  No shipping required
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                  This is a digital purchase. After payment confirmation, your
                  files become available from your Zonix Assets account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                Frequently Asked Questions
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Before you purchase.
              </h2>
            </div>

            <Link
              href="/support"
              className="text-sm font-bold text-slate-500 hover:text-[#ff6b00]"
            >
              Need more help? →
            </Link>
          </div>

          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {[
              [
                "How do I receive the files?",
                "After successful payment confirmation, your purchased files become available from your Zonix Assets account dashboard.",
              ],
              [
                "Is this a physical product?",
                "No. This listing is for a digital product, so there is no physical shipping involved.",
              ],
              [
                "Where can I get support?",
                "Use the Contact or Support page if you need help with an order, payment, or download.",
              ],
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black text-[#0b1025]">
                  {question}
                  <span className="text-xl font-normal text-slate-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                  Related Products
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0b1025] sm:text-3xl">
                  More products you may like.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Explore more premium digital products from the same collection.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6b00]"
              >
                View all products
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-6 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-7 lg:grid-cols-4">
              {relatedProducts.map((item) => {
                const image = getPrimaryImage(item);

                return (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    className="group min-w-[78%] snap-start overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_16px_38px_rgba(15,23,42,0.12)] sm:min-w-0"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3">
                        <span className="rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#ff6b00] shadow-sm backdrop-blur">
                          {product.category?.name || "Digital Product"}
                        </span>

                        {item.is_featured && (
                          <span className="rounded-full bg-[#0b1025] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-sm">
                            Featured
                          </span>
                        )}
                      </div>

                      {image ? (
                        <img
                          src={image}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-orange-50 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          Digital Product
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-base font-black leading-5 text-[#0b1025]">
                          {item.title}
                        </h3>

                        <span className="shrink-0 text-base font-black text-[#ff6b00]">
                          {formatPrice(item.price)}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
                        {item.short_description ||
                          item.description ||
                          "Premium digital product from Zonix Assets."}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-600">
                          Instant access
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-black text-[#0b1025] transition group-hover:text-[#ff6b00]">
                          View product
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0b1025] to-[#172554] px-6 py-8 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] sm:px-10 sm:py-10 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
              Ready to download?
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Get {product.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Complete your purchase and access the product from your Zonix Assets account after payment confirmation.
            </p>
          </div>

          <div className="mt-6 min-w-[250px] lg:mt-0">
            <ProductActions
              product={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                category: product.category?.name ?? "Digital Product",
                price: Number(product.price),
              }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
