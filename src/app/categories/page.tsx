import Link from "next/link";

type Category = {
  title: string;
  slug: string;
  eyebrow: string;
  description: string;
  tags: string[];
  number: string;
  icon: string;
  featuredLabel: string;
};

const categories: Category[] = [
  {
    title: "Website Templates",
    slug: "website-templates",
    eyebrow: "Web & Landing Pages",
    description:
      "Polished website layouts for startups, creators, agencies and modern businesses.",
    tags: ["Landing Pages", "Business Sites", "Portfolios"],
    number: "01",
    icon: "⌘",
    featuredLabel: "Launch-ready",
  },
  {
    title: "UI Kits",
    slug: "ui-kits",
    eyebrow: "Interfaces & Components",
    description:
      "Reusable screens, dashboards and interface systems for products, apps and SaaS experiences.",
    tags: ["Dashboards", "App Screens", "Design Systems"],
    number: "02",
    icon: "◫",
    featuredLabel: "Creator favorite",
  },
  {
    title: "Graphics",
    slug: "graphics",
    eyebrow: "Visual Design Assets",
    description:
      "Creative graphics for campaigns, social media, mockups, presentations and branding.",
    tags: ["Social Graphics", "Mockups", "Marketing"],
    number: "03",
    icon: "✦",
    featuredLabel: "Visual assets",
  },
  {
    title: "Digital Tools",
    slug: "digital-tools",
    eyebrow: "Resources & Productivity",
    description:
      "Useful digital resources designed to simplify workflows and speed up creative work.",
    tags: ["Creator Tools", "Workflow", "Productivity"],
    number: "04",
    icon: "⚡",
    featuredLabel: "Workflow ready",
  },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#071126]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1220] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 bottom-[-9rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-16 top-[-6rem] h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-end gap-10 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b00]" />
                Browse Collections
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[66px]">
                Find the right digital asset
                <span className="block text-white/60">for your next project.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
                Explore focused collections of templates, UI kits, graphics and creator tools — all organized for fast discovery.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-xl bg-[#ff6b00] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,107,0,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ff7a18]"
                >
                  Browse All Products
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.08]"
                >
                  Back Home
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                ["04", "Categories"],
                ["Curated", "Digital Store"],
                ["24/7", "Account access"],
                ["Instant", "Digital delivery"],
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className={`rounded-[22px] border p-5 sm:p-6 ${
                    index === 0
                      ? "border-white/12 bg-white/[0.08]"
                      : "border-white/10 bg-[#111c33]"
                  }`}
                >
                  <p className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/35 sm:text-[10px]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 border-b border-[#dfe5ee] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6b00]">
              Zonix Assets
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#071126] sm:text-4xl">
              Browse by category
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#60708d] sm:text-right">
            Each collection is organized to help you move from idea to the right asset quickly.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-[28px] border border-[#e0e6ef] bg-white shadow-[0_22px_60px_rgba(7,17,38,0.08)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_28px_70px_rgba(7,17,38,0.12)]"
            >
              <div className="absolute right-0 top-0 h-36 w-40 rounded-bl-[90px] bg-gradient-to-br from-orange-50 via-cyan-50/80 to-transparent" />

              <div className="relative p-6 sm:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50/70 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#f05f00]">
                      {category.eyebrow}
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#dfe5ee] bg-[#f7f9fc] text-xl font-black text-[#071126] shadow-sm transition group-hover:border-orange-200 group-hover:bg-orange-50">
                        {category.icon}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#94a0b6]">
                          Collection {category.number}
                        </p>
                        <h3 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#071126] sm:text-3xl">
                          {category.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="text-5xl font-black tracking-[-0.08em] text-[#eef2f7] sm:text-6xl">
                    {category.number}
                  </div>
                </div>

                <p className="mt-6 max-w-2xl text-sm leading-7 text-[#61718d] sm:text-[15px]">
                  {category.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {category.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#dde4ed] bg-[#f7f9fc] px-3 py-1.5 text-[9px] font-bold text-[#5f6e87] sm:text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-[#e7ebf1] pt-5">
                  <div>
                    <p className="text-sm font-black text-[#071126]">Explore Collection</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#95a1b4]">
                      {category.featuredLabel}
                    </p>
                  </div>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-black transition duration-300 group-hover:translate-x-1 ${
                      index % 2 === 0
                        ? "bg-[#071126] text-white group-hover:bg-[#ff6b00]"
                        : "bg-[#ff6b00] text-white"
                    }`}
                  >
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* DIGITAL STORE STRIP */}
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 sm:pb-14 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-[#dde4ed] bg-white shadow-[0_20px_55px_rgba(7,17,38,0.07)]">
          <div className="grid md:grid-cols-[1.15fr_.85fr]">
            <div className="bg-[#0b1220] p-7 text-white sm:p-9">
              <p className="text-[9px] font-black uppercase tracking-[0.17em] text-orange-300">
                Built for creators
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Less clutter. Faster discovery.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
                Every category keeps browsing focused, clear and easy to scan across desktop and mobile.
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#e4e9f0] bg-white">
              {[
                ["01", "Focused", "Clear structure"],
                ["02", "Curated", "Useful assets"],
                ["03", "Ready", "Quick access"],
              ].map(([number, title, text]) => (
                <div key={number} className="p-5 sm:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff6b00]">
                    {number}
                  </p>
                  <p className="mt-5 text-lg font-black text-[#071126] sm:text-xl">
                    {title}
                  </p>
                  <p className="mt-3 text-xs leading-6 text-[#71809a] sm:text-sm">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0b1220] px-7 py-9 text-white sm:px-9 sm:py-10 lg:flex lg:items-center lg:justify-between">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-orange-300">
              Zonix Assets Digital Store
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Ready to explore the full store?
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Browse every available digital product in one clean store.
            </p>
          </div>

          <div className="relative mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-xl bg-[#ff6b00] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,107,0,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ff7a18]"
            >
              Browse Products
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
