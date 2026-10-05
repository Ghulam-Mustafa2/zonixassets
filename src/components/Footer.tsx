"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type SiteSettings = {
  site_name?: string | null;
  tagline?: string | null;
  footer_text?: string | null;
  logo_url?: string | null;
};

type SocialLink = {
  id: string;
  platform: string;
  label?: string | null;
  url: string;
  icon_key?: string | null;
  is_visible?: boolean;
  sort_order?: number;
};

type SiteContentResponse = {
  site?: SiteSettings | null;
  socialLinks?: SocialLink[];
};

const quickLinks: [string, string][] = [
  ["Home", "/"],
  ["All Products", "/products"],
  ["Categories", "/categories"],
  ["Featured", "/products"],
];

const serviceLinks: [string, string][] = [
  ["Contact Us", "/contact"],
  ["Support", "/support"],
  ["Refund Policy", "/refund-policy"],
  ["Terms", "/terms"],
];

const accountLinks: [string, string][] = [
  ["Sign In", "/login"],
  ["Create Account", "/register"],
  ["Dashboard", "/account"],
  ["My Orders", "/account"],
];

export default function Footer() {
  const [site, setSite] = useState<SiteSettings>({
    site_name: "Zonix Assets",
    tagline: "Premium Digital Marketplace",
    footer_text:
      "Professional digital products, templates, UI kits, graphics and tools for creators.",
    logo_url: null,
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    async function loadSite() {
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

        setSocialLinks(
          (data.socialLinks || [])
            .filter((item) => item.is_visible !== false && Boolean(item.url))
            .sort(
              (a, b) =>
                (a.sort_order ?? 0) - (b.sort_order ?? 0)
            )
        );
      } catch {
        // Keep fallback values.
      }
    }

    loadSite();
  }, []);

  const siteName = site.site_name?.trim() || "Zonix Assets";

  return (
    <footer className="border-t border-white/10 bg-[#0b1025] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_.8fr_.9fr_.8fr_1fr] lg:gap-7">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="Zonix Assets home"
            >
              {site.logo_url ? (
                <img
                  src={site.logo_url}
                  alt={siteName}
                  className="h-auto w-[180px] object-contain sm:w-[190px]"
                />
              ) : (
                <Image
                  src="/images/branding/zonix-assets-logo.svg"
                  alt={siteName}
                  width={220}
                  height={62}
                  className="h-auto w-[180px] object-contain sm:w-[190px]"
                />
              )}
            </Link>

            <p className="mt-4 max-w-sm text-[11px] leading-5 text-white/50 sm:text-sm sm:leading-6">
              {site.footer_text?.trim() ||
                "Professional digital products, templates, UI kits, graphics and tools for creators."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[9px] font-bold text-white/70 sm:text-[10px]">
                Instant Access
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[9px] font-bold text-white/70 sm:text-[10px]">
                Secure Checkout
              </span>
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/35 sm:text-[10px]">
                  Follow us
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map((item) => {
                    const name =
                      item.label?.trim() ||
                      item.platform?.trim() ||
                      "Social link";

                    return (
                      <a
                        key={item.id || `${item.platform}-${item.url}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={name}
                        title={name}
                        className="group grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:-translate-y-0.5 hover:border-[#ff6b00]/50 hover:bg-[#ff6b00] hover:text-white"
                      >
                        <SocialIcon
                          value={item.icon_key || item.platform}
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <FooterColumn title="Quick Links" links={quickLinks} />
          <FooterColumn title="Customer Service" links={serviceLinks} />
          <FooterColumn title="My Account" links={accountLinks} />

          <div className="hidden sm:block">
            <h3 className="text-sm font-black text-white">Contact Us</h3>

            <div className="mt-4 space-y-3 text-sm text-white/50">
              <p>
                <span className="block text-[10px] uppercase tracking-wider text-white/30">
                  Website
                </span>
                <span className="mt-1 block break-all font-semibold text-white/75">
                  zonixassets.shop
                </span>
              </p>

              <p>
                <span className="block text-[10px] uppercase tracking-wider text-white/30">
                  Support
                </span>
                <Link
                  href="/contact"
                  className="mt-1 block font-semibold text-white/75 transition hover:text-[#ff6b00]"
                >
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 space-y-2.5 sm:hidden">
          <MobileFooterGroup title="Quick Links" links={quickLinks} />
          <MobileFooterGroup title="Customer Service" links={serviceLinks} />
          <MobileFooterGroup title="My Account" links={accountLinks} />

          <details className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <summary className="flex min-h-[50px] cursor-pointer list-none items-center justify-between px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-white">
              Contact Us
              <span className="text-base leading-none text-white/35 transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 px-4 py-4 text-[11px] text-white/50">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-white/30">
                  Website
                </span>
                <span className="mt-1.5 block font-semibold text-white/75">
                  zonixassets.shop
                </span>
              </div>

              <div>
                <span className="block text-[9px] uppercase tracking-wider text-white/30">
                  Support
                </span>
                <Link
                  href="/contact"
                  className="mt-1.5 block font-semibold text-white/75 transition hover:text-[#ff6b00]"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </details>
        </div>

        <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mr-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/35 sm:text-xs">
              Secure payments
            </span>

            {[
              "/payments/visa-mastercard.png",
              "/payments/lemon-squeezy.jpeg",
            ].map((src) => (
              <div
                key={src}
                className="flex h-9 w-16 items-center justify-center rounded-lg border border-white/10 bg-white p-1.5 shadow-sm"
              >
                <img
                  src={src}
                  alt="Payment provider"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2.5 text-[10px] text-white/48 sm:text-xs">
            <Link href="/privacy" className="transition hover:text-[#ff6b00]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-[#ff6b00]">
              Terms
            </Link>
            <Link
              href="/refund-policy"
              className="transition hover:text-[#ff6b00]"
            >
              Refund Policy
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1.5 border-t border-white/10 pt-5 text-[9px] leading-4 text-white/30 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p>Digital products • Secure checkout • Instant access</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div className="hidden sm:block">
      <h3 className="text-sm font-black text-white">{title}</h3>

      <div className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="block text-sm leading-5 text-white/50 transition hover:text-[#ff6b00]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileFooterGroup({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <details className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      <summary className="flex min-h-[50px] cursor-pointer list-none items-center justify-between px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-white">
        {title}
        <span className="text-base leading-none text-white/35 transition-transform duration-200 group-open:rotate-45">
          +
        </span>
      </summary>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 px-4 py-4">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="text-[11px] leading-5 text-white/55 transition hover:text-[#ff6b00]"
          >
            {label}
          </Link>
        ))}
      </div>
    </details>
  );
}


function SocialIcon({ value }: { value: string }) {
  const key = value.trim().toLowerCase();

  if (key.includes("facebook")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M13.7 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8h1.9V2.4c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.4H7v3.5h2.9v9h3.8Z" />
      </svg>
    );
  }

  if (key.includes("youtube")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
      </svg>
    );
  }

  if (key.includes("instagram")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
      </svg>
    );
  }

  if (key.includes("linkedin")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M5.3 7.6A2.3 2.3 0 1 1 5.3 3a2.3 2.3 0 0 1 0 4.6ZM3.3 9.2h4V21h-4V9.2Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2.1 3.7-2.1 4 0 4.7 2.6 4.7 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21h-4V9.2Z" />
      </svg>
    );
  }

  if (key === "x" || key.includes("twitter")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-6.3L6.6 22H3.5l7.2-8.2L3 2h6.3l4.3 5.7L18.9 2Zm-1.1 17.8h1.7L8.4 4.1H6.6l11.2 15.7Z" />
      </svg>
    );
  }

  if (key.includes("tiktok")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M14.5 2h3.2c.2 1.5 1.1 2.9 2.4 3.7.9.6 1.8.8 2.9.8v3.2c-1.8 0-3.6-.6-5.1-1.6v7.1a6.2 6.2 0 1 1-5.3-6.1v3.3a3 3 0 1 0 2 2.8V2Z" />
      </svg>
    );
  }

  if (key.includes("pinterest")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-1.6 0-3.4.4-5.1l1.3-5.5s-.3-.7-.3-1.8c0-1.7 1-3 2.3-3 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1 4.2-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5.1-5-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2.9 2.8.1.1.1.2.1.4l-.3 1.2c-.1.4-.4.5-.8.3-1.9-.9-3.1-3.7-3.1-5.9 0-4.8 3.5-9.2 10.1-9.2 5.3 0 9.4 3.8 9.4 8.8 0 5.3-3.3 9.5-7.9 9.5-1.5 0-3-.8-3.5-1.7l-1 3.7c-.3 1.3-1.3 3-1.9 4A10 10 0 1 0 12 2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
      <path d="M10.6 13.4a4 4 0 0 0 5.7 0l2.1-2.1a4 4 0 0 0-5.7-5.7l-1.2 1.2" />
      <path d="M13.4 10.6a4 4 0 0 0-5.7 0l-2.1 2.1a4 4 0 0 0 5.7 5.7l1.2-1.2" />
    </svg>
  );
}
