"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const nodeClasses =
    "relative bg-white shadow-[0_10px_28px_rgba(15,23,42,0.07)]";

  return (
    <form onSubmit={handleSubmit} className="relative mt-6">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Connected vertical line */}
      <div className="absolute bottom-20 left-[19px] top-10 w-px bg-slate-300 sm:left-[23px]" />

      <div className="space-y-4">
        {/* Email Node */}
        <div className="relative pl-10 sm:pl-12">
          <div className="absolute left-0 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-[7px] border-[#eef5f7] bg-[#0c3762] shadow-md sm:h-12 sm:w-12" />

          <div className="absolute left-8 top-1/2 h-px w-5 -translate-y-1/2 bg-slate-300 sm:left-10 sm:w-6" />

          <div
            className={`${nodeClasses} min-h-[88px] pr-[86px] sm:min-h-[96px] sm:pr-[120px]`}
          >
            <div className="px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="login-email"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0c3762] sm:text-xs"
                >
                  01 · Email Address
                </label>

                <span className="text-[10px] font-semibold text-slate-300 sm:text-xs">
                  Account
                </span>
              </div>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 w-full bg-transparent text-base text-[#0c1328] outline-none placeholder:text-slate-400 sm:text-lg"
              />
            </div>

            <div
              className="absolute right-0 top-0 h-full w-[72px] bg-[#0c3762] sm:w-[105px]"
              style={{
                clipPath: "polygon(0 0, 72% 0, 100% 50%, 72% 100%, 0 100%)",
              }}
            />
          </div>
        </div>

        {/* Password Node */}
        <div className="relative pl-10 sm:pl-12">
          <div className="absolute left-0 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-[7px] border-[#eef5f7] bg-[#3d8cac] shadow-md sm:h-12 sm:w-12" />

          <div className="absolute left-8 top-1/2 h-px w-5 -translate-y-1/2 bg-slate-300 sm:left-10 sm:w-6" />

          <div
            className={`${nodeClasses} min-h-[102px] pr-[86px] sm:min-h-[110px] sm:pr-[120px]`}
          >
            <div className="px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="login-password"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3d8cac] sm:text-xs"
                >
                  02 · Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="relative z-20 text-xs font-semibold text-slate-500 transition hover:text-[#0c1328] sm:text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="mt-2 w-full bg-transparent text-base text-[#0c1328] outline-none placeholder:text-slate-400 sm:text-lg"
              />

              <div className="mt-3 flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 sm:text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  Remember me
                </label>

                <Link
                  href="/forgot-password"
                  className="relative z-20 text-xs font-bold text-orange-600 transition hover:text-orange-500 sm:text-sm"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div
              className="absolute right-0 top-0 h-full w-[72px] bg-[#3d8cac] sm:w-[105px]"
              style={{
                clipPath: "polygon(0 0, 72% 0, 100% 50%, 72% 100%, 0 100%)",
              }}
            />
          </div>
        </div>

        {/* Login Node */}
        <div className="relative pl-10 sm:pl-12">
          <div className="absolute left-0 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-[7px] border-[#eef5f7] bg-[#1fb1cf] shadow-md sm:h-12 sm:w-12" />

          <div className="absolute left-8 top-1/2 h-px w-5 -translate-y-1/2 bg-slate-300 sm:left-10 sm:w-6" />

          <div className="relative min-h-[135px] border border-orange-200 bg-[#fffaf4] pr-[86px] sm:pr-[120px]">
            <div className="px-5 py-5 sm:px-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 sm:text-xs">
                03 · Continue
              </p>

              <button
                type="submit"
                disabled={loading}
                className="relative z-20 mt-4 w-full max-w-[320px] rounded-full bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(249,115,22,0.25)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                {loading ? "Signing In..." : "Sign In →"}
              </button>

              <p className="mt-4 text-sm text-slate-500">
                New to Zonix Assets?{" "}
                <Link
                  href="/register"
                  className="font-bold text-[#0c3762] transition hover:text-orange-600"
                >
                  Create account
                </Link>
              </p>
            </div>

            <div
              className="absolute right-0 top-0 h-full w-[72px] bg-[#6ac9d3] sm:w-[105px]"
              style={{
                clipPath: "polygon(0 0, 72% 0, 100% 50%, 72% 100%, 0 100%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Trust row */}
      <div className="mt-5 grid grid-cols-3 gap-2 pl-10 sm:pl-12">
        {[
          ["Secure", "Protected access"],
          ["Digital", "Purchase library"],
          ["Private", "Account data"],
        ].map(([title, text]) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white/70 px-2 py-3 text-center"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-500 sm:text-[10px]">
              {title}
            </p>

            <p className="mt-1 hidden text-[10px] text-slate-400 sm:block">
              {text}
            </p>
          </div>
        ))}
      </div>
    </form>
  );
}