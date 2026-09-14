import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto flex min-h-[720px] max-w-7xl items-center justify-center px-6 py-20">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] lg:grid-cols-2">
          {/* Left */}
          <div className="relative hidden overflow-hidden border-r border-white/10 bg-emerald-400/5 p-10 lg:block">
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-[120px]" />

            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Welcome Back
                </p>

                <h1 className="mt-4 text-4xl font-bold leading-tight">
                  Your digital library is waiting.
                </h1>

                <p className="mt-5 max-w-sm leading-7 text-white/50">
                  Sign in to access your purchases, downloads, invoices
                  and account settings.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  "Instant access to purchases",
                  "Secure digital downloads",
                  "Order history and invoices",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                      ✓
                    </div>

                    <span className="text-sm text-white/70">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="p-8 md:p-12">
            <p className="text-sm font-medium text-emerald-400">
              Account Login
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Sign in to PakStore
            </h2>

            <p className="mt-3 text-sm text-white/40">
              Enter your account details below.
            </p>

            <LoginForm />

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/30">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-medium transition hover:bg-white/10">
              Continue with Google
            </button>

            <p className="mt-7 text-center text-sm text-white/40">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-emerald-400 hover:text-emerald-300"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}