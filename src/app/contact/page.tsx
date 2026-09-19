import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#0b1220]">
      <Navbar />

      <section className="relative overflow-hidden bg-[#f7f8fc]">
        {/* ORGANIC BACKGROUND — DESKTOP */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] lg:block">
          <div className="absolute -right-[10%] -top-[18%] h-[520px] w-[650px] rounded-[47%_53%_61%_39%/43%_37%_63%_57%] bg-gradient-to-br from-[#13224a] via-[#1d4f82] to-[#18aab9]" />
          <div className="absolute right-[1%] top-[21%] h-[400px] w-[430px] rounded-[60%_40%_36%_64%/47%_54%_46%_53%] bg-gradient-to-br from-[#ff6b00] via-[#ff9140] to-[#ff7a18]" />
          <div className="absolute -right-[8%] bottom-[-14%] h-[420px] w-[520px] rounded-[42%_58%_51%_49%/50%_35%_65%_50%] bg-gradient-to-br from-[#0d2046] via-[#156f88] to-[#2bc2c2]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 sm:py-14 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:px-8 lg:py-20">
          {/* LEFT FORM */}
          <div className="relative z-10 max-w-[620px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6b00] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
              Contact Zonix Assets
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Contact
            </h1>

            <p className="mt-4 max-w-[590px] text-sm leading-7 text-slate-500 sm:text-base">
              Have a question about a product, purchase or account access?
              Send us the details and we’ll guide you to the right support path.
            </p>

            <form action="/support" method="get" className="mt-8">
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    First name
                  </span>
                  <input
                    name="first_name"
                    type="text"
                    placeholder="Your first name"
                    className="mt-1.5 w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-[#ff6b00] focus:ring-0"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Last name
                  </span>
                  <input
                    name="last_name"
                    type="text"
                    placeholder="Your last name"
                    className="mt-1.5 w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-[#ff6b00] focus:ring-0"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Email address
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="mt-1.5 w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-[#ff6b00] focus:ring-0"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Order / product reference
                  </span>
                  <input
                    name="reference"
                    type="text"
                    placeholder="Optional order or product name"
                    className="mt-1.5 w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-[#ff6b00] focus:ring-0"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Questions or comments
                  </span>
                  <textarea
                    name="message"
                    rows={2}
                    placeholder="Type your message here..."
                    className="mt-1.5 w-full resize-none border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-[#ff6b00] focus:ring-0"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-7 inline-flex items-center gap-4 rounded-full bg-[#ff6b00] px-6 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,107,0,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ff7a18]"
              >
                Continue to Support
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  →
                </span>
              </button>
            </form>
          </div>

          {/* RIGHT INFO CARD */}
          <div className="relative z-10 flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[540px] overflow-hidden rounded-[32px] bg-white px-7 py-9 shadow-[0_28px_80px_rgba(15,23,42,0.16)] sm:px-9 sm:py-10 lg:max-w-[500px] lg:rounded-[40px] lg:px-11 lg:py-12">
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#13224a] via-[#16a6b8] to-[#ff7a18]" />

              <div className="mt-4 h-1 w-11 rounded-full bg-[#ff6b00]" />

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6b00]">
                  Zonix Assets
                </p>

                <h2 className="mt-2 text-[28px] font-black leading-[1.05] tracking-[-0.04em] sm:text-3xl">
                  We’ll help you find the right route.
                </h2>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Use the form for general questions, or choose the support
                  area that best matches your issue.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <Link href="/account/orders" className="group flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-[#ff6b00]">
                    01
                  </span>
                  <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                    <p className="text-sm font-black">Orders & access</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Questions about a purchase or file access.
                    </p>
                  </div>
                  <span className="pt-1.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#ff6b00]">
                    →
                  </span>
                </Link>

                <Link href="/products" className="group flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-black text-[#0c8a99]">
                    02
                  </span>
                  <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                    <p className="text-sm font-black">Product questions</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Check a product before you purchase it.
                    </p>
                  </div>
                  <span className="pt-1.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0c8a99]">
                    →
                  </span>
                </Link>

                <Link href="/refund-policy" className="group flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black">
                    03
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black">Refund & policy</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Read the refund and purchase policies.
                    </p>
                  </div>
                  <span className="pt-1.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0b1220]">
                    →
                  </span>
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href="/support"
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black transition hover:border-[#ff6b00] hover:text-[#ff6b00]"
                >
                  Support Center
                </Link>
                <Link
                  href="/products"
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black transition hover:border-[#0c8a99] hover:text-[#0c8a99]"
                >
                  Browse Store
                </Link>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span className="mr-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Follow us
                </span>

                <button
                  type="button"
                  aria-label="Facebook"
                  title="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-[#1877F2] hover:text-[#1877F2]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M13.5 8H16V4.5c-.43-.06-1.9-.2-3.64-.2C8.92 4.3 6.56 6.34 6.56 10v2.7H3.5v3.9h3.06V24h4.06v-7.4h3.37l.54-3.9h-3.91v-2.31C10.62 9.26 10.93 8 13.5 8Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label="YouTube"
                  title="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-[#FF0000] hover:text-[#FF0000]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.58 12 3.58 12 3.58s-7.55 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.5 9.4.5 9.4.5s7.55 0 9.4-.5a3 3 0 0 0 2.1-2.12A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.25 3.6L9.6 15.6Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label="Instagram"
                  title="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-[#E4405F] hover:text-[#E4405F]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.05 1.5a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}