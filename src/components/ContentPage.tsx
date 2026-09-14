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
          `/api/content-pages/${encodeURIComponent(
            slug
          )}`,
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
      <main className="min-h-[70vh] bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="animate-pulse">
            <div className="h-4 w-28 rounded bg-emerald-400/20" />

            <div className="mt-6 h-14 max-w-xl rounded bg-white/10" />

            <div className="mt-5 h-6 max-w-2xl rounded bg-white/5" />

            <div className="mt-12 space-y-4">
              <div className="h-5 rounded bg-white/5" />
              <div className="h-5 rounded bg-white/5" />
              <div className="h-5 w-3/4 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !page) {
    return (
      <main className="min-h-[70vh] bg-black text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center">
          <div className="rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300">
            Page unavailable
          </div>

          <h1 className="mt-6 text-4xl font-bold">
            Content could not be loaded
          </h1>

          <p className="mt-4 max-w-xl text-white/50">
            {error ||
              "This page is currently unavailable."}
          </p>

          <Link
            href="/"
            className="mt-8 rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-emerald-950/30 to-black">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
            {getSectionLabel(page.slug)}
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            {page.title}
          </h1>

          {page.subtitle && (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/50 md:text-xl">
              {page.subtitle}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-10">
          {formattedContent.length > 0 ? (
            <div className="space-y-6">
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
              <p className="text-white/40">
                No content has been added to
                this page yet.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            ← Back Home
          </Link>

          <Link
            href="/products"
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Browse Products
          </Link>
        </div>

        {page.updated_at && (
          <p className="mt-10 text-xs text-white/30">
            Last updated:{" "}
            {new Date(
              page.updated_at
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
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
      <h2 className="pt-3 text-2xl font-semibold tracking-tight text-white">
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
      <ul className="space-y-3 pl-1 text-white/60">
        {lines.map((line, index) => (
          <li
            key={index}
            className="flex gap-3"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

            <span className="leading-7">
              {line.replace(/^[-•]\s*/, "")}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <p
          key={index}
          className="text-base leading-8 text-white/60"
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function getSectionLabel(
  slug: string
) {
  switch (slug) {
    case "about":
      return "Company";

    case "contact":
      return "Get in Touch";

    case "privacy":
      return "Legal";

    case "terms":
      return "Legal";

    case "support":
      return "Help Center";

    case "refund-policy":
      return "Policy";

    default:
      return "Information";
  }
}