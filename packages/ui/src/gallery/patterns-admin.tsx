"use client"

import * as React from "react"
import { DownloadIcon, EyeOffIcon } from "lucide-react"

import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { AuditRow } from "../patterns/audit-row"
import { InitialAvatar } from "../patterns/chips"
import { createDataTableColumns, DataTable } from "../patterns/data-table"
import { FilterBar } from "../patterns/filter-bar"
import { ActivityChart } from "../patterns/activity-chart"
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
  const members = sampleMembers.filter((m) => m.displayName.toLowerCase().includes(search.toLowerCase()))

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

      <Specimen title="Activity chart" note="Daily counts for the overview. Series take the chart colour tokens in order.">
        <ActivityChart
          data={Array.from({ length: 14 }, (_, i) => ({
            day: new Date(Date.UTC(2026, 9, 24 + i)).toISOString().slice(0, 10),
            posts: [12, 15, 11, 18, 22, 19, 25, 21, 24, 28, 26, 31, 29, 34][i],
            replies: [40, 46, 38, 52, 61, 57, 70, 66, 72, 80, 77, 88, 85, 96][i],
            members: [5, 7, 4, 9, 11, 8, 12, 10, 9, 14, 13, 15, 12, 17][i],
          }))}
          series={[
            { key: "posts", label: "Posts" },
            { key: "replies", label: "Replies" },
            { key: "members", label: "New members" },
          ]}
        />
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
                  <Button variant="outline" size="sm">
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

      <Specimen title="Moderation queue item" note="The focused item (first) takes the A, H, W, M, B and E shortcuts on the queue screen." bare className="flex flex-col gap-4">
        {sampleQueue.map((item, i) => (
          <QueueItem
            key={item.id}
            item={item}
            focused={i === 0}
            selected={!!selected[item.id]}
            onSelectedChange={(v) => setSelected((s) => ({ ...s, [item.id]: v }))}
          />
        ))}
      </Specimen>

      <Specimen title="Audit log rows" note="Append only. Expand a row to see before and after." className="px-0">
        {sampleAudit.map((e) => (
          <AuditRow key={e.id} entry={e} />
        ))}
      </Specimen>
    </Section>
  )
}
