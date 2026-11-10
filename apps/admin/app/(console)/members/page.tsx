import type { Metadata } from "next"
import { createClient } from "@meridianher/db/server"

import { requireStaff } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { UrlFilters } from "@/components/url-filters"
import { MembersTable, type MemberRow } from "./members-table"

export const metadata: Metadata = { title: "Members" }

const STATUSES = ["active", "muted", "banned"]
const ROLES = ["member", "expert", "moderator", "admin", "super_admin"]

export default async function MembersPage({ searchParams }: PageProps<"/members">) {
  await requireStaff()
  const params = await searchParams
  const q = typeof params.q === "string" && params.q.trim() ? params.q.trim() : undefined
  const status = STATUSES.includes(params.status as string) ? (params.status as string) : undefined
  const role = ROLES.includes(params.role as string) ? (params.role as string) : undefined
  const supabase = await createClient()
  const { data } = await supabase.rpc("staff_members", { search: q, in_status: status, in_role: role, max_rows: 500 })
  const rows = (data ?? []) as MemberRow[]

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Members" description="Search by display name. Emails stay hidden unless an admin reveals one, and every reveal is logged." />
      <UrlFilters
        searchPlaceholder="Search display names"
        filters={[
          { id: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) },
          { id: "role", label: "Role", options: ROLES.map((r) => ({ value: r, label: r.replace("_", " ").replace(/^./, (c) => c.toUpperCase()) })) },
        ]}
      />
      <MembersTable rows={rows} />
    </div>
  )
}
