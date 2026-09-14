"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type SiteSettings = {
  site_name?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  homepage_heading?: string | null;
  homepage_subheading?: string | null;
  homepage_primary_button_text?: string | null;
  homepage_primary_button_url?: string | null;
  footer_text?: string | null;
};

type HomepageSettings = {
  featured_products_enabled?: boolean | null;
  featured_products_title?: string | null;
  featured_products_subtitle?: string | null;
  featured_products_limit?: number | null;
  featured_products_auto_scroll?: boolean | null;
  featured_products_scroll_speed?: number | null;
  offers_enabled?: boolean | null;
  promotion_banner_enabled?: boolean | null;
  categories_title?: string | null;
  categories_subtitle?: string | null;
};

type Product = {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number | string | null;
  imageUrl?: string | null;
  image_url?: string | null;
};

type Offer = {
  id: string;
  title?: string | null;
  badge?: string | null;
  description?: string | null;
  discount_text?: string | null;
  coupon_code?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

type PromotionBanner = {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  button_text?: string | null;
  target_url?: string | null;
  open_in_new_tab?: boolean | null;
};

type SiteContentResponse = {
  success?: boolean;
  site?: SiteSettings | null;
  homepage?: HomepageSettings | null;
  offers?: Offer[];
  promotionBanners?: PromotionBanner[];
  featuredProducts?: Product[];
};

const fallbackSite: SiteSettings = {
  site_name: "PakStore",
  tagline: "Premium Digital Marketplace",
  homepage_heading: "Digital Products. Built for the Future.",
  homepage_subheading:
    "Discover premium digital products, creative assets, tools, templates and exclusive resources designed to help you build, create and grow faster.",
  homepage_primary_button_text: "Explore Products",
  homepage_primary_button_url: "/products",
};

const fallbackHomepage: HomepageSettings = {
  featured_products_enabled: true,
  featured_products_title: "Featured Products",
  featured_products_subtitle: "Handpicked for You",
  featured_products_limit: 10,
  featured_products_auto_scroll: true,
  featured_products_scroll_speed: 35,
  offers_enabled: true,
  promotion_banner_enabled: true,
  categories_title: "Popular Categories",
  categories_subtitle: "Browse Collections",
};

const categories = [
  {
    title: "Website Templates",
    text: "Modern templates for startups, businesses and creators.",
    href: "/categories/website-templates",
    icon: "⌘",
  },
  {
    title: "UI Kits",
    text: "Beautiful UI components for websites and applications.",
    href: "/categories/ui-kits",
    icon: "◫",
  },
  {
    title: "Graphics",
    text: "Creative assets, mockups and premium design resources.",
    href: "/categories/graphics",
    icon: "✦",
  },
  {
    title: "Digital Tools",
    text: "Powerful digital tools to improve your workflow.",
    href: "/categories/digital-tools",
    icon: "⚡",
  },
];

function money(value: Product["price"]) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "$0";
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export default function Home() {
  const [site, setSite] = useState<SiteSettings>(fallbackSite);
  const [homepage, setHomepage] =
    useState<HomepageSettings>(fallbackHomepage);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch("/api/site-content", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as SiteContentResponse;

        setSite({
          ...fallbackSite,
          ...(data.site || {}),
        });

        setHomepage({
          ...fallbackHomepage,
          ...(data.homepage || {}),
        });

        setProducts(
          Array.isArray(data.featuredProducts)
            ? data.featuredProducts
            : []
        );

        setOffers(Array.isArray(data.offers) ? data.offers : []);
        setBanners(
          Array.isArray(data.promotionBanners)
            ? data.promotionBanners
            : []
        );
      } catch (error) {
        console.error("HOME_CONTENT_ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  const featuredProducts = useMemo(() => {
    const limit = Math.max(
      1,
      Number(homepage.featured_products_limit || 10)
    );

    return products.slice(0, limit);
  }, [products, homepage.featured_products_limit]);

  const scrollSpeed = Math.max(
    10,
    Number(homepage.featured_products_scroll_speed || 35)
  );

  const heading =
    site.homepage_heading?.trim() ||
    fallbackSite.homepage_heading ||
    "";

  const headingParts = heading.split(/(?<=[.!?])\s+/);
  const firstHeading = headingParts[0] || heading;
  const secondHeading =
    headingParts.slice(1).join(" ") ||
    "Built for the Future.";

  const activeOffer = offers[0] || null;
  const activeBanner = banners[0] || null;

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-20 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[140px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 text-center md:py-36">
          <div className="mx-auto mb-6 w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            {site.tagline?.trim() || "Premium Digital Marketplace"}
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-bold tracking-tight md:text-7xl">
            {firstHeading}
            <span className="mt-1 block bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              {secondHeading}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
            {site.homepage_subheading?.trim() ||
              fallbackSite.homepage_subheading}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={
                site.homepage_primary_button_url?.trim() ||
                "/products"
              }
              className="rounded-xl bg-emerald-400 px-7 py-4 font-semibold text-black transition hover:bg-emerald-300"
            >
              {site.homepage_primary_button_text?.trim() ||
                "Explore Products"}
            </Link>

            <Link
              href="/categories"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-semibold transition hover:bg-white/10"
            >
              View Categories
            </Link>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              [`${Math.max(products.length, 0)}+`, "Available Products"],
              ["24/7", "Instant Access"],
              ["100%", "Secure Checkout"],
              ["Fast", "Digital Delivery"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <h3 className="text-2xl font-bold">{value}</h3>
                <p className="mt-1 text-sm text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer */}
      {homepage.offers_enabled !== false && activeOffer && (
        <section className="mx-auto max-w-7xl px-6 pb-6">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400/10 via-cyan-400/5 to-transparent p-7 md:p-9">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-emerald-400/20 blur-[90px]" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  {activeOffer.badge && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {activeOffer.badge}
                    </span>
                  )}

                  {activeOffer.discount_text && (
                    <span className="text-sm font-bold text-emerald-300">
                      {activeOffer.discount_text}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                  {activeOffer.title || "Special Offer"}
                </h2>

                {activeOffer.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                    {activeOffer.description}
                  </p>
                )}

                {activeOffer.coupon_code && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-emerald-400/30 bg-black/30 px-4 py-2 text-sm">
                    <span className="text-white/50">Coupon:</span>
                    <strong className="tracking-wider text-emerald-300">
                      {activeOffer.coupon_code}
                    </strong>
                  </div>
                )}
              </div>

              {activeOffer.button_text && activeOffer.button_url && (
                <Link
                  href={activeOffer.button_url}
                  className="shrink-0 rounded-xl bg-emerald-400 px-6 py-3 text-center font-semibold text-black transition hover:bg-emerald-300"
                >
                  {activeOffer.button_text}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              {homepage.categories_subtitle?.trim() ||
                "Browse Collections"}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {homepage.categories_title?.trim() ||
                "Popular Categories"}
            </h2>
          </div>

          <Link
            href="/categories"
            className="hidden text-sm font-medium text-white/60 transition hover:text-emerald-400 md:block"
          >
            View All Categories →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              href={category.href}
              key={category.title}
              className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30"
            >
              <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl text-emerald-400">
                {category.icon}
              </div>

              <h3 className="text-xl font-semibold">
                {category.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {category.text}
              </p>

              <div className="mt-6 text-sm font-medium text-emerald-400">
                Explore →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Moving Featured Products */}
      {homepage.featured_products_enabled !== false &&
        featuredProducts.length > 0 && (
          <section className="overflow-hidden py-20">
            <div className="mx-auto mb-10 flex max-w-7xl items-end justify-between px-6">
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  {homepage.featured_products_subtitle?.trim() ||
                    "Popular products available right now."}
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  {homepage.featured_products_title?.trim() ||
                    "Featured Products"}
                </h2>
              </div>

              <Link
                href="/products"
                className="hidden text-sm font-medium text-white/60 transition hover:text-emerald-400 md:block"
              >
                Browse All Products →
              </Link>
            </div>

            {homepage.featured_products_auto_scroll !== false &&
            featuredProducts.length > 1 ? (
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black to-transparent" />

                <div
                  className="featured-marquee flex w-max gap-6 px-6"
                  style={{
                    animationDuration: `${scrollSpeed}s`,
                  }}
                >
                  {[...featuredProducts, ...featuredProducts].map(
                    (product, index) => (
                      <ProductCard
                        key={`${product.id || product.slug}-${index}`}
                        product={product}
                      />
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.slug}
                    product={product}
                  />
                ))}
              </div>
            )}
          </section>
        )}

      {/* Promotion Banner */}
      {homepage.promotion_banner_enabled !== false &&
        activeBanner && (
          <section className="mx-auto max-w-7xl px-6 py-20">
            <div className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-white/[0.03]">
              {activeBanner.image_url && (
                <img
                  src={activeBanner.image_url}
                  alt={activeBanner.title || "Promotion"}
                  className="absolute inset-0 h-full w-full object-cover opacity-25"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />

              <div className="relative px-8 py-14 md:px-12 md:py-20">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Promotion
                </p>

                <h2 className="mt-3 max-w-3xl text-3xl font-bold md:text-5xl">
                  {activeBanner.title || "Featured Partner"}
                </h2>

                {activeBanner.description && (
                  <p className="mt-4 max-w-2xl text-white/60">
                    {activeBanner.description}
                  </p>
                )}

                {activeBanner.target_url && (
                  <a
                    href={activeBanner.target_url}
                    target={
                      activeBanner.open_in_new_tab
                        ? "_blank"
                        : "_self"
                    }
                    rel={
                      activeBanner.open_in_new_tab
                        ? "noreferrer"
                        : undefined
                    }
                    className="mt-8 inline-block rounded-xl bg-white px-7 py-4 font-semibold text-black transition hover:bg-white/90"
                  >
                    {activeBanner.button_text || "Visit Website"}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[32px] border border-emerald-400/20 bg-emerald-400/10 px-8 py-16 text-center">
          <div className="absolute left-1/2 top-0 h-60 w-60 -translate-x-1/2 rounded-full bg-emerald-400/30 blur-[100px]" />

          <div className="relative">
            <h2 className="text-3xl font-bold md:text-5xl">
              Build More. Create Faster.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-white/60">
              Premium digital resources created for designers,
              developers and modern creators.
            </p>

            <Link
              href={
                site.homepage_primary_button_url?.trim() ||
                "/products"
              }
              className="mt-8 inline-block rounded-xl bg-white px-7 py-4 font-semibold text-black transition hover:bg-white/90"
            >
              {site.homepage_primary_button_text?.trim() ||
                "Start Exploring"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes featuredMarquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .featured-marquee {
          animation-name: featuredMarquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .featured-marquee:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .featured-marquee {
            animation: none !important;
          }
        }
      `}</style>

      {loading && (
        <div className="fixed bottom-5 right-5 z-50 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs text-white/50 backdrop-blur">
          Loading content...
        </div>
      )}
    </main>
  );
}

function ProductCard({
  product,
}: {
  product: Product;
}) {
  const image =
    product.imageUrl?.trim() ||
    product.image_url?.trim() ||
    "";

  return (
    <article className="group w-[300px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 sm:w-[340px]">
      <Link href={`/products/${product.slug}`}>
        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-sm text-white/30">
              Product Preview
            </span>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </Link>

      <div className="p-6">
        <p className="text-sm font-medium text-emerald-400">
          {product.category || "Digital Product"}
        </p>

        <div className="mt-2 flex items-start justify-between gap-4">
          <Link
            href={`/products/${product.slug}`}
            className="transition hover:text-emerald-300"
          >
            <h3 className="text-xl font-semibold">
              {product.title}
            </h3>
          </Link>

          <span className="shrink-0 text-lg font-bold">
            {money(product.price)}
          </span>
        </div>

        {product.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/45">
            {product.description}
          </p>
        )}

        <Link
          href={`/products/${product.slug}`}
          className="mt-6 block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-medium transition hover:bg-emerald-400 hover:text-black"
        >
          View Product
        </Link>
      </div>
    </article>
  );
}
