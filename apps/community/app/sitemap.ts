import type { MetadataRoute } from "next"
import { createPublicClient } from "@meridianher/db/public"

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

// Built on request, so the build never needs the database
export const dynamic = "force-dynamic"

/** Public questions, spaces and experts, as a visitor sees them. Posts behind content warnings are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient()
  const [{ data: spaces }, { data: posts }, { data: experts }] = await Promise.all([
    supabase.from("spaces").select("slug"),
    supabase.from("feed_posts").select("id, created_at, edited_at").is("content_warning", null).order("created_at", { ascending: false }).limit(5000),
    supabase.from("public_experts").select("handle"),
  ])
  return [
    { url: site, changeFrequency: "hourly", priority: 1 },
    { url: `${site}/spaces` },
    { url: `${site}/experts` },
    { url: `${site}/guidelines` },
    ...(spaces ?? []).map((s) => ({ url: `${site}/s/${s.slug}`, changeFrequency: "hourly" as const })),
    ...(experts ?? []).map((e) => ({ url: `${site}/e/${e.handle}` })),
    ...(posts ?? []).map((p) => ({ url: `${site}/p/${p.id}`, lastModified: p.edited_at ?? p.created_at ?? undefined })),
  ]
}
