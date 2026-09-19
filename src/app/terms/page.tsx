import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentPage from "@/components/ContentPage";

const highlights = [
  {
    number: "01",
    title: "Store use",
    text: "Use Zonix Assets only for lawful purchases, downloads and normal store activity.",
  },
  {
    number: "02",
    title: "Digital products",
    text: "Product details, compatibility and included files should be reviewed before completing a purchase.",
  },
  {
    number: "03",
    title: "Account access",
    text: "Keep your account details secure and use your account to access eligible purchased files.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fa] text-[#0b1220]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1220] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                Terms &amp; Conditions
              </div>

              <h1 className="mt-5 max-w-3xl text-[38px] font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-[64px]">
                Clear rules for using the store.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58 sm:text-base sm:leading-8">
                These terms explain the conditions that apply when you browse,
                purchase digital products, use your account or contact Zonix Assets
                support.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  href="/privacy"
                  className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-center text-xs font-black text-white transition hover:bg-white/[0.09] sm:px-5 sm:text-sm"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/refund-policy"
                  className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-center text-xs font-black text-white transition hover:bg-white/[0.09] sm:px-5 sm:text-sm"
                >
                  Refund Policy
                </Link>
                <Link
                  href="/contact"
                  className="col-span-2 rounded-xl bg-[#ff6b00] px-4 py-3 text-center text-xs font-black text-white transition hover:bg-[#ff7a18] sm:col-span-1 sm:px-5 sm:text-sm"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4 sm:p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                  Scope
                </p>
                <p className="mt-3 text-[19px] font-black leading-tight sm:text-xl">
                  Digital product store
                </p>
                <p className="mt-2 text-[11px] leading-5 text-white/40 sm:text-xs">
                  Purchases, accounts, downloads and support.
                </p>
              </div>

              <div className="rounded-[22px] bg-white p-4 text-[#0b1220] sm:p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                  Need help?
                </p>
                <p className="mt-3 text-[19px] font-black leading-tight sm:text-xl">
                  Terms question
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex text-[11px] font-black text-[#ff6b00] sm:text-xs"
                >
                  Contact support →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {highlights.map((item) => (
            <article
              key={item.number}
              className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.04)] sm:p-6"
            >
              <p className="text-[9px] font-black text-[#ff6b00]">{item.number}</p>
              <h2 className="mt-3 text-xl font-black tracking-[-0.025em] sm:text-[22px]">
                {item.title}
              </h2>
              <p className="mt-2.5 text-[13px] leading-6 text-slate-500 sm:text-sm sm:leading-7">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* TERMS DOCUMENT */}
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 sm:pb-14 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-5">
          <aside className="h-fit rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.04)] lg:sticky lg:top-28">
            <p className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#ff6b00]">
              Legal Center
            </p>

            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
              <a
                href="#terms-document"
                className="shrink-0 rounded-xl bg-[#0b1220] px-4 py-3 text-center text-xs font-black text-white lg:block lg:w-full lg:text-left lg:text-sm"
              >
                Terms &amp; Conditions
              </a>
              <Link
                href="/privacy"
                className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-center text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:text-[#ff6b00] lg:block lg:w-full lg:text-left lg:text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/refund-policy"
                className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-center text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:text-[#ff6b00] lg:block lg:w-full lg:text-left lg:text-sm"
              >
                Refund Policy
              </Link>
              <Link
                href="/contact"
                className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-center text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:text-[#ff6b00] lg:block lg:w-full lg:text-left lg:text-sm"
              >
                Contact
              </Link>
            </nav>
          </aside>

          <div
            id="terms-document"
            className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)] sm:rounded-[28px]"
          >
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                  Official document
                </p>
                <h2 className="mt-2 max-w-[680px] text-[22px] font-black leading-[1.08] tracking-[-0.035em] sm:text-2xl lg:text-[28px]">
                  Zonix Assets Terms &amp; Conditions
                </h2>
              </div>

              <span className="text-[10px] font-bold text-slate-400 sm:text-xs">
                Store usage terms
              </span>
            </div>

            {/* CMS content stays the source of truth; duplicate page chrome is hidden. */}
            <div
              className="
                px-5 py-5 sm:px-8 sm:py-7 lg:px-10 lg:py-8

                [&>main]:!min-h-0
                [&>main]:!bg-transparent
                [&>main]:!p-0
                [&>main]:!text-[#0b1220]

                [&>main>section:first-child]:!hidden

                [&_section]:!border-0
                [&_section]:!bg-transparent
                [&_section]:!px-0
                [&_section]:!py-0

                [&_article]:!mx-0
                [&_article]:!max-w-none
                [&_article]:!p-0
                [&_div]:!max-w-none

                [&_h1]:!mt-0
                [&_h1]:!text-2xl
                [&_h1]:!font-black
                [&_h1]:!leading-tight
                [&_h1]:!tracking-[-0.035em]
                sm:[&_h1]:!text-3xl

                [&_h2]:!mt-7
                [&_h2]:!text-[18px]
                [&_h2]:!font-black
                [&_h2]:!leading-snug
                [&_h2]:!tracking-[-0.02em]
                sm:[&_h2]:!mt-8
                sm:[&_h2]:!text-xl

                [&_h3]:!mt-6
                [&_h3]:!text-base
                [&_h3]:!font-black
                sm:[&_h3]:!text-lg

                [&_p]:!mt-3
                [&_p]:!max-w-[900px]
                [&_p]:!text-[13px]
                [&_p]:!leading-[1.75]
                [&_p]:!text-slate-600
                sm:[&_p]:!text-[15px]
                sm:[&_p]:!leading-7

                [&_ul]:!my-4
                [&_ul]:!space-y-2.5
                [&_ol]:!my-4
                [&_ol]:!space-y-2.5
                [&_li]:!max-w-[900px]
                [&_li]:!text-[13px]
                [&_li]:!leading-[1.75]
                [&_li]:!text-slate-600
                sm:[&_li]:!text-[15px]
                sm:[&_li]:!leading-7

                [&_a]:!h-auto
                [&_a]:!min-h-0
                [&_a]:!rounded-none
                [&_a]:!border-0
                [&_a]:!bg-transparent
                [&_a]:!px-0
                [&_a]:!py-0
                [&_a]:!font-bold
                [&_a]:!text-[#ff6b00]
                [&_a]:!shadow-none
                hover:[&_a]:!text-[#e85f00]

                [&_button]:!h-auto
                [&_button]:!rounded-none
                [&_button]:!border-0
                [&_button]:!bg-transparent
                [&_button]:!p-0
                [&_button]:!text-[#ff6b00]
                [&_button]:!shadow-none

                [&_main>div]:!mx-0
                [&_main>div]:!max-w-none
                [&_main>div]:!px-0
                [&_main>div]:!py-0

                [&_main_a]:!inline-flex
                [&_main_a]:!items-center
                [&_main_a]:!gap-1
                [&_main_a]:!text-[13px]
                sm:[&_main_a]:!text-sm

                [&_main_p+div]:!mt-5
              "
            >
              <ContentPage slug="terms" />
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM LEGAL CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-16 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[26px] bg-[linear-gradient(110deg,#0b1220_0%,#0b1220_60%,#2a1815_100%)] p-6 text-white sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
              Legal center
            </p>
            <h2 className="mt-2 text-[22px] font-black leading-tight tracking-[-0.03em] sm:text-2xl">
              Need help understanding a policy?
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-white/50 sm:text-sm">
              Review the privacy or refund policy, or contact support directly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="/privacy"
              className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-center text-xs font-black transition hover:bg-white/[0.09] sm:px-5 sm:text-sm"
            >
              Privacy
            </Link>
            <Link
              href="/refund-policy"
              className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-center text-xs font-black transition hover:bg-white/[0.09] sm:px-5 sm:text-sm"
            >
              Refund Policy
            </Link>
            <Link
              href="/contact"
              className="col-span-2 rounded-xl bg-[#ff6b00] px-4 py-3 text-center text-xs font-black transition hover:bg-[#ff7a18] sm:col-span-1 sm:px-5 sm:text-sm"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
