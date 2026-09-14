"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ContentPage = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  is_published: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type PagesResponse = {
  success?: boolean;
  pages?: ContentPage[];
  error?: string;
};

const pageLabels: Record<string, string> = {
  about: "About Us",
  contact: "Contact Us",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  support: "Support",
  "refund-policy": "Refund Policy",
};

export default function AdminContentPages() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPages() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/content-pages", {
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as PagesResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load content pages."
        );
      }

      const loadedPages = Array.isArray(data.pages)
        ? data.pages
        : [];

      setPages(loadedPages);

      if (!selectedId && loadedPages.length > 0) {
        selectPage(loadedPages[0]);
      } else if (selectedId) {
        const current = loadedPages.find(
          (page) => page.id === selectedId
        );

        if (current) {
          selectPage(current);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load content pages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  function selectPage(page: ContentPage) {
    setSelectedId(page.id);
    setTitle(page.title || "");
    setSubtitle(page.subtitle || "");
    setContent(page.content || "");
    setIsPublished(page.is_published !== false);
    setMessage("");
    setError("");
  }

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedId) || null,
    [pages, selectedId]
  );

  async function savePage() {
    if (!selectedPage) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/admin/content-pages/${selectedPage.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            subtitle: subtitle.trim() || null,
            content,
            is_published: isPublished,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save content page."
        );
      }

      setMessage("Content page saved successfully.");

      if (data.page) {
        setPages((current) =>
          current.map((page) =>
            page.id === data.page.id ? data.page : page
          )
        );
      }

      await loadPages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save content page."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-white/50">
            Loading content pages...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-6 py-7 md:flex-row md:items-center">
          <div>
            <Link
              href="/admin"
              className="text-2xl font-bold"
            >
              Zonix
              <span className="text-emerald-400">
                Assets
              </span>
            </Link>

            <p className="mt-1 text-sm text-white/40">
              Content Management
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm transition hover:bg-white/5"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/site-settings"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm transition hover:bg-white/5"
            >
              Site Settings
            </Link>

            <Link
              href="/"
              target="_blank"
              className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              View Website
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10">
          <p className="text-sm text-emerald-400">
            CMS
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Content Pages
          </h1>

          <p className="mt-4 max-w-3xl text-white/50">
            Manage public website pages including About,
            Contact, Privacy, Terms, Support and Refund Policy.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                Pages
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Website Content
              </h2>
            </div>

            <div className="space-y-3">
              {pages.map((page) => {
                const active = page.id === selectedId;

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => selectPage(page)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-white/10 bg-black hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {pageLabels[page.slug] ||
                            page.title}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          /{page.slug}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          page.is_published
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-yellow-400/10 text-yellow-300"
                        }`}
                      >
                        {page.is_published
                          ? "PUBLISHED"
                          : "DRAFT"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
            {!selectedPage ? (
              <div className="py-20 text-center text-white/40">
                Select a content page.
              </div>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 md:flex-row md:items-start">
                  <div>
                    <p className="text-sm text-emerald-400">
                      Editing
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      {pageLabels[selectedPage.slug] ||
                        selectedPage.title}
                    </h2>

                    <p className="mt-2 text-sm text-white/40">
                      Public URL: /{selectedPage.slug}
                    </p>
                  </div>

                  <a
                    href={`/${selectedPage.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm transition hover:bg-white/5"
                  >
                    Preview Page ↗
                  </a>
                </div>

                <div className="mt-7 space-y-6">
                  <div>
                    <label className="mb-2 block text-sm text-white/50">
                      Page Title
                    </label>

                    <input
                      value={title}
                      onChange={(event) =>
                        setTitle(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none transition focus:border-emerald-400/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/50">
                      Subtitle
                    </label>

                    <input
                      value={subtitle}
                      onChange={(event) =>
                        setSubtitle(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none transition focus:border-emerald-400/50"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label className="text-sm text-white/50">
                        Page Content
                      </label>

                      <span className="text-xs text-white/30">
                        {content.length} characters
                      </span>
                    </div>

                    <textarea
                      value={content}
                      onChange={(event) =>
                        setContent(event.target.value)
                      }
                      rows={18}
                      placeholder="Write the page content here..."
                      className="w-full resize-y rounded-2xl border border-white/10 bg-black px-5 py-4 leading-7 outline-none transition focus:border-emerald-400/50"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(event) =>
                        setIsPublished(event.target.checked)
                      }
                    />

                    <div>
                      <p className="font-medium">
                        Published
                      </p>

                      <p className="text-xs text-white/40">
                        When disabled, this page will not be
                        available publicly.
                      </p>
                    </div>
                  </label>

                  <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
                    <button
                      type="button"
                      onClick={savePage}
                      disabled={saving}
                      className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        selectPage(selectedPage)
                      }
                      disabled={saving}
                      className="rounded-xl border border-white/10 px-6 py-3 transition hover:bg-white/5 disabled:opacity-50"
                    >
                      Reset
                    </button>

                    <a
                      href={`/${selectedPage.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/10 px-6 py-3 transition hover:bg-white/5"
                    >
                      Open Public Page
                    </a>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}