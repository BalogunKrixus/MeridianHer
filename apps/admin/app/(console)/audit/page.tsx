import type { Metadata } from "next"
import { HistoryIcon } from "lucide-react"
import { Card, CardContent } from "@meridianher/ui/components/card"
import { AuditRow } from "@meridianher/ui/patterns/audit-row"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { createClient } from "@meridianher/db/server"

import { dateTime } from "@/lib/format"
import { requireAdmin } from "@/lib/staff"
import { CsvButton } from "@/components/csv-button"
import { PageHeader } from "@/components/page-header"
import { UrlFilters } from "@/components/url-filters"

export const metadata: Metadata = { title: "Audit log" }

const TARGETS = ["post", "reply", "profile", "expert_application", "expert_invite", "space", "setting"]
const RANGES = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "365", label: "Last year" },
]

/** Append only; nobody can edit or delete entries, not even super admins (PRD 9.9). */
export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  await requireAdmin()
  const params = await searchParams
  const get = (k: string) => (typeof params[k] === "string" && params[k] ? (params[k] as string) : undefined)
  const supabase = await createClient()
  const days = Number(get("range") ?? 30)
  const { data: staff } = await supabase.from("profiles").select("user_id, display_name").in("role", ["moderator", "admin", "super_admin"])

  let query = supabase
    .from("audit_log")
    .select("id, actor_id, action, target_type, target_id, before, after, reason, ip, at")
    .gte("at", new Date(Date.now() - days * 86400000).toISOString())
    .order("at", { ascending: false })
    .limit(500)
  if (get("actor")) query = query.eq("actor_id", get("actor")!)
  if (get("target")) query = query.eq("target_type", get("target")!)
  const q = get("q")
  if (q) query = query.or(`action.ilike.%${q.replace(/[%_,()]/g, " ")}%,reason.ilike.%${q.replace(/[%_,()]/g, " ")}%`)
  const { data } = await query
  const names = new Map((staff ?? []).map((s) => [s.user_id, s.display_name ?? "Staff"]))
  const rows = (data ?? []).map((e) => ({ ...e, actor: e.actor_id ? (names.get(e.actor_id) ?? "Member") : "System" }))

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title="Audit log"
        description="Every staff action, who did it and why. Entries cannot be edited or deleted."
        actions={
          <CsvButton
            filename="audit-log"
            rows={rows.map((r) => ({ at: r.at, actor: r.actor, action: r.action, target_type: r.target_type, target_id: r.target_id, reason: r.reason, ip: r.ip, before: r.before, after: r.after }))}
          />
        }
      />
      <UrlFilters
        defaults={{ range: "30" }}
        searchPlaceholder="Search actions and reasons"
        filters={[
          { id: "range", label: "When", options: RANGES },
          { id: "actor", label: "Who", options: (staff ?? []).map((s) => ({ value: s.user_id, label: s.display_name ?? "Staff" })) },
          { id: "target", label: "What", options: TARGETS.map((t) => ({ value: t, label: t.replace("_", " ").replace(/^./, (c) => c.toUpperCase()) })) },
        ]}
      />
      {rows.length ? (
        <Card className="py-0">
          <CardContent className="px-0">
            {rows.map((r) => (
              <AuditRow
                key={r.id}
                entry={{
                  id: r.id,
                  at: dateTime(r.at),
                  actor: r.actor,
                  action: r.action,
                  target: `${r.target_type ?? ""} ${r.target_id ? r.target_id.slice(0, 8) : ""}`.trim(),
                  reason: r.reason ?? undefined,
                  ip: r.ip ?? undefined,
                  before: r.before ?? undefined,
                  after: r.after ?? undefined,
                }}
              />
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={HistoryIcon} title="No entries match" description="Try a longer date range or clear the filters." />
      )}
    </div>
  )
}
