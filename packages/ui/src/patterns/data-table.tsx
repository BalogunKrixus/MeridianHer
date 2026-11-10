"use client"

import * as React from "react"
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import { cn } from "../lib/utils"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, InboxIcon } from "lucide-react"

import { Button } from "../components/button"
import { Card } from "../components/card"
import { Checkbox } from "../components/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/table"

/** Features every admin table gets. Register more here when a table needs them. */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

export type DataTableFeatures = typeof dataTableFeatures
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>

export function createDataTableColumns<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

/**
 * Admin table on TanStack Table v9: sorting, row selection for bulk actions,
 * pagination, compact rows, designed empty state.
 */
function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  selectable = false,
  pageSize = 20,
  emptyTitle = "Nothing here yet",
  toolbar,
  onSelectionChange,
  className,
}: {
  columns: DataTableColumn<TData>[]
  data: TData[]
  getRowId: (row: TData) => string
  selectable?: boolean
  pageSize?: number
  emptyTitle?: string
  /** Rendered above the table; receives the selected row ids for bulk actions */
  toolbar?: (selectedIds: string[]) => React.ReactNode
  onSelectionChange?: (ids: string[]) => void
  className?: string
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize })

  const allColumns = React.useMemo<DataTableColumn<TData>[]>(() => {
    if (!selectable) return columns
    const helper = createDataTableColumns<TData>()
    return [
      helper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      }) as DataTableColumn<TData>,
      ...columns,
    ]
  }, [columns, selectable])

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: allColumns,
    state: { sorting, rowSelection, pagination },
    getRowId,
    enableRowSelection: selectable,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
  })

  const selectedIds = React.useMemo(() => Object.keys(rowSelection).filter((k) => rowSelection[k]), [rowSelection])
  React.useEffect(() => onSelectionChange?.(selectedIds), [selectedIds, onSelectionChange])

  const rows = table.getRowModel().rows
  const pageCount = Math.max(1, Math.ceil(data.length / pagination.pageSize))

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {toolbar ? toolbar(selectedIds) : null}
      <Card className="py-0">
        <Table>
          <TableHeader className="bg-muted/60">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : canSort ? "none" : undefined}
                      className={cn("h-9 text-xs text-muted-foreground", header.column.id === "select" && "w-10")}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Button variant="ghost" size="xs" className="-ml-2 text-muted-foreground" onClick={header.column.getToggleSortingHandler()}>
                          <FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon data-icon="inline-end" aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon data-icon="inline-end" aria-hidden />
                          ) : (
                            <ArrowUpDownIcon data-icon="inline-end" className="opacity-50" aria-hidden />
                          )}
                        </Button>
                      ) : (
                        <FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1.5">
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={allColumns.length} className="h-32 text-center text-muted-foreground">
                  <InboxIcon className="mx-auto mb-2 size-5" aria-hidden />
                  {emptyTitle}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <div className="flex items-center justify-between gap-3 text-small text-muted-foreground">
        <span>{selectable && selectedIds.length ? `${selectedIds.length} selected` : `${data.length} rows`}</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            Page {pagination.pageIndex + 1} of {pageCount}
          </span>
          <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTable }
