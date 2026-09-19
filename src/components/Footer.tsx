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

type SiteContentResponse = {
  site?: SiteSettings | null;
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
