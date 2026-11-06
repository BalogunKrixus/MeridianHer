"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FilterBar, type FilterDef } from "@meridianher/ui/patterns/filter-bar"

/** FilterBar whose values live in the address, so every filtered view can be shared and reloaded. */
export function UrlFilters({
  filters,
  searchPlaceholder,
  defaults = {},
  actions,
}: {
  filters: FilterDef[]
  /** Shown when the address has no value, for example the default date range */
  defaults?: Record<string, string>
  searchPlaceholder?: string
  actions?: React.ReactNode
}) {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = React.useState(params.get("q") ?? "")
  const timer = React.useRef<number>(undefined)

  const push = (next: Record<string, string | null>) => {
    const u = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) u.set(k, v)
      else u.delete(k)
    }
    const qs = u.toString()
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false })
  }

  return (
    <FilterBar
      filters={filters}
      values={Object.fromEntries(filters.map((f) => [f.id, params.get(f.id) ?? defaults[f.id] ?? null]))}
      onValuesChange={push}
      searchPlaceholder={searchPlaceholder}
      search={searchPlaceholder ? search : undefined}
      onSearchChange={
        searchPlaceholder
          ? (value) => {
              setSearch(value)
              window.clearTimeout(timer.current)
              timer.current = window.setTimeout(() => push({ q: value.trim() || null }), 300)
            }
          : undefined
      }
      actions={actions}
    />
  )
}
