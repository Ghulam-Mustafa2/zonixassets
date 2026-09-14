"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

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

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/60">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Ali"
              autoComplete="given-name"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.02]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Khan"
              autoComplete="family-name"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.02]"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/60">
            Email Address
          </label>

          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 pr-14 text-sm outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.02]"
            />
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/20">
              @
            </div>
          </div>

          <p className="mt-2 text-xs text-white/30">
            Order receipts aur download access isi email par milega.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/60">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.02]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.02]"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-white/50">
              Password Strength
            </p>
            <span className="text-xs text-emerald-400">
              8+ characters recommended
            </span>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <div
              className={`h-1.5 rounded-full ${
                password.length >= 4 ? "bg-emerald-400" : "bg-white/10"
              }`}
            />
            <div
              className={`h-1.5 rounded-full ${
                password.length >= 8 ? "bg-emerald-400" : "bg-white/10"
              }`}
            />
            <div
              className={`h-1.5 rounded-full ${
                hasNumber ? "bg-emerald-400" : "bg-white/10"
              }`}
            />
            <div
              className={`h-1.5 rounded-full ${
                hasSymbol ? "bg-emerald-400" : "bg-white/10"
              }`}
            />
          </div>

          <p className="mt-3 text-xs leading-5 text-white/30">
            Use at least 8 characters with letters, numbers and a symbol.
          </p>
        </div>

        <label className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-white/50">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 accent-emerald-400"
          />

          <span>
            I agree to PakStore&apos;s{" "}
            <Link
              href="/terms"
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-400 px-6 py-4 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create My Account"}
        </button>
      </form>
    </>
  );
}
