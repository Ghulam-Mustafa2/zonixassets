import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#eef5f7] text-[#0c1328]">
      <Navbar />

      <section className="px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          {/* Page heading */}
          <div className="mx-auto mb-7 max-w-4xl text-center sm:mb-9">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
              Welcome Back
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#0c1328] sm:text-4xl lg:text-5xl">
              Access your digital account.
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Sign in to manage purchases, order history and secure digital
              downloads.
            </p>
          </div>

          <div className="relative mx-auto grid max-w-[1040px] items-start gap-5 lg:grid-cols-[220px_1fr] lg:gap-9">
            {/* Left Account Hub */}
            <aside className="relative flex justify-center lg:sticky lg:top-28 lg:block">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-slate-200 bg-white text-center shadow-[0_20px_45px_rgba(15,23,42,0.10)] sm:h-36 sm:w-36 lg:h-44 lg:w-44">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                    Zonix
                  </p>

                  <h2 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.04em] text-[#0c1328] lg:text-3xl">
                    Your
                    <br />
                    Account
                  </h2>

                  <p className="mt-2 text-[11px] font-semibold text-slate-400">
                    Digital access hub
                  </p>
                </div>
              </div>

              <div className="mt-4 hidden grid-cols-3 gap-2 lg:grid">
                {["Secure", "Digital", "Private"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white/70 px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-[0.12em] text-slate-500"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            {/* Login section */}
            <section className="min-w-0">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">
                  Account Login
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#0c1328] sm:text-3xl">
                  Sign in to Zonix Assets.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your account details inside the secure connected nodes
                  below.
                </p>
              </div>

              <LoginForm />
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}