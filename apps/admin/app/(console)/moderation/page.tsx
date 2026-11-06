import type { Metadata } from "next"
import { createClient } from "@meridianher/db/server"

import { communityPost } from "@/lib/community"
import { age, ago, REPORT_REASON_LABELS } from "@/lib/format"
import { getQueueCounts, requireStaff } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { ModerationQueue, type Appeal, type QueueEntry, type Resolved } from "./queue"

export const metadata: Metadata = { title: "Moderation" }

const TABS = ["urgent", "reported", "held", "appeals", "resolved"] as const
type Tab = (typeof TABS)[number]

type RawItem = {
  target_type: "post" | "reply" | "profile"
  target_id: string
  title: string | null
  content: string | null
  context?: string
  post_id?: string
  status: string
  space?: string
  created_at: string
  priority: "urgent" | "normal"
  received_at: string | null
  claimed_by: string | null
  author: { id: string; name: string; role: string; status: string; joined: string; warnings: number } | null
  reports: { reason: string; count: number }[]
  notes: string[]
  flags: { source: string; priority: string; score: number | null; details: Record<string, unknown> }[]
}

const FLAG_LABELS: Record<string, string> = {
  new_account: "New account",
  link: "Link or contact details",
  keyword: "Automated check",
  classifier: "Classifier",
  threshold: "Reported by several members",
  escalated: "Escalated",
}

export default async function ModerationPage({ searchParams }: PageProps<"/moderation">) {
  const staff = await requireStaff()
  const [params, counts] = await Promise.all([searchParams, getQueueCounts()])
  const fallback: Tab = counts.urgent ? "urgent" : counts.reported ? "reported" : counts.held ? "held" : counts.appeals ? "appeals" : "reported"
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : fallback
  const supabase = await createClient()
  const { data } = await supabase.rpc("staff_queue", { tab })
  const raw = (data ?? []) as unknown[]

  const items: QueueEntry[] =
    tab === "appeals" || tab === "resolved"
      ? []
      : (raw as RawItem[]).map((i) => ({
          id: `${i.target_type}:${i.target_id}`,
          targetType: i.target_type,
          targetId: i.target_id,
          authorId: i.author?.id ?? null,
          authorName: i.author?.name ?? "Former member",
          priority: i.priority,
          source: i.status === "held" ? "held" : "reported",
          context: i.context ?? undefined,
          content: [i.title, i.content && i.content !== i.title ? i.content : null].filter(Boolean).join("\n\n") || "(no text)",
          author: { displayName: i.author?.name ?? "Former member", accountAge: age(i.author?.joined), pastWarnings: i.author?.warnings ?? 0 },
          reports: i.reports.map((r) => ({ reason: REPORT_REASON_LABELS[r.reason] ?? r.reason, count: r.count })),
          scores: i.flags.filter((f) => f.score !== null).map((f) => ({ label: FLAG_LABELS[f.source] ?? f.source, value: Number(f.score) })),
          flags: [
            ...i.flags
              .filter((f) => f.score === null)
              .map((f) => ({
                label: FLAG_LABELS[f.source] ?? f.source,
                detail:
                  typeof f.details.note === "string"
                    ? f.details.note
                    : Array.isArray(f.details.found)
                      ? (f.details.found as string[]).join(", ")
                      : typeof f.details.found === "string"
                        ? f.details.found
                        : undefined,
              })),
            ...i.notes.map((n) => ({ label: "Reporter note", detail: n })),
          ],
          href: i.post_id ? communityPost(i.post_id, i.target_type === "reply" ? i.target_id : undefined) : undefined,
          receivedAgo: ago(i.received_at ?? i.created_at),
          claimedBy: i.claimed_by ?? undefined,
          claimedByMe: i.claimed_by === staff.display_name,
        }))

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title="Moderation"
        description="Urgent first, then oldest. Press J and K to move, A H W M B E to act, X to select."
      />
      <ModerationQueue
        tab={tab}
        counts={counts}
        items={items}
        appeals={tab === "appeals" ? (raw as Appeal[]) : []}
        resolved={tab === "resolved" ? (raw as Resolved[]) : []}
      />
    </div>
  )
}
