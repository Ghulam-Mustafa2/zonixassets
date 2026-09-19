"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

type AuthUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

type SiteSettings = {
  site_name?: string | null;
  logo_url?: string | null;
  homepage_primary_button_text?: string | null;
  homepage_primary_button_url?: string | null;
};

type SiteContentResponse = {
  site?: SiteSettings | null;
};

export default function Navbar() {
  const { cartCount } = useCart();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [site, setSite] = useState<SiteSettings>({
    site_name: "Zonix Assets",
    logo_url: null,
    homepage_primary_button_text: "Browse Store",
    homepage_primary_button_url: "/products",
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function loadSiteSettings() {
      try {
        const response = await fetch("/api/site-content", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as SiteContentResponse;

        setSite((current) => ({
          ...current,
          ...(data.site || {}),
        }));
      } catch {
        // Keep fallback values.
      }
    }

    loadSiteSettings();
  }, []);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      setMobileOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const siteName = site.site_name?.trim() || "Zonix Assets";


  const primaryButtonText =
    site.homepage_primary_button_text?.trim() || "Browse Store";

  const primaryButtonUrl =
    site.homepage_primary_button_url?.trim() || "/products";

  const navLinks = [
    ["Home", "/"],
    ["Products", "/products"],
    ["Categories", "/categories"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1025]/96 text-white shadow-[0_8px_30px_rgba(11,16,37,0.16)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 items-center shrink-0"
          aria-label="Zonix Assets home"
        >
          <Image
            src="/images/branding/zonix-assets-logo-dark.svg"
            alt={siteName}
            width={640}
            height={180}
            className="h-auto w-[132px] object-contain sm:w-[165px] lg:w-[185px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
          {navLinks.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="relative py-2 transition hover:text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#ff6b00] after:transition-all hover:after:w-full"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            aria-label="Open cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white transition hover:border-[#ff6b00]/50 hover:bg-[#ff6b00]/10 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
          >
            <span className="sm:hidden" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h2l1.6 9.1a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 1.9-1.4L20 7H6" />
                <circle cx="9" cy="19" r="1.3" />
                <circle cx="17" cy="19" r="1.3" />
              </svg>
            </span>
            <span className="hidden text-sm sm:inline">Cart</span>

            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff6b00] px-1 text-[10px] font-black text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {!authLoading &&
              (user ? (
                <>
                  <Link
                    href="/account"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-[#ff6b00]/50 hover:bg-[#ff6b00]/10"
                  >
                    {user.firstName || "Account"}
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="rounded-full border border-red-400/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                  >
                    {loggingOut ? "Signing Out..." : "Sign Out"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-[#ff6b00]/50 hover:bg-[#ff6b00]/10"
                >
                  Sign In
                </Link>
              ))}

            <Link
              href={primaryButtonUrl}
              className="rounded-full bg-[#ff6b00] px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,107,0,0.22)] transition hover:bg-[#ea5f00]"
            >
              {primaryButtonText}
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white transition hover:border-[#ff6b00]/50 hover:bg-[#ff6b00]/10 md:hidden"
          >
            {mobileOpen ? (
              <span className="text-2xl leading-none">×</span>
            ) : (
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded bg-current" />
                <span className="h-0.5 w-5 rounded bg-current" />
                <span className="h-0.5 w-5 rounded bg-current" />
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0b1025] md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <nav className="grid gap-1">
              {navLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
              {!authLoading &&
                (user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/5"
                    >
                      {user.firstName || "My Account"}
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="rounded-xl border border-red-400/20 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                    >
                      {loggingOut ? "Signing Out..." : "Sign Out"}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/5"
                  >
                    Sign In
                  </Link>
                ))}

              <Link
                href={primaryButtonUrl}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-[#ff6b00] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#ea5f00]"
              >
                {primaryButtonText}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
