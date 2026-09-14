import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  const benefits = [
    {
      title: "Instant Digital Access",
      text: "Purchase ke baad apne products ko dashboard se instantly access karo.",
    },
    {
      title: "Secure Purchase History",
      text: "Orders, invoices aur previous purchases ek hi jagah manage karo.",
    },
    {
      title: "Lifetime Digital Library",
      text: "Eligible purchases ko future mein bhi apne account se access karo.",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        {/* Background Glow */}
        <div className="pointer-events-none absolute left-1/2 top-20 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/50 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Left Premium Panel */}
            <aside className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.05] to-transparent p-8 lg:border-b-0 lg:border-r lg:p-10">
              <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-[90px]" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-[100px]" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-300">
                    Join the PakStore Community
                  </div>

                  <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight md:text-5xl">
                    Create once.
                    <span className="block bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                      Access everything.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-md text-sm leading-7 text-white/50 md:text-base">
                    Apna PakStore account create karo aur premium digital
                    products, downloads, invoices aur purchases ko ek clean
                    dashboard se manage karo.
                  </p>
                </div>

                <div className="mt-10 space-y-4">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-sm text-emerald-400">
                          ✓
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold">
                            {benefit.title}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-white/40">
                            {benefit.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                    PakStore Account
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    One account for purchases, downloads, support and future
                    premium features.
                  </p>
                </div>
              </div>
            </aside>

            {/* Right Registration Form */}
            <div className="p-8 md:p-10 lg:p-12">
              <div className="mx-auto max-w-xl">
                <p className="text-sm font-medium text-emerald-400">
                  Create Your Account
                </p>

                <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                  Start Your PakStore Journey
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Fill in your details below. Your account will be used for
                  purchases, downloads and order management.
                </p>

                <div className="mt-8">
                  <RegisterForm />
                </div>

                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-white/30">
                    OR CONTINUE WITH
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Social */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium transition hover:bg-white/10">
                    Continue with Google
                  </button>

                  <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium transition hover:bg-white/10">
                    Continue with GitHub
                  </button>
                </div>

                {/* Login */}
                <div className="mt-7 rounded-2xl border border-white/10 bg-black/50 p-4 text-center">
                  <p className="text-sm text-white/40">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-emerald-400 transition hover:text-emerald-300"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>

                {/* Trust badges */}
                <div className="mt-7 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                    <p className="text-xs font-medium text-emerald-400">
                      Secure
                    </p>

                    <p className="mt-1 text-[11px] text-white/30">
                      Account
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                    <p className="text-xs font-medium text-emerald-400">
                      Instant
                    </p>

                    <p className="mt-1 text-[11px] text-white/30">
                      Access
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                    <p className="text-xs font-medium text-emerald-400">
                      Private
                    </p>

                    <p className="mt-1 text-[11px] text-white/30">
                      Profile
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}