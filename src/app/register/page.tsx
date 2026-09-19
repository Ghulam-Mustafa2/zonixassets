import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#eef5f7] text-[#0c1328]">
      <Navbar />

      <section className="px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-7 max-w-4xl text-center sm:mb-9">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
              Join Zonix Assets
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#0c1328] sm:text-4xl lg:text-5xl">
              Build your digital account.
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Create one secure account for checkout, purchases, downloads and
              order history.
            </p>
          </div>

          <div className="relative mx-auto grid max-w-[1040px] items-start gap-5 lg:grid-cols-[190px_1fr] lg:gap-8">
            <aside className="relative flex justify-center lg:sticky lg:top-24 lg:block">
              <div className="flex h-[132px] w-[210px] items-center justify-center rounded-[26px] border border-slate-200 bg-white px-5 shadow-[0_16px_38px_rgba(15,23,42,0.09)] sm:h-[142px] sm:w-[226px] lg:h-[150px] lg:w-[190px] lg:px-4">
                <Image
                  src="/images/branding/zonix-assets-logo.svg"
                  alt="Zonix Assets"
                  width={220}
                  height={62}
                  className="h-auto w-full max-w-[170px] object-contain lg:max-w-[155px]"
                  priority
                />
              </div>

              <div className="mt-3 hidden grid-cols-3 gap-1.5 lg:grid">
                {["Secure", "Digital", "Private"].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-white/70 px-1.5 py-2 text-center text-[8px] font-black uppercase tracking-[0.1em] text-slate-500"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">
                  Create your profile
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#0c1328] sm:text-3xl">
                  Complete your account.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your details directly inside the connected account nodes
                  below.
                </p>
              </div>

              <RegisterForm />
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
