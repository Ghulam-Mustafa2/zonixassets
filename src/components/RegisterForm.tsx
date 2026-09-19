"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = useMemo(
    () => [
      password.length >= 8,
      /[A-Za-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ],
    [password]
  );

  const strengthCount = strength.filter(Boolean).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create your account.");
        return;
      }

      setSuccess(
        "Account created successfully. Please check your email if verification is required."
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedTerms(false);

      window.setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const nodeColors = [
    "bg-[#5daecb]",
    "bg-[#78d0df]",
    "bg-[#082b52]",
    "bg-[#3a85a5]",
    "bg-[#18b1cf]",
    "bg-[#6ccbd3]",
  ];

  const arrowColors = nodeColors;

  const labelColors = [
    "text-[#5daecb]",
    "text-[#67cbd9]",
    "text-[#082b52]",
    "text-[#3a85a5]",
    "text-[#14a9c6]",
    "text-[#62c9d1]",
  ];

  const fieldClass =
    "w-full bg-transparent text-[14px] font-semibold text-[#0c1328] outline-none placeholder:text-slate-400 sm:text-[15px]";

  const smallLabelClass =
    "text-[9px] font-black uppercase tracking-[0.17em] sm:text-[10px]";

  function Node({ index }: { index: number }) {
    return (
      <>
        <div className="absolute -left-[42px] top-1/2 hidden h-px w-[22px] -translate-y-1/2 bg-slate-300 sm:block" />

        <div
          className={`absolute -left-[19px] top-1/2 z-20 h-9 w-9 -translate-y-1/2 rounded-full border-[6px] border-white shadow-[0_7px_16px_rgba(15,23,42,0.13)] sm:-left-[20px] sm:h-10 sm:w-10 ${nodeColors[index]}`}
        />
      </>
    );
  }

  function Arrow({ index }: { index: number }) {
    return (
      <div
        className={`relative hidden h-full min-h-[68px] w-[88px] shrink-0 sm:block lg:w-[96px] ${arrowColors[index]}`}
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%)",
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <div className="relative pl-5 sm:pl-7">
        <div className="absolute left-[2px] top-8 bottom-8 w-px bg-slate-300 sm:left-[3px]" />

        <div className="space-y-2.5 sm:space-y-3">
          <div className="relative flex overflow-visible">
            <Node index={0} />

            <div className="min-w-0 flex-1 border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.045)] sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <label className={`${smallLabelClass} ${labelColors[0]}`}>
                  01 · First name
                </label>

                <span className="text-[10px] font-medium text-slate-300">
                  Identity
                </span>
              </div>

              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                autoComplete="given-name"
                className={`${fieldClass} mt-1`}
              />
            </div>

            <Arrow index={0} />
          </div>

          <div className="relative flex overflow-visible">
            <Node index={1} />

            <div className="min-w-0 flex-1 border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.045)] sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <label className={`${smallLabelClass} ${labelColors[1]}`}>
                  02 · Last name
                </label>

                <span className="text-[10px] font-medium text-slate-300">
                  Identity
                </span>
              </div>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                autoComplete="family-name"
                className={`${fieldClass} mt-1`}
              />
            </div>

            <Arrow index={1} />
          </div>

          <div className="relative flex overflow-visible">
            <Node index={2} />

            <div className="min-w-0 flex-1 border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.045)] sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <label className={`${smallLabelClass} ${labelColors[2]}`}>
                  03 · Email address
                </label>

                <span className="text-[10px] font-medium text-slate-300">
                  Orders
                </span>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={`${fieldClass} mt-1`}
              />
            </div>

            <Arrow index={2} />
          </div>

          <div className="relative flex overflow-visible">
            <Node index={3} />

            <div className="min-w-0 flex-1 border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.045)] sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <label className={`${smallLabelClass} ${labelColors[3]}`}>
                  04 · Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-[11px] font-bold text-slate-500 transition hover:text-slate-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                autoComplete="new-password"
                className={`${fieldClass} mt-1`}
              />

              <div className="mt-2 grid grid-cols-4 gap-2">
                {strength.map((active, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full ${
                      active ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-1 text-[10px] font-medium text-slate-400">
                {strengthCount}/4 password requirements met
              </p>
            </div>

            <Arrow index={3} />
          </div>

          <div className="relative flex overflow-visible">
            <Node index={4} />

            <div className="min-w-0 flex-1 border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.045)] sm:px-5">
              <label className={`${smallLabelClass} ${labelColors[4]}`}>
                05 · Confirm password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={`${fieldClass} mt-1`}
              />
            </div>

            <Arrow index={4} />
          </div>

          <div className="relative flex overflow-visible">
            <Node index={5} />

            <div className="min-w-0 flex-1 border border-orange-200 bg-[#fffaf4] px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.045)] sm:px-5">
              <p className={`${smallLabelClass} ${labelColors[5]}`}>
                06 · Finish account
              </p>

              <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-[12px] leading-5 text-slate-700 sm:text-[13px]">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
                />

                <span>
                  I agree to Zonix Assets&apos;{" "}
                  <Link
                    href="/terms"
                    className="font-bold text-slate-800 hover:text-orange-600"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-bold text-slate-800 hover:text-orange-600"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white shadow-[0_8px_18px_rgba(249,115,22,0.2)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating Account..." : "Create My Account →"}
                </button>

                <p className="text-[12px] text-slate-500 sm:text-[13px]">
                  Already registered?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-slate-700 hover:text-orange-600"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <Arrow index={5} />
          </div>
        </div>
      </div>
    </form>
  );
}
