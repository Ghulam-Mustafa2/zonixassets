import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/checkout/",
        "/orders/",
        "/api/",
      ],
    },
    sitemap: "https://zonixassets.shop/sitemap.xml",
  };
}