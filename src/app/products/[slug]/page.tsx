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

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProduct(slug: string) {
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
      `${supabaseUrl}/rest/v1/categories?select=id,name,slug&id=eq.${product.category_id}&is_active=eq.true&limit=1`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (categoryResponse.ok) {
      const categories: Category[] =
        await categoryResponse.json();

      category = categories[0] ?? null;
    }
  }

  return {
    ...product,
    category,
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

function getFeatures(product: {
  category: Category | null;
}) {
  const slug = product.category?.slug;

  if (slug === "ui-kits") {
    return [
      "Premium interface components",
      "Responsive layouts",
      "Modern dashboard sections",
      "Easy customization",
      "Commercial license",
      "Instant digital access",
    ];
  }

  if (slug === "website-templates") {
    return [
      "Modern landing pages",
      "Responsive design",
      "Reusable sections",
      "Conversion-focused layouts",
      "Commercial license",
      "Instant digital access",
    ];
  }

  if (slug === "graphics") {
    return [
      "Premium creative assets",
      "Multiple design formats",
      "Creator-friendly resources",
      "Easy customization",
      "Commercial license",
      "Instant digital access",
    ];
  }

  if (slug === "digital-tools") {
    return [
      "Ready-to-use digital tools",
      "Productivity-focused workflow",
      "Easy setup",
      "Modern resources",
      "Lifetime access",
      "Instant digital delivery",
    ];
  }

  return [
    "Premium digital resource",
    "Professional quality",
    "Easy to use",
    "Commercial license",
    "Secure purchase",
    "Instant digital access",
  ];
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  let product;

  try {
    product = await getProduct(slug);
  } catch (error) {
    console.error("PRODUCT PAGE ERROR:", error);

    throw error;
  }

  if (!product) {
    notFound();
  }

  const price = formatPrice(product.price);
  const features = getFeatures(product);

  // Build the product gallery from the 3 admin-managed image fields.
  // preview_url remains as a fallback for older products.
  const productImages = [
    product.image_url?.trim() ||
      product.preview_url?.trim() ||
      "",
    product.image_url_2?.trim() || "",
    product.image_url_3?.trim() || "",
  ].filter(
    (image, index, images) =>
      Boolean(image) &&
      images.indexOf(image) === index
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Breadcrumb */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/40">
            <Link
              href="/"
              className="transition hover:text-white"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              href="/products"
              className="transition hover:text-white"
            >
              Products
            </Link>

            {product.category && (
              <>
                <span>/</span>

                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="transition hover:text-white"
                >
                  {product.category.name}
                </Link>
              </>
            )}

            <span>/</span>

            <span className="text-white/70">
              {product.title}
            </span>
          </div>
        </div>
      </section>

      {/* Main Product */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Preview */}
          <div>
            <ProductGallery
              title={product.title}
              images={productImages}
            />
          </div>

          {/* Product Info */}
          <div className="lg:py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                {product.category?.name ??
                  "Digital Product"}
              </div>

              {product.is_featured && (
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                  Featured
                </div>
              )}
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
              {product.title}
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/50">
              {product.description ||
                product.short_description ||
                "Premium digital product with instant access after purchase."}
            </p>

            <div className="mt-8 flex items-end gap-3">
              <span className="text-4xl font-bold">
                {price}
              </span>

              <span className="pb-1 text-sm text-white/40">
                One-time payment
              </span>
            </div>

            <ProductActions
              product={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                category:
                  product.category?.name ??
                  "Digital Product",
                price: Number(product.price),
              }}
            />

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="font-semibold text-emerald-400">
                  Instant
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Access
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="font-semibold text-emerald-400">
                  Secure
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Checkout
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="font-semibold text-emerald-400">
                  Lifetime
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              What&apos;s Included
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Everything You Need
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-white/50">
              This digital product is designed to provide a
              professional starting point while remaining easy
              to use and customize for your own projects.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-sm text-emerald-400">
                  ✓
                </div>

                <span className="text-sm text-white/70">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Purchase Benefits */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold">
              Commercial License
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Use eligible products in personal and commercial
              projects according to the ZonixAssets product license.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold">
              Instant Delivery
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Purchased files will become available from your
              customer dashboard after successful payment.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold">
              Secure Purchase
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Checkout and digital delivery are designed to work
              through a secure payment and order workflow.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-[32px] border border-emerald-400/20 bg-emerald-400/10 px-8 py-14 text-center">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[100px]" />

          <div className="relative">
            <p className="text-sm text-emerald-300">
              Ready to get started?
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Get {product.title}
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-white/50">
              Purchase once and get instant access from your
              ZonixAssets account dashboard.
            </p>

            <ProductActions
              product={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                category:
                  product.category?.name ??
                  "Digital Product",
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