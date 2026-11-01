"use client"

import * as React from "react"
import { DownloadIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { AuditRow } from "../patterns/audit-row"
import { InitialAvatar } from "../patterns/chips"
import { createDataTableColumns, DataTable } from "../patterns/data-table"
import { FilterBar } from "../patterns/filter-bar"
import { QueueItem } from "../patterns/queue-item"
import { StatCard } from "../patterns/stat-card"
import { Section, Specimen } from "./layout"
import { sampleAudit, sampleMembers, sampleQueue, type SampleMember } from "./sample-data"

const col = createDataTableColumns<SampleMember>()
const memberColumns = [
  col.accessor("displayName", {
    header: "Display name",
    cell: ({ row }) => (
      <span className="flex items-center gap-2 font-medium">
        <InitialAvatar name={row.original.displayName} size="sm" />
        {row.original.displayName}
      </span>
    ),
  }),
  col.accessor("role", {
    header: "Role",
    cell: ({ getValue }) => <Badge variant={getValue() === "expert" ? "expert" : "secondary"} className="capitalize">{getValue()}</Badge>,
  }),
  col.accessor("joined", { header: "Joined" }),
  col.accessor("posts", { header: "Posts", cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span> }),
  col.accessor("reports", { header: "Reports against", cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span> }),
  col.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue()
      return <Badge variant={s === "active" ? "success" : s === "muted" ? "warning" : "destructive"} className="capitalize">{s}</Badge>
    },
  }),
]

export function AdminPatterns() {
  const [filters, setFilters] = React.useState<Record<string, string | null>>({ range: "7", space: null })
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [focused, setFocused] = React.useState(0)

  const members = sampleMembers.filter((m) => m.displayName.toLowerCase().includes(search.toLowerCase()))

  React.useEffect(() => {
    const keys: Record<string, string> = { a: "Approved", h: "Hidden", w: "Warning sent", m: "Muted", b: "Ban dialog opens", e: "Escalated to admin" }
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (t.closest("input, textarea, [contenteditable], [role=dialog], [role=menu], [role=listbox]") || e.metaKey || e.ctrlKey || e.altKey) return
      if (!document.getElementById("admin")?.matches(":hover, :focus-within")) return
      const k = e.key.toLowerCase()
      if (k === "j") setFocused((f) => Math.min(sampleQueue.length - 1, f + 1))
      else if (k === "k") setFocused((f) => Math.max(0, f - 1))
      else if (keys[k]) toast(`${keys[k]}: ${sampleQueue[focused].author.displayName}`)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [focused])

  return (
    <Section
      id="admin"
      title="Admin patterns"
      description="Desktop first and dense. Switch density to compact to see the admin type ramp. Controls still grow to 44px on a phone."
    >
      <Specimen title="Stat cards" note="Change versus previous period. Reports going down is good, so it shows in green." bare>
        <FilterBar
          className="mb-4"
          filters={[
            { id: "range", label: "Date range", options: [{ label: "Today", value: "1" }, { label: "7 days", value: "7" }, { label: "30 days", value: "30" }, { label: "90 days", value: "90" }] },
            { id: "space", label: "All spaces", options: [{ label: "Periods and cycles", value: "periods" }, { label: "Menopause", value: "menopause" }, { label: "Postpartum", value: "postpartum" }] },
          ]}
          values={filters}
          onValuesChange={setFilters}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total members" value="4,812" change={12.4} trend={[20, 24, 23, 29, 31, 35, 41]} href="#" />
          <StatCard label="Monthly active" value="1,936" change={6.1} trend={[30, 28, 33, 35, 34, 38, 40]} />
          <StatCard label="Questions answered in 24 hours" value="81%" change={0} />
          <StatCard label="Open reports" value="7" change={-22} goodWhen="down" trend={[12, 10, 11, 9, 8, 9, 7]} />
        </div>
      </Specimen>

      <Specimen title="Data table" note="TanStack Table v9: sort by any column, select rows for bulk actions, paginate." bare>
        <DataTable
          columns={memberColumns}
          data={members}
          getRowId={(m) => m.id}
          selectable
          pageSize={5}
          emptyTitle="No members match your search"
          toolbar={(ids) => (
            <FilterBar
              searchPlaceholder="Search members"
              search={search}
              onSearchChange={setSearch}
              filters={[{ id: "status", label: "Status", options: [{ label: "Active", value: "active" }, { label: "Muted", value: "muted" }, { label: "Banned", value: "banned" }] }]}
              values={{ status: null }}
              onValuesChange={() => {}}
              actions={
                ids.length ? (
                  <Button variant="outline" size="sm" onClick={() => toast(`${ids.length} members muted for 24 hours`)}>
                    <EyeOffIcon data-icon="inline-start" /> Mute {ids.length}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm"><DownloadIcon data-icon="inline-start" /> Export CSV</Button>
                )
              }
            />
          )}
        />
      </Specimen>

      <Specimen title="Moderation queue item" note="Press J and K to move between items, then A, H, W, M, B or E while the pointer is over this section." bare>
        <div className="flex flex-col gap-4">
          {sampleQueue.map((item, i) => (
            <QueueItem
              key={item.id}
              item={item}
              focused={i === focused}
              selected={!!selected[item.id]}
              onSelectedChange={(v) => setSelected((s) => ({ ...s, [item.id]: v }))}
              onAction={(a) => toast(`${a} on ${item.author.displayName}`)}
              onClaim={() => toast("Claimed by you")}
            />
          ))}
        </div>
      </Specimen>

      <Specimen title="Audit log rows" note="Append only. Expand a row to see before and after." bare>
        <div className="rounded-xl bg-card shadow-soft">
          {sampleAudit.map((e) => (
            <AuditRow key={e.id} entry={e} />
          ))}
        </div>
      </Specimen>
    </Section>
  )
}
