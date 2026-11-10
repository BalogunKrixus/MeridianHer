"use client"

import * as React from "react"
import { Badge } from "@meridianher/ui/components/badge"
import { createDataTableColumns, DataTable } from "@meridianher/ui/patterns/data-table"

import { ago, date, STATUS_BADGE } from "@/lib/format"

export type MemberRow = {
  user_id: string
  display_name: string
  role: string
  status: "active" | "muted" | "banned"
  muted_until: string | null
  joined: string
  last_active: string | null
  posts: number
  replies: number
  reports_against: number
  warnings: number
}

const col = createDataTableColumns<MemberRow>()

const columns = [
  col.accessor("display_name", {
    header: "Display name",
    cell: (c) => (
      <a href={`/members/${c.row.original.user_id}`} className="font-medium underline-offset-4 hover:underline">
        {c.getValue()}
      </a>
    ),
  }),
  col.accessor("role", { header: "Role", cell: (c) => <span className="capitalize">{c.getValue().replace("_", " ")}</span> }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => (
      <Badge variant={STATUS_BADGE[c.getValue()]} className="capitalize">
        {c.getValue()}
        {c.row.original.muted_until ? ` until ${date(c.row.original.muted_until)}` : ""}
      </Badge>
    ),
  }),
  col.accessor("joined", { header: "Joined", cell: (c) => date(c.getValue()) }),
  col.accessor("last_active", { header: "Last active", cell: (c) => ago(c.getValue()) }),
  col.accessor("posts", { header: "Posts", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
  col.accessor("replies", { header: "Replies", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
  col.accessor("reports_against", {
    header: "Reports",
    cell: (c) => <span className={c.getValue() ? "font-semibold text-destructive tabular-nums" : "tabular-nums"}>{c.getValue()}</span>,
  }),
  col.accessor("warnings", { header: "Sanctions", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
]

export function MembersTable({ rows }: { rows: MemberRow[] }) {
  return <DataTable columns={columns} data={rows} getRowId={(r) => r.user_id} pageSize={25} emptyTitle="No members match these filters" />
}
