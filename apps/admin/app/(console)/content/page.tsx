import type { Metadata } from "next"
import { createClient } from "@meridianher/db/server"

import { requireStaff } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { UrlFilters } from "@/components/url-filters"
import { PostsTable, type PostRow } from "./posts-table"

export const metadata: Metadata = { title: "Content" }

const FILTERS = [
  { value: "unanswered", label: "No replies yet" },
  { value: "unanswered_expert", label: "Waiting for an expert over 48 hours" },
  { value: "expert", label: "Has an expert answer" },
  { value: "pinned", label: "Pinned" },
  { value: "locked", label: "Locked" },
]

export default async function ContentPage({ searchParams }: PageProps<"/content">) {
  await requireStaff()
  const params = await searchParams
  const get = (k: string) => (typeof params[k] === "string" && params[k] ? (params[k] as string) : undefined)
  const supabase = await createClient()
  const { data: spaces } = await supabase.from("spaces").select("id, name").order("sort_order")

  let query = supabase
    .from("posts")
    .select("id, title, type, status, pinned, locked, reply_count, view_count, has_expert_answer, ask_expert, content_warning, created_at, deleted_at, as_team, space_id")
    .order("created_at", { ascending: false })
    .limit(500)
  const q = get("q")
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, " ")}%`)
  if (get("space")) query = query.eq("space_id", get("space")!)
  if (get("type")) query = query.eq("type", get("type") as "question" | "discussion" | "announcement")
  const status = get("status")
  if (status === "deleted") query = query.not("deleted_at", "is", null)
  else if (status) query = query.eq("status", status as "published" | "held" | "hidden").is("deleted_at", null)
  switch (get("filter")) {
    case "unanswered":
      query = query.eq("reply_count", 0).eq("status", "published")
      break
    case "unanswered_expert":
      query = query.eq("ask_expert", true).eq("has_expert_answer", false).lt("created_at", new Date(Date.now() - 48 * 3600000).toISOString())
      break
    case "expert":
      query = query.eq("has_expert_answer", true)
      break
    case "pinned":
      query = query.eq("pinned", true)
      break
    case "locked":
      query = query.eq("locked", true)
  }
  const { data } = await query
  const spaceName = new Map((spaces ?? []).map((s) => [s.id, s.name]))
  const rows: PostRow[] = (data ?? []).map((p) => ({ ...p, space: spaceName.get(p.space_id) ?? "" }))

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Content" description="Every post, including held, hidden and deleted ones. Actions are logged." />
      <UrlFilters
        searchPlaceholder="Search titles"
        filters={[
          { id: "space", label: "Space", options: (spaces ?? []).map((s) => ({ value: s.id, label: s.name })) },
          {
            id: "type",
            label: "Type",
            options: [
              { value: "question", label: "Question" },
              { value: "discussion", label: "Discussion" },
              { value: "announcement", label: "Announcement" },
            ],
          },
          {
            id: "status",
            label: "Status",
            options: [
              { value: "published", label: "Published" },
              { value: "held", label: "Held" },
              { value: "hidden", label: "Hidden" },
              { value: "deleted", label: "Deleted" },
            ],
          },
          { id: "filter", label: "Show", options: FILTERS },
        ]}
      />
      <PostsTable rows={rows} spaces={spaces ?? []} />
    </div>
  )
}
