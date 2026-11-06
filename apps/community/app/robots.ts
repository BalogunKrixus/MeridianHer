import type { MetadataRoute } from "next"

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/settings", "/saved", "/notifications", "/welcome", "/ask", "/auth", "/m/", "/search", "/design"] },
    sitemap: `${site}/sitemap.xml`,
  }
}
