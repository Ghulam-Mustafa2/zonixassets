"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SiteSettings = {
  site_name?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  footer_text?: string | null;
};

type SocialLink = {
  id: string;
  platform?: string | null;
  label?: string | null;
  url?: string | null;
  icon_key?: string | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
};

type SiteContentResponse = {
  site?: SiteSettings | null;
  socialLinks?: SocialLink[];
};

const fallbackSite: SiteSettings = {
  site_name: "PakStore",
  logo_url: null,
  tagline:
    "Premium digital products, tools and resources for creators, developers and modern businesses.",
  footer_text:
    "© PakStore. All rights reserved.",
};

export default function Footer() {
  const [site, setSite] =
    useState<SiteSettings>(fallbackSite);

  const [socialLinks, setSocialLinks] =
    useState<SocialLink[]>([]);

  useEffect(() => {
    async function loadFooterContent() {
      try {
        const response = await fetch(
          "/api/site-content",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as SiteContentResponse;

        setSite({
          ...fallbackSite,
          ...(data.site || {}),
        });

        setSocialLinks(
          Array.isArray(data.socialLinks)
            ? data.socialLinks
                .filter(
                  (item) =>
                    item.is_visible !== false &&
                    Boolean(item.url)
                )
                .sort(
                  (a, b) =>
                    Number(a.sort_order || 0) -
                    Number(b.sort_order || 0)
                )
            : []
        );
      } catch {
        // Keep fallback footer content.
      }
    }

    loadFooterContent();
  }, []);

  const siteName =
    site.site_name?.trim() || "PakStore";

  const brand = useMemo(() => {
    const words = siteName
      .split(/\s+/)
      .filter(Boolean);

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

  const description =
    site.tagline?.trim() ||
    fallbackSite.tagline ||
    "";

  const footerText =
    site.footer_text?.trim() ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-2xl font-bold"
          >
            {site.logo_url ? (
              <img
                src={site.logo_url}
                alt={siteName}
                className="h-10 max-w-[190px] object-contain"
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

          <p className="mt-4 max-w-xs text-sm leading-6 text-white/40">
            {description}
          </p>

          {socialLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const label =
                  social.label?.trim() ||
                  social.platform?.trim() ||
                  "Social";

                return (
                  <a
                    key={social.id}
                    href={social.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/70 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
                  >
                    <SocialIcon
                      iconKey={social.icon_key}
                      platform={social.platform}
                      label={label}
                    />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold">
            Marketplace
          </h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-white/40">
            <Link
              href="/products"
              className="hover:text-white"
            >
              All Products
            </Link>

            <Link
              href="/categories"
              className="hover:text-white"
            >
              Categories
            </Link>

            <Link
              href="/products"
              className="hover:text-white"
            >
              Featured Products
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">
            Company
          </h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-white/40">
            <Link
              href="/about"
              className="hover:text-white"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="hover:text-white"
            >
              Contact
            </Link>

            <Link
              href="/support"
              className="hover:text-white"
            >
              Support
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">
            Account
          </h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-white/40">
            <Link
              href="/login"
              className="hover:text-white"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="hover:text-white"
            >
              Create Account
            </Link>

            <Link
              href="/account"
              className="hover:text-white"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-6 text-sm text-white/40 md:flex-row">
          <p>{footerText}</p>

          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-white"
            >
              Terms
            </Link>

<Link
  href="/refund-policy"
  className="hover:text-white"
>
  Refund Policy
</Link>
            <Link
              href="/support"
              className="hover:text-white"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  iconKey,
  platform,
  label,
}: {
  iconKey?: string | null;
  platform?: string | null;
  label: string;
}) {
  const key = (
    iconKey ||
    platform ||
    label
  )
    .trim()
    .toLowerCase();

  if (key.includes("facebook")) {
    return <span className="text-base">f</span>;
  }

  if (
    key.includes("instagram")
  ) {
    return <span className="text-base">◎</span>;
  }

  if (
    key === "x" ||
    key.includes("twitter")
  ) {
    return <span className="text-base">𝕏</span>;
  }

  if (
    key.includes("youtube")
  ) {
    return <span className="text-base">▶</span>;
  }

  if (
    key.includes("linkedin")
  ) {
    return <span className="text-sm">in</span>;
  }

  if (
    key.includes("github")
  ) {
    return <span className="text-base">⌘</span>;
  }

  if (
    key.includes("tiktok")
  ) {
    return <span className="text-base">♪</span>;
  }

  return (
    <span className="text-sm">
      {label
        .slice(0, 1)
        .toUpperCase()}
    </span>
  );
}
