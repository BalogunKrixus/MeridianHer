import type { Metadata } from "next"
import { createClient } from "@meridianher/db/server"

import { requireAdmin } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { SpacesManager } from "./spaces-manager"

export const metadata: Metadata = { title: "Spaces" }

export default async function SpacesPage() {
  await requireAdmin()
  const supabase = await createClient()
  const [{ data: spaces }, { data: follows }] = await Promise.all([
    supabase.from("spaces").select("*").order("sort_order"),
    supabase.from("space_follows").select("space_id"),
  ])
  const followers = (id: string) => (follows ?? []).filter((f) => f.space_id === id).length
  return (
    <div className="flex flex-col gap-4 p-6">
      <SpacesManager
        header={<PageHeader title="Spaces" description="Changes go live straight away, no deploy needed. Archived spaces are hidden from members." />}
        spaces={(spaces ?? []).map((s) => ({ ...s, followers: followers(s.id) }))}
      />
    </div>
  )
}
