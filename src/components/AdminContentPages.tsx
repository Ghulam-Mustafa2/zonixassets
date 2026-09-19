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

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/analytics", label: "Analytics" },
];

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

  function selectPage(page: ContentPage) {
    setSelectedId(page.id);
    setTitle(page.title || "");
    setSubtitle(page.subtitle || "");
    setContent(page.content || "");
    setIsPublished(page.is_published !== false);
    setMessage("");
    setError("");
  }

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
        throw new Error(data.error || "Unable to load content pages.");
      }

      const loadedPages = Array.isArray(data.pages) ? data.pages : [];
      setPages(loadedPages);

      if (!selectedId && loadedPages.length > 0) {
        selectPage(loadedPages[0]);
      } else if (selectedId) {
        const current = loadedPages.find((page) => page.id === selectedId);
        if (current) selectPage(current);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load content pages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedId) || null,
    [pages, selectedId]
  );

  const publishedCount = useMemo(
    () => pages.filter((page) => page.is_published).length,
    [pages]
  );

  const draftCount = Math.max(pages.length - publishedCount, 0);

  async function savePage() {
    if (!selectedPage) return;

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
        throw new Error(data.error || "Unable to save content page.");
      }

      setMessage("Content page saved successfully.");

      if (data.page) {
        setPages((current) =>
          current.map((page) => (page.id === data.page.id ? data.page : page))
        );
      }

      await loadPages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save content page."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef3f8] text-[#071326]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
            <div className="mx-auto mb-4 h-3 w-3 animate-pulse rounded-full bg-orange-500" />
            <p className="font-semibold">Loading content pages...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#071326]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10182d] text-white shadow-[0_10px_30px_rgba(2,8,23,0.12)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-5 py-4 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-base font-black text-[#071326] shadow-sm">
              ZA
            </div>
            <div className="min-w-0">
              <Link href="/admin" className="block truncate text-xl font-black leading-tight">
                Zonix<span className="text-cyan-400">Assets</span>
              </Link>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">
                Admin Content
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/90 transition hover:bg-white/[0.08]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/site-settings"
              className="hidden rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white/90 transition hover:bg-white/[0.06] sm:inline-flex"
            >
              Site Settings
            </Link>
            <Link
              href="/"
              target="_blank"
              className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_28px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
            >
              View Store
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-white/10 xl:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex min-w-max max-w-[1600px] gap-2 px-5 py-3 lg:px-10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/85"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <section className="overflow-hidden bg-[#071326] text-white">
        <div
          className="mx-auto max-w-[1600px] px-5 py-12 lg:px-10 lg:py-16"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px), radial-gradient(circle at 95% 15%, rgba(249,115,22,.23), transparent 28%), radial-gradient(circle at 0% 85%, rgba(6,182,212,.16), transparent 30%)",
            backgroundSize: "64px 64px,64px 64px,auto,auto",
          }}
        >
          <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_.75fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Content Center
              </div>
              <h1 className="mt-7 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Manage every public page from one place.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/60 lg:text-lg">
                Edit About, Contact, Privacy, Terms, Support and Refund Policy content without touching the public page layouts.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ["Pages", pages.length],
                ["Published", publishedCount],
                ["Drafts", draftCount],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 sm:p-5"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black sm:text-3xl">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 py-8 lg:px-10 lg:py-10">
        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] xl:sticky xl:top-[106px]">
            <div className="rounded-2xl bg-[#071326] px-5 py-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                Website Pages
              </p>
              <h2 className="mt-2 text-xl font-black">Content library</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Choose a page to edit its CMS copy.
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {pages.map((page) => {
                const active = page.id === selectedId;

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => selectPage(page)}
                    className={`group w-full rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-[#071326] bg-[#071326] text-white shadow-sm"
                        : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black">
                          {pageLabels[page.slug] || page.title}
                        </p>
                        <p className={`mt-1 truncate text-xs ${active ? "text-white/45" : "text-slate-400"}`}>
                          /{page.slug}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${
                          page.is_published
                            ? active
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-emerald-50 text-emerald-700"
                            : active
                            ? "bg-amber-300/15 text-amber-200"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {page.is_published ? "Live" : "Draft"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            {!selectedPage ? (
              <div className="px-6 py-24 text-center text-slate-400">
                Select a content page.
              </div>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-5 border-b border-slate-200 px-6 py-6 md:flex-row md:items-center md:px-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">
                      Editing Page
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] sm:text-3xl">
                      {pageLabels[selectedPage.slug] || selectedPage.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Public URL: /{selectedPage.slug}
                    </p>
                  </div>

                  <a
                    href={`/${selectedPage.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    Preview Page ↗
                  </a>
                </div>

                <div className="space-y-6 px-6 py-7 md:px-8 md:py-8">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Page Title
                      </label>
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3.5 text-[#071326] outline-none transition placeholder:text-slate-300 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Subtitle
                      </label>
                      <input
                        value={subtitle}
                        onChange={(event) => setSubtitle(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-3.5 text-[#071326] outline-none transition placeholder:text-slate-300 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Page Content
                      </label>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                        {content.length} characters
                      </span>
                    </div>
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      rows={18}
                      placeholder="Write the page content here..."
                      className="min-h-[420px] w-full resize-y rounded-3xl border border-slate-200 bg-[#f7f9fc] px-5 py-5 leading-8 text-[#24344d] outline-none transition placeholder:text-slate-300 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-[#f7f9fc] px-5 py-4 transition hover:bg-white">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(event) => setIsPublished(event.target.checked)}
                      className="mt-1 h-5 w-5 accent-orange-500"
                    />
                    <div>
                      <p className="font-black text-[#071326]">Published</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        When disabled, this page will not be available publicly.
                      </p>
                    </div>
                  </label>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={savePage}
                      disabled={saving}
                      className="rounded-2xl bg-orange-500 px-6 py-3.5 font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.22)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPage(selectedPage)}
                      disabled={saving}
                      className="rounded-2xl border border-slate-200 px-6 py-3.5 font-black transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Reset
                    </button>

                    <a
                      href={`/${selectedPage.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-slate-200 px-6 py-3.5 text-center font-black transition hover:border-orange-200 hover:bg-orange-50"
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
