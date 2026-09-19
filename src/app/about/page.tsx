import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = [
  {
    title: "Website Templates",
    slug: "website-templates",
    label: "Launch-ready websites",
  },
  {
    title: "UI Kits",
    slug: "ui-kits",
    label: "Interfaces & systems",
  },
  {
    title: "Graphics",
    slug: "graphics",
    label: "Visual creative assets",
  },
  {
    title: "Digital Tools",
    slug: "digital-tools",
    label: "Creator productivity",
  },
];

const principles = [
  {
    title: "Useful by design",
    text: "Focused digital resources made to help creators move from idea to execution faster.",
  },
  {
    title: "Clear before checkout",
    text: "Product information, pricing and access are presented clearly before purchase.",
  },
  {
    title: "Built for digital work",
    text: "The store is designed around creators, startups and modern online teams.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#eef2f7] text-[#0b1220]">
      <Navbar />

      {/* PROFILE COVER */}
      <section className="relative overflow-hidden bg-[#0b1220]">
        <div className="absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:52px_52px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.17em] text-orange-300 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
              Company Profile
            </div>

            <Link
              href="/products"
              className="hidden rounded-xl bg-[#ff6b00] px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_28px_rgba(255,107,0,.24)] transition hover:bg-[#ff7a18] sm:inline-flex"
            >
              Browse Store →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.35fr_.65fr]">
            <div className="relative min-h-[290px] overflow-hidden rounded-[28px] border border-white/10 bg-[#111a32] shadow-2xl sm:min-h-[330px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(34,211,238,0.20),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(255,107,0,0.22),transparent_34%)]" />

              <div className="absolute left-[6%] top-[11%] h-[69%] w-[54%] rotate-[-4deg] rounded-[24px] border border-white/10 bg-white/[0.07] p-3 shadow-2xl backdrop-blur sm:p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b00]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/80" />
                </div>

                <div className="mt-4 grid h-[calc(100%-1.5rem)] grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-2xl bg-white p-3 text-[#0b1220] sm:p-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#ff6b00] sm:text-[9px]">
                      Templates
                    </p>
                    <p className="mt-2 text-base font-black sm:mt-3 sm:text-xl">Build faster.</p>
                    <div className="mt-4 h-14 rounded-xl bg-slate-100 sm:mt-5 sm:h-20" />
                  </div>

                  <div className="rounded-2xl bg-[#0d1733] p-3 sm:p-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-orange-300 sm:text-[9px]">
                      UI Kits
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2">
                      <div className="h-11 rounded-lg bg-white/10 sm:h-14" />
                      <div className="h-11 rounded-lg bg-white/5 sm:h-14" />
                      <div className="h-11 rounded-lg bg-white/5 sm:h-14" />
                      <div className="h-11 rounded-lg bg-white/10 sm:h-14" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[9%] right-[5%] w-[38%] rotate-[5deg] rounded-[22px] border border-white/10 bg-white p-3 text-[#0b1220] shadow-2xl sm:p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#ff6b00] sm:text-[9px]">
                  Digital Assets
                </p>
                <p className="mt-2 text-sm font-black sm:text-lg">Create. Launch. Grow.</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-2">
                  <div className="aspect-square rounded-lg bg-orange-100 sm:rounded-xl" />
                  <div className="aspect-square rounded-lg bg-cyan-100 sm:rounded-xl" />
                  <div className="aspect-square rounded-lg bg-slate-100 sm:rounded-xl" />
                </div>
              </div>

              <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur sm:bottom-5 sm:left-5 sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/35 sm:text-[9px]">
                  Zonix Assets
                </p>
                <p className="mt-1 text-xs font-black text-white sm:text-sm">
                  Digital asset store for creators
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 text-white backdrop-blur sm:p-5 md:rounded-[28px] md:p-6">
                <p className="text-[8px] font-black uppercase tracking-[0.17em] text-orange-300 sm:text-[9px]">
                  Digital Store
                </p>
                <p className="mt-3 text-xl font-black tracking-[-0.04em] sm:text-2xl md:mt-4 md:text-3xl">
                  Curated digital products.
                </p>
                <p className="mt-2 text-xs leading-5 text-white/50 sm:text-sm sm:leading-6">
                  Templates, UI resources, graphics and tools in one focused store.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#151f3b] p-4 text-white sm:p-5 md:rounded-[28px] md:p-6">
                <p className="text-[8px] font-black uppercase tracking-[0.17em] text-cyan-300 sm:text-[9px]">
                  Creator focused
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2.5 md:mt-5 md:gap-3">
                  <div className="rounded-2xl bg-white/[0.06] p-3 sm:p-4">
                    <p className="text-xl font-black sm:text-2xl">04</p>
                    <p className="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-white/30 sm:text-[8px]">
                      Categories
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] p-3 sm:p-4">
                    <p className="text-xl font-black sm:text-2xl">100%</p>
                    <p className="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-white/30 sm:text-[8px]">
                      Digital
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING COMPANY PROFILE */}
      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-5 sm:-mt-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.13)]">
          <div className="grid lg:grid-cols-[1fr_.85fr]">
            <div className="p-5 sm:p-7 lg:p-8">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-[#0b1220] text-3xl font-black text-white shadow-lg sm:h-20 sm:w-20 sm:rounded-[22px] sm:text-4xl">
                  Z
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <h1 className="text-2xl font-black tracking-[-0.04em] sm:text-4xl">
                      Zonix Assets
                    </h1>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-[#ff6b00] sm:px-3 sm:text-[9px]">
                      Digital Asset Store
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs font-semibold text-[#ff6b00] sm:mt-2 sm:text-sm">
                    Digital resources for modern creators.
                  </p>

                  <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-500 sm:mt-4 sm:text-sm sm:leading-7">
                    Zonix Assets helps creators, startups and digital teams discover
                    useful templates, interface kits, graphics and tools without the
                    clutter of a traditional multi-seller platform.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 sm:mt-7">
                {["Templates", "UI Kits", "Graphics", "Digital Tools"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1.5 text-[9px] font-bold text-slate-600 sm:py-2 sm:text-[10px]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-[#fafbfc] p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:border-0 lg:border-b lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-4 lg:pt-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[9px]">
                    Website
                  </p>
                  <p className="mt-1 text-xs font-black sm:text-sm">zonixassets.shop</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:border-0 lg:border-b lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-4 lg:pt-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[9px]">
                    Store type
                  </p>
                  <p className="mt-1 text-xs font-black sm:text-sm">Digital products only</p>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500 sm:text-xs">
                    All products sold on ZonixAssets are owned and distributed by ZonixAssets.
                    We do not accept third-party sellers or vendor listings.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:border-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[9px]">
                    Support
                  </p>
                  <Link
                    href="/contact"
                    className="mt-1 inline-block text-xs font-black transition hover:text-[#ff6b00] sm:text-sm"
                  >
                    Contact support →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-3">
            <Link
              href="/products"
              className="flex min-h-12 items-center justify-center gap-2 border-b border-r border-slate-200 px-3 py-3 text-[11px] font-black transition hover:bg-orange-50 hover:text-[#ff6b00] sm:border-b-0 sm:px-5 sm:py-4 sm:text-sm"
            >
              <span>⌕</span> Browse Store
            </Link>
            <Link
              href="/categories"
              className="flex min-h-12 items-center justify-center gap-2 border-b border-slate-200 px-3 py-3 text-[11px] font-black transition hover:bg-cyan-50 sm:border-b-0 sm:border-r sm:px-5 sm:py-4 sm:text-sm"
            >
              <span>▦</span> Categories
            </Link>
            <Link
              href="/contact"
              className="col-span-2 flex min-h-12 items-center justify-center gap-2 px-3 py-3 text-[11px] font-black transition hover:bg-slate-50 sm:col-span-1 sm:px-5 sm:py-4 sm:text-sm"
            >
              <span>✉</span> Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* MISSION + PRINCIPLES */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[28px] bg-[#0b1220] p-6 text-white sm:p-8 lg:p-9">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300 sm:text-[10px]">
              Our mission
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:mt-4 sm:text-4xl">
              Make finding digital assets feel effortless.
            </h2>
            <p className="mt-4 text-xs leading-6 text-white/55 sm:mt-5 sm:text-sm sm:leading-7">
              We want the store experience to feel clear from the first browse
              to the final product page — less noise, better discovery and useful
              resources that are easy to understand.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex rounded-xl bg-[#ff6b00] px-5 py-3 text-xs font-black text-white transition hover:bg-[#ff7a18] sm:mt-7 sm:text-sm"
            >
              Explore Store
            </Link>
          </div>

          <div className="grid auto-rows-fr gap-3 sm:grid-cols-3 sm:gap-4">
            {principles.map((item, index) => (
              <article
                key={item.title}
                className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.04)] sm:p-6"
              >
                <p className="text-[9px] font-black text-[#ff6b00] sm:text-[10px]">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-lg font-black tracking-[-0.025em] sm:mt-5 sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-6 text-slate-500 sm:mt-3 sm:text-sm sm:leading-7">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COLLECTION STORIES */}
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 sm:pb-14 lg:px-8">
        <div className="mb-5 flex flex-col gap-1.5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff6b00] sm:text-[10px]">
              Explore Zonix
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-4xl">
              Four ways to start creating.
            </h2>
          </div>

          <Link
            href="/categories"
            className="mt-1 text-xs font-black text-slate-500 transition hover:text-[#ff6b00] sm:mt-0 sm:text-sm"
          >
            View all categories →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((item, index) => (
            <Link
              key={item.slug}
              href={`/categories/${item.slug}`}
              className="group relative min-h-[190px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:min-h-[220px] sm:rounded-[28px]"
            >
              <div
                className={`absolute inset-0 ${
                  index === 0
                    ? "bg-[radial-gradient(circle_at_80%_15%,rgba(255,107,0,.20),transparent_36%)]"
                    : index === 1
                    ? "bg-[radial-gradient(circle_at_80%_15%,rgba(34,211,238,.18),transparent_36%)]"
                    : index === 2
                    ? "bg-[radial-gradient(circle_at_80%_15%,rgba(168,85,247,.15),transparent_36%)]"
                    : "bg-[radial-gradient(circle_at_80%_15%,rgba(16,185,129,.16),transparent_36%)]"
                }`}
              />

              <div className="relative flex h-full min-h-[190px] flex-col p-5 sm:min-h-[220px] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#ff6b00] sm:text-[9px]">
                    Collection
                  </span>
                  <span className="text-2xl font-black text-slate-100 sm:text-3xl">
                    0{index + 1}
                  </span>
                </div>

                <div className="mt-auto">
                  <h3 className="text-xl font-black tracking-[-0.03em] sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                    {item.label}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 sm:mt-5 sm:pt-4">
                    <span className="text-[10px] font-black sm:text-xs">Open collection</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1220] text-sm text-white transition group-hover:translate-x-1 group-hover:bg-[#ff6b00] sm:h-9 sm:w-9">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-18 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0b1220] p-6 text-white sm:p-8 lg:flex lg:items-center lg:justify-between lg:p-9">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />

          <div className="relative max-w-2xl">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-orange-300 sm:text-[9px]">
              Start exploring
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:text-4xl">
              Your next project can start here.
            </h2>
            <p className="mt-3 text-xs leading-6 text-white/50 sm:text-sm sm:leading-7">
              Browse the complete ZonixAssets store and find a resource that fits your next idea.
            </p>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-0 lg:flex">
            <Link
              href="/products"
              className="w-full rounded-xl bg-[#ff6b00] px-5 py-3 text-center text-xs font-black text-white transition hover:bg-[#ff7a18] sm:px-6 sm:py-3.5 sm:text-sm lg:w-auto"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-center text-xs font-black text-white transition hover:bg-white/[0.09] sm:px-6 sm:py-3.5 sm:text-sm lg:w-auto"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
