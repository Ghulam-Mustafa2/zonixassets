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
  site_name: "Zonix Assets",
  tagline: "Premium Digital Asset Store",
  homepage_heading: "Digital products built for creators.",
  homepage_subheading:
    "Professional website templates, UI kits, graphics and digital tools ready for your next project.",
  homepage_primary_button_text: "Browse Store",
  homepage_primary_button_url: "/products",
};

const fallbackHomepage: HomepageSettings = {
  featured_products_enabled: true,
  featured_products_title: "Best Selling Digital Products",
  featured_products_subtitle: "Popular products available right now",
  featured_products_limit: 10,
  offers_enabled: true,
  promotion_banner_enabled: true,
  categories_title: "Shop by Category",
  categories_subtitle: "Browse collections",
};

const categories = [
  {
    title: "Website Templates",
    short: "Sites & landing pages",
    href: "/categories/website-templates",
    image: "/categories/website-templates.png",
  },
  {
    title: "UI Kits",
    short: "Interfaces & components",
    href: "/categories/ui-kits",
    image: "/categories/ui-kits.png",
  },
  {
    title: "Graphics",
    short: "Mockups & design assets",
    href: "/categories/graphics",
    image: "/categories/graphics.png",
  },
  {
    title: "Digital Tools",
    short: "Resources & productivity",
    href: "/categories/digital-tools",
    image: "/categories/digital-tools.png",
  },
];

const trustItems = [
  {
    image: "/trust/instant-download.png",
    title: "Instant Download",
    text: "Access files after payment",
  },
  {
    image: "/trust/secure-payment.png",
    title: "Secure Payment",
    text: "Protected checkout",
  },
  {
    image: "/trust/quality-badge.png",
    title: "Quality Assets",
    text: "Curated digital products",
  },
  {
    image: "/trust/customer-support.png",
    title: "Customer Support",
    text: "Help when you need it",
  },
];

const fallbackProductImages = [
  "/products/product-1.png",
  "/products/product-2.png",
  "/products/product-3.png",
  "/products/product-4.png",
  "/products/product-5.png",
  "/products/product-6.png",
  "/products/product-7.png",
  "/products/product-8.png",
  "/products/product-9.png",
];

const promoImages = [
  "/promos/promo-1.png",
  "/promos/promo-2.png",
  "/promos/promo-3.png",
  "/promos/promo-4.png",
];

function money(value: Product["price"]) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "$0";
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

function productImage(product: Product | undefined, index: number) {
  return (
    product?.imageUrl?.trim() ||
    product?.image_url?.trim() ||
    fallbackProductImages[index % fallbackProductImages.length]
  );
}

