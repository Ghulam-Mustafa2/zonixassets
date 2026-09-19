import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentPage from "@/components/ContentPage";

const refundHighlights = [
  {
    number: "01",
    title: "Before purchase",
    text: "Review the product details, compatibility and included files carefully before placing an order.",
  },
  {
    number: "02",
    title: "Digital delivery",
    text: "Digital products can become available shortly after a successful purchase and account verification.",
  },
  {
    number: "03",
    title: "Refund requests",
    text: "Refund eligibility depends on the circumstances described in the official refund policy below.",
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fa] text-[#0b1220]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1220] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-11 sm:px-6 sm:py-13 lg:px-8 lg:py-15">
          <div className="grid gap-7 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                Purchases & Refunds
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-[56px]">
                Refund Policy
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-base sm:leading-8">
                Clear guidance for digital purchases, refund requests and the
                conditions that apply to products sold through Zonix Assets.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/terms"
                  className="rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.09]"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="rounded-xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.09]"
                >
                  Privacy
                </Link>
                <Link
                  href="/contact"
                  className="rounded-xl bg-[#ff6b00] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff7a18]"
                >
                  Contact Support
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                  Product type
                </p>
                <p className="mt-3 text-lg font-black sm:text-xl">
                  Digital goods
                </p>
                <p className="mt-2 text-xs leading-5 text-white/40">
                  Templates, graphics, UI resources and tools.
                </p>
              </div>

              <div className="rounded-[22px] bg-white p-5 text-[#0b1220]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff6b00]">
                  Need help?
                </p>
                <p className="mt-3 text-lg font-black sm:text-xl">
                  Order question
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex text-xs font-black text-[#ff6b00]"
                >
                  Contact support →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-9 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {refundHighlights.map((item) => (
            <article
              key={item.number}
              className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.04)] sm:p-6"
            >
              <p className="text-[9px] font-black text-[#ff6b00]">{item.number}</p>
              <h2 className="mt-3 text-xl font-black tracking-[-0.02em]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* POLICY DOCUMENT */}
      <section className="mx-auto max-w-7xl px-5 pb-11 sm:px-6 sm:pb-13 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.04)] lg:sticky lg:top-28">
            <p className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#ff6b00]">
              Legal Center
            </p>

            <nav className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold text-slate-600 lg:block lg:space-y-2">
              <a
                href="#refund-policy"
                className="rounded-xl bg-[#0b1220] px-4 py-3 text-center text-white lg:block lg:text-left"
              >
                Refund Policy
              </a>
              <Link
                href="/terms"
                className="rounded-xl border border-slate-200 px-4 py-3 text-center transition hover:border-orange-200 hover:text-[#ff6b00] lg:block lg:text-left"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="rounded-xl border border-slate-200 px-4 py-3 text-center transition hover:border-orange-200 hover:text-[#ff6b00] lg:block lg:text-left"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-slate-200 px-4 py-3 text-center transition hover:border-orange-200 hover:text-[#ff6b00] lg:block lg:text-left"
              >
                Contact
              </Link>
            </nav>
          </aside>

          <div
            id="refund-policy"
            className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
          >
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                  Official document
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                  Zonix Assets Refund Policy
                </h2>
              </div>

              <span className="text-[11px] font-bold text-slate-400 sm:text-xs">
                Digital purchase terms
              </span>
            </div>

            <div
              className="
                px-5 py-5 sm:px-8 sm:py-7 lg:px-9 lg:py-7

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
                [&_h1]:!text-3xl
                [&_h1]:!font-black
                [&_h1]:!tracking-[-0.04em]

                [&_h2]:!mt-7
                [&_h2]:!text-xl
                [&_h2]:!font-black
                sm:[&_h2]:!text-2xl

                [&_h3]:!mt-5
                [&_h3]:!text-lg
                [&_h3]:!font-black

                [&_p]:!mt-3
                [&_p]:!text-[14px]
                [&_p]:!leading-6
                [&_p]:!text-slate-600
                sm:[&_p]:!text-[15px]
                sm:[&_p]:!leading-7

                [&_ul]:!my-4
                [&_ul]:!space-y-2.5
                [&_ol]:!my-4
                [&_ol]:!space-y-2.5

                [&_li]:!text-[14px]
                [&_li]:!leading-6
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
                [&_main_a]:!text-sm

                [&_main_p+div]:!mt-4
              "
            >
              <ContentPage slug="refund-policy" />
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:grid-cols-[1.18fr_.82fr]">
          <div className="bg-[#0b1220] p-6 text-white sm:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
              Before requesting a refund
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
              Have your order details ready.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
              Include the product name, order reference and a clear description
              of the issue when contacting support.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 bg-[#fbfcfe] p-6 sm:flex-row sm:items-center sm:justify-end sm:p-8">
            <Link
              href="/account/orders"
              className="min-w-[145px] rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black transition hover:border-orange-200 hover:text-[#ff6b00]"
            >
              View Orders
            </Link>
            <Link
              href="/contact"
              className="min-w-[170px] rounded-xl bg-[#ff6b00] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#ff7a18]"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
