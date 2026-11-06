"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { SearchIcon } from "lucide-react"

import { Button } from "../components/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select"
import { TagChip } from "./chips"

export type FilterOption = { label: string; value: string }
export type FilterDef = { id: string; label: string; options: FilterOption[] }

/**
 * Search plus filter selects with removable active filter chips (admin tables,
 * dashboard date range and space filter).
 */
function FilterBar({
  searchPlaceholder = "Search",
  search,
  onSearchChange,
  filters,
  values,
  onValuesChange,
  actions,
  className,
}: {
  searchPlaceholder?: string
  search?: string
  onSearchChange?: (value: string) => void
  filters: FilterDef[]
  values: Record<string, string | null>
  onValuesChange: (values: Record<string, string | null>) => void
  actions?: React.ReactNode
  className?: string
}) {
  const active = filters.filter((f) => values[f.id])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange ? (
          <InputGroup className="w-full sm:w-64">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </InputGroup>
        ) : null}
        {filters.map((f) => (
          <Select
            key={f.id}
            items={f.options}
            value={values[f.id] ?? null}
            onValueChange={(v) => onValuesChange({ ...values, [f.id]: (v as string) ?? null })}
          >
            <SelectTrigger aria-label={f.label} className="min-w-32">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
      {active.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {active.map((f) => (
            <TagChip
              key={f.id}
              label={`${f.label}: ${f.options.find((o) => o.value === values[f.id])?.label ?? values[f.id]}`}
              onRemove={() => onValuesChange({ ...values, [f.id]: null })}
            />
          ))}
          <Button
            variant="link"
            size="xs"
            onClick={() => onValuesChange(Object.fromEntries(filters.map((f) => [f.id, null])))}
          >
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export { FilterBar }
