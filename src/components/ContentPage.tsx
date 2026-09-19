"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ContentPageData = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ContentPageResponse = {
  success?: boolean;
  page?: ContentPageData;
  error?: string;
};

type ContentPageProps = {
  slug: string;
};

export default function ContentPage({
  slug,
}: ContentPageProps) {
  const [page, setPage] =
    useState<ContentPageData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/content-pages/${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as ContentPageResponse;

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load this page."
          );
        }

        if (!cancelled) {
          setPage(data.page || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this page."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const formattedContent = useMemo(() => {
    if (!page?.content) {
      return [];
    }

    return page.content
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
  }, [page?.content]);

  if (loading) {
    return (
      <main className="min-h-[72vh] bg-[#eef3f8] text-[#081529]">
        <section className="bg-[#071426] text-white">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
            <div className="animate-pulse">
              <div className="h-8 w-36 rounded-full bg-white/10" />
              <div className="mt-7 h-14 max-w-3xl rounded-2xl bg-white/10" />
              <div className="mt-5 h-7 max-w-2xl rounded-xl bg-white/5" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 md:px-8">
          <div className="rounded-[30px] border border-[#dce4ef] bg-white p-6 shadow-[0_20px_60px_rgba(20,35,60,.06)] md:p-10">
            <div className="animate-pulse space-y-4">
              <div className="h-5 rounded bg-slate-100" />
              <div className="h-5 rounded bg-slate-100" />
              <div className="h-5 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !page) {
    return (
      <main className="min-h-[72vh] bg-[#eef3f8] text-[#081529]">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center md:px-8 md:py-32">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <div className="mt-6 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700">
            Page unavailable
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
            Content could not be loaded
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-[#718099]">
            {error ||
              "This page is currently unavailable."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-2xl bg-[#081529] px-6 py-3.5 font-black text-white transition hover:bg-[#ff6500]"
            >
              Back to Home
            </Link>

            <Link
              href="/products"
              className="rounded-2xl border border-[#dce4ef] bg-white px-6 py-3.5 font-black text-[#081529] transition hover:border-[#cbd6e4]"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const pageMeta = getPageMeta(page.slug);

  return (
    <main className="bg-[#eef3f8] text-[#081529]">
      <section
        className="relative overflow-hidden bg-[#071426] text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 8% 100%, rgba(0,190,220,.15), transparent 30%), radial-gradient(circle at 92% 10%, rgba(255,101,0,.18), transparent 28%)",
          backgroundSize:
            "64px 64px, 64px 64px, auto, auto",
        }}
      >
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
            <span className="h-2 w-2 rounded-full bg-[#ff6500]" />
            {pageMeta.label}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                {page.title}
              </h1>

              {page.subtitle && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-white/55 md:text-xl">
                  {page.subtitle}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
              <HeroInfo
                label="Section"
                value={pageMeta.shortLabel}
              />

              {page.updated_at && (
                <HeroInfo
                  label="Last updated"
                  value={formatDisplayDate(
                    page.updated_at
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[26px] border border-[#dce4ef] bg-white p-5 shadow-[0_16px_50px_rgba(20,35,60,.05)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6500]">
                ZonixAssets
              </p>

              <h2 className="mt-2 text-xl font-black">
                {pageMeta.sidebarTitle}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#718099]">
                {pageMeta.sidebarText}
              </p>

              <div className="mt-5 grid gap-2">
                <SidebarLink
                  href="/about"
                  active={page.slug === "about"}
                >
                  About
                </SidebarLink>

                <SidebarLink
                  href="/contact"
                  active={page.slug === "contact"}
                >
                  Contact
                </SidebarLink>

                <SidebarLink
                  href="/support"
                  active={page.slug === "support"}
                >
                  Support
                </SidebarLink>

                <SidebarLink
                  href="/privacy"
                  active={page.slug === "privacy"}
                >
                  Privacy
                </SidebarLink>

                <SidebarLink
                  href="/terms"
                  active={page.slug === "terms"}
                >
                  Terms
                </SidebarLink>

                <SidebarLink
                  href="/refund-policy"
                  active={
                    page.slug === "refund-policy"
                  }
                >
                  Refund Policy
                </SidebarLink>
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <article className="rounded-[30px] border border-[#dce4ef] bg-white shadow-[0_20px_60px_rgba(20,35,60,.06)]">
              <div className="border-b border-[#e7edf4] p-6 md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6500]">
                  Official information
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                  {page.title}
                </h2>

                {page.subtitle && (
                  <p className="mt-3 max-w-3xl text-[#718099]">
                    {page.subtitle}
                  </p>
                )}
              </div>

              <div className="p-6 md:p-10">
                {formattedContent.length > 0 ? (
                  <div className="space-y-7">
                    {formattedContent.map(
                      (block, index) => (
                        <ContentBlock
                          key={`${page.id}-${index}`}
                          text={block}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-xl text-[#ff6500]">
                      ✦
                    </div>

                    <p className="mt-4 font-semibold text-[#718099]">
                      No content has been added to
                      this page yet.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <section className="overflow-hidden rounded-[30px] bg-[#071426] text-white shadow-[0_20px_60px_rgba(20,35,60,.12)]">
              <div className="grid gap-7 p-7 md:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                    Explore ZonixAssets
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight">
                    Need something else?
                  </h2>

                  <p className="mt-3 max-w-2xl text-white/55">
                    Browse the store or return
                    home to explore digital assets,
                    creator tools and resources.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-center font-black transition hover:bg-white/10"
                  >
                    Back Home
                  </Link>

                  <Link
                    href="/products"
                    className="rounded-2xl bg-[#ff6500] px-5 py-3.5 text-center font-black text-white transition hover:bg-[#ff7420]"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            </section>

            {page.updated_at && (
              <p className="px-1 text-xs font-semibold text-[#9aa8bb]">
                Last updated:{" "}
                {formatDisplayDate(page.updated_at)}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ContentBlock({
  text,
}: {
  text: string;
}) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] || "";

  const looksLikeHeading =
    lines.length === 1 &&
    firstLine.length <= 80 &&
    !/[.!?]$/.test(firstLine);

  if (looksLikeHeading) {
    return (
      <h2 className="pt-2 text-2xl font-black tracking-tight text-[#081529] md:text-3xl">
        {firstLine}
      </h2>
    );
  }

  if (
    lines.every(
      (line) =>
        line.startsWith("- ") ||
        line.startsWith("• ")
    )
  ) {
    return (
      <ul className="space-y-3">
        {lines.map((line, index) => (
          <li
            key={index}
            className="flex gap-3 rounded-2xl border border-[#e7edf4] bg-[#f8fafc] px-4 py-3.5"
          >
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#ff6500]" />

            <span className="leading-7 text-[#60718e]">
              {line.replace(/^[-•]\s*/, "")}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      {lines.map((line, index) => (
        <p
          key={index}
          className="text-base leading-8 text-[#60718e]"
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function HeroInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-300">
        {label}
      </p>

      <p className="mt-2 font-black text-white">
        {value}
      </p>
    </div>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-2xl bg-[#081529] px-4 py-3 text-sm font-black text-white"
          : "rounded-2xl border border-[#e5ebf2] bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#60718e] transition hover:bg-white hover:text-[#081529]"
      }
    >
      {children}
    </Link>
  );
}

function formatDisplayDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getPageMeta(slug: string) {
  switch (slug) {
    case "about":
      return {
        label: "Company",
        shortLabel: "About",
        sidebarTitle: "Company",
        sidebarText:
          "Learn more about ZonixAssets and the information behind the store.",
      };

    case "contact":
      return {
        label: "Get in Touch",
        shortLabel: "Contact",
        sidebarTitle: "Contact",
        sidebarText:
          "Find the right place to reach the ZonixAssets team.",
      };

    case "privacy":
      return {
        label: "Legal",
        shortLabel: "Privacy",
        sidebarTitle: "Legal Center",
        sidebarText:
          "Review privacy, terms and store policies.",
      };

    case "terms":
      return {
        label: "Legal",
        shortLabel: "Terms",
        sidebarTitle: "Legal Center",
        sidebarText:
          "Review privacy, terms and store policies.",
      };

    case "support":
      return {
        label: "Help Center",
        shortLabel: "Support",
        sidebarTitle: "Help Center",
        sidebarText:
          "Get help with orders, downloads, accounts and store questions.",
      };

    case "refund-policy":
      return {
        label: "Policy",
        shortLabel: "Refund Policy",
        sidebarTitle: "Legal Center",
        sidebarText:
          "Review refund, privacy and store terms.",
      };

    default:
      return {
        label: "Information",
        shortLabel: "Information",
        sidebarTitle: "Information",
        sidebarText:
          "Browse important information about ZonixAssets.",
      };
  }
}
