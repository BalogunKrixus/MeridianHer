"use client"

import { DownloadIcon } from "lucide-react"
import { Button } from "@meridianher/ui/components/button"

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Exports any table as CSV in the browser (PRD 9.8 and 9.9). */
export function CsvButton({ filename, rows }: { filename: string; rows: Record<string, unknown>[] }) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!rows.length}
      onClick={() => {
        const keys = Object.keys(rows[0] ?? {})
        const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => cell(r[k])).join(","))].join("\n")
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
        const a = document.createElement("a")
        a.href = url
        a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }}
    >
      <DownloadIcon data-icon="inline-start" aria-hidden />
      Export CSV
    </Button>
  )
}