export default function Home() {
  const [site, setSite] = useState<SiteSettings>(fallbackSite);
  const [homepage, setHomepage] =
    useState<HomepageSettings>(fallbackHomepage);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const activeOffer = offers[0] || null;
  const activeBanner = banners[0] || null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7fb] text-[#0b1025]">
      <Navbar />

      {/* Trust strip */}
      <section className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-3 gap-y-2 px-3 py-2.5 sm:px-6 sm:py-3 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-10 sm:w-10 sm:rounded-xl">
                <img
                  src={item.image}
                  alt=""
                  className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[10px] font-black text-slate-950 sm:text-sm">
                  {item.title}
                </p>
                <p className="truncate text-[8px] text-slate-500 sm:text-xs">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hero / digital store banner */}
      <section className="px-3 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[#0d1530] shadow-[0_25px_70px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-0">
              <img
                src="/hero/hero-banner.png"
                alt="Zonix Assets digital store banner"
                className="h-full w-full object-cover object-center opacity-75"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,14,28,0.96)_0%,rgba(8,14,28,0.88)_40%,rgba(8,14,28,0.50)_70%,rgba(8,14,28,0.22)_100%)]" />
            </div>

            <div className="relative z-10 grid min-h-[410px] items-end lg:min-h-[500px] lg:grid-cols-[1.08fr_.92fr]">
              <div className="px-5 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10 lg:px-10 lg:pb-12 lg:pt-12">
                <p className="inline-flex rounded-full border border-orange-300/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300 sm:text-xs">
                  {site.tagline?.trim() || "Premium Digital Asset Store"}
                </p>

                <h1 className="mt-4 max-w-2xl text-[34px] font-black leading-[0.94] tracking-[-0.05em] text-white sm:text-5xl lg:text-[68px]">
                  {site.homepage_heading?.trim() ||
                    "Discover digital products built for creators."}
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-[16px] sm:leading-7">
                  {site.homepage_subheading?.trim() ||
                    "Browse templates, UI kits, graphics and digital tools in one focused digital store built for instant delivery and secure checkout."}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
                  <Link
                    href={site.homepage_primary_button_url?.trim() || "/products"}
                    className="rounded-2xl bg-[#ff6b00] px-6 py-3.5 text-center text-sm font-black !text-white shadow-[0_12px_28px_rgba(255,107,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#e65f00]"
                  >
                    {site.homepage_primary_button_text?.trim() || "Browse Store"}
                  </Link>

                  <Link
                    href="/categories"
                    className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-center text-sm font-black !text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Explore Categories
                  </Link>
                </div>

                <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 min-[430px]:grid-cols-3">
                  <HeroInfoCard label="Instant Access" text="Fast digital delivery" />
                  <HeroInfoCard label="Secure Checkout" text="Protected payments" />
                  <HeroInfoCard label="Curated Assets" text="Professional quality" />
                </div>
              </div>

              <div className="hidden h-full items-end justify-end lg:flex">
                <div className="mb-8 mr-8 w-full max-w-[380px] rounded-[24px] border border-white/15 bg-white/10 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/95 p-3.5 text-slate-950">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                        Digital Store
                      </p>
                      <h3 className="mt-2 text-lg font-black">
                        Ready-to-use assets
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Templates, graphics, UI kits and more.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#0b1025]/80 p-3.5 text-white ring-1 ring-white/10">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-300">
                        Creator First
                      </p>
                      <h3 className="mt-2 text-lg font-black">
                        Built to move fast
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-white/65">
                        Find polished resources without wasting project time.
                      </p>
                    </div>

                    <div className="col-span-2 rounded-2xl border border-white/10 bg-white/10 p-3.5 text-white">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                          Secure
                        </span>
                        <span className="rounded-full bg-orange-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200">
                          Premium
                        </span>
                        <span className="rounded-full bg-sky-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-200">
                          Digital
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/75">
                        Purchase once, keep eligible products inside your account,
                        and return whenever you need your files.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Categories */}
      <section className="px-3 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow={
              homepage.categories_subtitle?.trim() ||
              "Browse Collections"
            }
            title={
              homepage.categories_title?.trim() ||
              "Shop by Category"
            }
            href="/categories"
            linkText="View all categories"
          />

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#f3f4f6]">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-3.5 sm:p-4">
                  <h3 className="text-[12px] font-black text-slate-950 sm:text-base">
                    {category.title}
                  </h3>
                  <p className="mt-0.5 text-[9px] leading-4 text-slate-500 sm:mt-1 sm:text-xs">
                    {category.short}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {homepage.featured_products_enabled !== false && (
        <section className="px-3 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow={
                homepage.featured_products_subtitle?.trim() ||
                "Popular products available right now"
              }
              title={
                homepage.featured_products_title?.trim() ||
                "Best Selling Digital Products"
              }
              href="/products"
              linkText="View all products"
            />

            {featuredProducts.length > 0 ? (
              <MovingProductRail products={featuredProducts} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {fallbackProductImages.slice(0, 5).map((image, index) => (
                  <div
                    key={image}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <img
                      src={image}
                      alt="Digital product preview"
                      className="aspect-[4/3] w-full object-contain bg-[#f7f8fb] p-3"
                    />
                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#ff6b00]">
                        Digital Product
                      </p>
                      <div className="mt-2 h-4 w-3/4 rounded bg-slate-200" />
                      <div className="mt-4 h-8 rounded-lg bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Offer */}
      {homepage.offers_enabled !== false && activeOffer && (
        <section className="px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[linear-gradient(90deg,#0b1025_0%,#151b35_55%,#1f2748_100%)] text-white shadow-[0_10px_24px_rgba(11,16,37,0.14)]">
            <div className="grid gap-4 px-5 py-5 sm:px-7 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#ff6b00] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  {activeOffer.badge || "Limited Time Offer"}
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black">
                      {activeOffer.title || "Store Deal"}
                    </h2>
                    {activeOffer.discount_text && (
                      <span className="font-black text-amber-300">
                        {activeOffer.discount_text}
                      </span>
                    )}
                  </div>

                  {activeOffer.description && (
                    <p className="mt-1 text-xs text-white/65 sm:text-sm">
                      {activeOffer.description}
                    </p>
                  )}
                </div>

                {activeOffer.coupon_code && (
                  <span className="rounded-lg border border-dashed border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold">
                    CODE: {activeOffer.coupon_code}
                  </span>
                )}
              </div>

              {activeOffer.button_text && activeOffer.button_url && (
                <Link
                  href={activeOffer.button_url}
                  className="rounded-xl bg-[#ff6b00] px-5 py-3 text-center text-sm font-black !text-white transition hover:bg-[#e85f00]"
                >
                  {activeOffer.button_text}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Creator Street / social showcase lane */}
      <section className="px-3 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Creator Street"
            title="Ideas, tools & trends for creators"
            href="/products"
            linkText="Explore all"
          />

          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[#0b1025] shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#ff6b00_0%,#ffb067_32%,#18b8b1_100%)]" />

            <div className="px-3 pb-3 pt-4 sm:p-5">
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
                {[
                  { eyebrow: "Watch & Learn", title: "Creator Tutorials", image: promoImages[0], href: "/products", cta: "Watch" },
                  { eyebrow: "Visual Drops", title: "Design Inspiration", image: promoImages[1], href: "/categories", cta: "Explore" },
                  { eyebrow: "Quick Picks", title: "Trending Assets", image: promoImages[2], href: "/products", cta: "Trending" },
                  { eyebrow: "Save Ideas", title: "Creative Boards", image: promoImages[3], href: "/categories", cta: "Browse" },
                ].map((card) => (
                  <article
                    key={card.title}
                    className="group min-w-[84%] snap-center overflow-hidden rounded-[20px] border border-white/10 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-1 sm:min-w-0"
                  >
                    <Link href={card.href} className="block">
                      <div className="relative aspect-video overflow-hidden bg-slate-200">
                        <img
                          src={card.image}
                          alt={card.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,37,0.03)_0%,rgba(11,16,37,0.08)_46%,rgba(11,16,37,0.88)_100%)]" />
                        <div className="absolute inset-x-3 bottom-3">
                          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-orange-300">
                            {card.eyebrow}
                          </p>
                          <h3 className="mt-1 text-lg font-black leading-tight !text-white sm:text-xl">
                            {card.title}
                          </h3>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Curated by Zonix
                      </span>
                      <Link
                        href={card.href}
                        className="rounded-lg bg-[#0b1025] px-3 py-2 text-[9px] font-black !text-white transition hover:bg-[#ff6b00]"
                      >
                        {card.cta}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Separate creator tools / social icon dock */}
              <div className="mt-3 rounded-[20px] border border-white/10 bg-white/[0.97] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.12)] sm:mt-4 sm:p-4">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#ff6b00] sm:text-[9px]">
                      Creator Toolkit
                    </p>
                    <h4 className="mt-0.5 text-sm font-black text-slate-950 sm:text-base">
                      AI, design & social
                    </h4>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-9 sm:overflow-visible sm:gap-2.5">
                  {[
                    { src: "/images/social/chatgpt.png", name: "ChatGPT" },
                    { src: "/images/social/claude ai.png", name: "Claude" },
                    { src: "/images/social/gemni.jpeg", name: "Gemini" },
                    { src: "/images/social/canva.jpeg", name: "Canva" },
                    { src: "/images/social/figma.jpeg", name: "Figma" },
                    { src: "/images/social/instagram.jpeg", name: "Instagram" },
                    { src: "/images/social/pinterest.png", name: "Pinterest" },
                    { src: "/images/social/x.jpeg", name: "X" },
                    { src: "/images/social/vorawire.png", name: "VoraWire" },
                  ].map((item) => (
                    <div
                      key={item.src}
                      className="group/icon flex w-[62px] shrink-0 flex-col items-center gap-1.5 sm:w-auto"
                      title={item.name}
                    >
                      <div className="flex h-[56px] w-[56px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-2 shadow-[0_5px_14px_rgba(15,23,42,0.06)] transition duration-300 group-hover/icon:-translate-y-1 group-hover/icon:border-orange-200 sm:h-auto sm:aspect-square sm:w-full sm:max-w-[68px]">
                        <img src={item.src} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                      <span className="max-w-full truncate text-center text-[8px] font-bold text-slate-500 sm:text-[9px]">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured promotion banner */}
      {homepage.promotion_banner_enabled !== false && activeBanner && (
        <section className="px-3 py-3 sm:px-6 sm:py-5">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="grid items-center gap-0 md:grid-cols-[1fr_300px]">
              <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1025_0%,#14204a_100%)] px-5 py-6 text-white sm:px-7 sm:py-7">
                <div className="absolute -right-6 top-2 h-24 w-24 rounded-full bg-orange-500/15 blur-3xl" />
                <p className="relative text-[9px] font-black uppercase tracking-[0.2em] text-orange-300 sm:text-[10px]">
                  Featured Promotion
                </p>
                <div className="relative mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-2xl font-black leading-tight sm:text-3xl">
                      {activeBanner.title || "Featured Partner"}
                    </h2>
                    <p className="mt-2 max-w-xl text-xs leading-5 text-white/65 sm:text-sm sm:leading-6">
                      {activeBanner.description ||
                        "Discover a featured digital resource selected for the ZonixAssets store."}
                    </p>
                  </div>

                  {activeBanner.target_url && (
                    <a
                      href={activeBanner.target_url}
                      target={activeBanner.open_in_new_tab ? "_blank" : "_self"}
                      rel={activeBanner.open_in_new_tab ? "noreferrer" : undefined}
                      className="inline-flex w-fit shrink-0 rounded-xl bg-[#ff6b00] px-5 py-3 text-xs font-black !text-white shadow-[0_10px_22px_rgba(255,107,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e65f00]"
                    >
                      {activeBanner.button_text || "View Promotion"}
                    </a>
                  )}
                </div>
              </div>

              <div className="hidden h-full min-h-[150px] items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-4 md:flex">
                <div className="flex h-[118px] w-full items-center justify-center overflow-hidden rounded-[18px] border border-slate-200/70 bg-white p-3">
                  <img
                    src={activeBanner.image_url?.trim() || promoImages[2]}
                    alt={activeBanner.title || "Promotion"}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Buying process + secure checkout */}
      <section className="px-3 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-7xl rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:rounded-3xl sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff6b00] sm:text-xs">
                Simple Buying Process
              </p>
              <h2 className="mt-1.5 text-xl font-black text-slate-950 sm:text-3xl">
                From discovery to download in four steps.
              </h2>
              <p className="mt-2 text-[11px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Choose an asset, review the details, complete secure checkout and access eligible files from your account.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-[10px] font-bold text-emerald-800 sm:text-xs">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm">✓</span>
              Protected checkout
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-4 sm:gap-3">
            {[
              ["01", "Browse", "Find the right digital asset."],
              ["02", "Review", "Check product details before buying."],
              ["03", "Checkout", "Complete payment securely."],
              ["04", "Download", "Access paid files in your account."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4"
              >
                <p className="text-[9px] font-black text-[#ff6b00] sm:text-[10px]">{number}</p>
                <h3 className="mt-1 text-[12px] font-black text-slate-950 sm:text-sm">{title}</h3>
                <p className="mt-1 text-[9px] leading-4 text-slate-500 sm:text-xs sm:leading-5">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] leading-5 text-slate-500 sm:text-xs">
              Secure payment processing • Instant account access after confirmation
            </p>
            <div className="flex items-center gap-2">
              {[
                ["/payments/visa-mastercard.png", "Cards"],
                ["/payments/lemon-squeezy.jpeg", "Secure checkout"],
              ].map(([src, label]) => (
                <div key={src} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <img src={src} alt={label} className="h-6 w-9 object-contain" />
                  <span className="hidden text-[9px] font-bold text-slate-500 sm:block">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-3 pb-7 pt-4 sm:px-6 sm:pb-10 sm:pt-5">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff6b00] sm:text-xs">
              Frequently Asked
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Buying digital products is simple.
            </h2>

            <div className="mt-5 divide-y divide-slate-200">
              {[
                [
                  "How do downloads work?",
                  "After payment confirmation, eligible files become available inside your account downloads area.",
                ],
                [
                  "Are payments secure?",
                  "Checkout is handled through the configured secure payment provider.",
                ],
                [
                  "Where can I get support?",
                  "Use the Support or Contact page if you need help with an order or download.",
                ],
              ].map(([question, answer]) => (
                <details key={question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                    {question}
                    <span className="text-lg text-slate-400 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 pr-8 text-sm leading-6 text-slate-500">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0b1025_0%,#121a39_60%,#1c2858_100%)] p-6 text-white shadow-[0_18px_40px_rgba(11,16,37,0.18)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff9a4d]">
              Explore Zonix Assets
            </p>
            <h2 className="mt-2 max-w-lg text-3xl font-black leading-tight">
              Find the right digital resource for your next project.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
              Browse the store, compare products and keep your paid downloads inside one account.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-xl bg-[#ff6b00] px-5 py-3 text-center text-sm font-black !text-white shadow-[0_10px_24px_rgba(255,107,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#ea5f00]"
              >
                Browse Store
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-center text-sm font-bold !text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {mounted && loading && (
        <div className="fixed bottom-4 right-4 z-50 rounded-full border border-slate-200/80 bg-white/95 px-3 py-2 text-[11px] font-medium text-slate-500 shadow-lg backdrop-blur">
          Loading content...
        </div>
      )}
    </main>
  );
}

function HeroInfoCard({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300 sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-white/75 sm:text-xs">
        {text}
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6b00] sm:text-xs">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[22px] font-black tracking-[-0.02em] text-slate-950 sm:mt-1.5 sm:text-3xl">
          {title}
        </h2>
      </div>

      <Link
        href={href}
        className="hidden shrink-0 text-sm font-bold text-slate-600 transition hover:text-[#ff6b00] sm:block"
      >
        {linkText} →
      </Link>
    </div>
  );
}

function MovingProductRail({ products }: { products: Product[] }) {
  const visibleProducts = products.slice(0, 5);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {visibleProducts.map((product, index) => (
        <ProductCard
          key={`${product.id || product.slug}-${index}`}
          product={product}
          index={index}
          badge={
            index === 0
              ? "Best Seller"
              : index === 1
              ? "Popular"
              : index === 2
              ? "New"
              : undefined
          }
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  index,
  badge,
}: {
  product: Product;
  index: number;
  badge?: string;
}) {
  const image = productImage(product, index);
  const productHref = `/products/${product.slug}`;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.11)]">
      <Link href={productHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-100 bg-[#f7f8fb]">
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-contain p-2.5 transition duration-500 group-hover:scale-[1.025] sm:p-3"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

          {badge && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-[#0b1025] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:text-[9px]">
              {badge}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.16em] text-[#ff6b00] sm:text-[10px]">
          {product.category || "Digital Product"}
        </p>

        <Link href={productHref} className="mt-1.5 block">
          <h3 className="line-clamp-2 min-h-[36px] text-[13px] font-black leading-[18px] tracking-[-0.01em] text-slate-950 transition group-hover:text-[#ff6b00] sm:min-h-[42px] sm:text-base sm:leading-5">
            {product.title}
          </h3>
        </Link>

        {product.description ? (
          <p className="mt-2 hidden line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500 sm:block">
            {product.description}
          </p>
        ) : (
          <div className="hidden min-h-[40px] sm:block" />
        )}

        <div className="mt-auto pt-3 sm:pt-4">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-black tracking-[-0.02em] text-slate-950 sm:text-lg">
                {money(product.price)}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[8px] font-semibold text-slate-400 sm:mt-1 sm:gap-1.5 sm:text-[10px]">
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 sm:h-2 sm:w-2" />
                Instant access
              </p>
            </div>

            <Link
              href={productHref}
              className="hidden shrink-0 rounded-xl bg-[#0b1025] px-3.5 py-2.5 text-[10px] font-black !text-white shadow-[0_8px_18px_rgba(11,16,37,0.14)] transition hover:-translate-y-0.5 hover:bg-[#ff6b00] sm:inline-flex sm:text-xs"
            >
              View Product
            </Link>
          </div>

          <Link
            href={productHref}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#0b1025] px-3 py-2.5 text-[10px] font-black !text-white shadow-[0_8px_18px_rgba(11,16,37,0.12)] transition hover:bg-[#ff6b00] sm:hidden"
          >
            View Product
          </Link>
        </div>
      </div>
    </article>
  );
}
