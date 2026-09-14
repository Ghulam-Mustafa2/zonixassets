"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  const [site, setSite] = useState<SiteSettings>({
    site_name: "PakStore",
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

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as SiteContentResponse;

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

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const siteName =
    site.site_name?.trim() || "PakStore";

  const brand = useMemo(() => {
    const words = siteName.split(/\s+/).filter(Boolean);

    if (words.length <= 1) {
      const text = words[0] || "PakStore";

      if (text.length <= 3) {
        return {
          primary: text,
          accent: "",
        };
      }

      const splitAt = Math.max(
        1,
        Math.floor(text.length * 0.55)
      );

      return {
        primary: text.slice(0, splitAt),
        accent: text.slice(splitAt),
      };
    }

    return {
      primary: `${words.slice(0, -1).join(" ")} `,
      accent: words[words.length - 1],
    };
  }, [siteName]);

  const primaryButtonText =
    site.homepage_primary_button_text?.trim() ||
    "Browse Store";

  const primaryButtonUrl =
    site.homepage_primary_button_url?.trim() ||
    "/products";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white"
        >
          {site.logo_url ? (
            <img
              src={site.logo_url}
              alt={siteName}
              className="h-9 max-w-[180px] object-contain"
            />
          ) : (
            <span>
              {brand.primary}
              <span className="text-emerald-400">
                {brand.accent}
              </span>
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>

          <Link href="/products" className="transition hover:text-white">
            Products
          </Link>

          <Link href="/categories" className="transition hover:text-white">
            Categories
          </Link>

          <Link href="/about" className="transition hover:text-white">
            About
          </Link>

          <Link href="/contact" className="transition hover:text-white">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Cart

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-black">
                {cartCount}
              </span>
            )}
          </Link>

          {!authLoading &&
            (user ? (
              <>
                <Link
                  href="/account"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  {user.firstName || "Account"}
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                >
                  {loggingOut ? "Signing Out..." : "Sign Out"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Sign In
              </Link>
            ))}

          <Link
            href={primaryButtonUrl}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            {primaryButtonText}
          </Link>
        </div>
      </div>
    </header>
  );
}
