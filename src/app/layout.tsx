import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import StoreChatWidget from "@/components/StoreChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ZonixAssets",
    template: "%s | ZonixAssets",
  },
  description:
    "Premium digital assets, templates, tools, and creative resources from ZonixAssets.",
  applicationName: "ZonixAssets",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
  ),
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "ZonixAssets",
    description:
      "Premium digital assets, templates, tools, and creative resources from ZonixAssets.",
    type: "website",
    siteName: "ZonixAssets",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZonixAssets",
    description:
      "Premium digital assets, templates, tools, and creative resources from ZonixAssets.",
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://zonixassets.shop";

const storeStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${siteUrl}#store`,
  name: "ZonixAssets",
  url: siteUrl,
  hasMerchantReturnPolicy: {
    "@type": "MerchantReturnPolicy",
    "@id": `${siteUrl}/refund-policy#policy`,
    merchantReturnLink: `${siteUrl}/refund-policy`,
  },
}).replace(/</g, "\\u003c");

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json">{storeStructuredData}</script>
        <CartProvider>{children}</CartProvider>
        <StoreChatWidget />
      </body>
    </html>
  );
}
