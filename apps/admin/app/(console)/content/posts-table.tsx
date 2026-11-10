"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ExternalLinkIcon, LockIcon, MoreHorizontalIcon, PinIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { Button } from "@meridianher/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@meridianher/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@meridianher/ui/components/dropdown-menu"
import { Field, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { toast } from "@meridianher/ui/components/sonner"
import { createDataTableColumns, DataTable } from "@meridianher/ui/patterns/data-table"

import { communityPost } from "@/lib/community"
import { ago } from "@/lib/format"
import { contentAction } from "@/lib/moderation-actions"

export type PostRow = {
  id: string
  title: string
  type: string
  status: "published" | "held" | "hidden"
  pinned: boolean
  locked: boolean
  reply_count: number
  view_count: number
  has_expert_answer: boolean
  ask_expert: boolean
  content_warning: string | null
  created_at: string
  deleted_at: string | null
  as_team: boolean
  space: string
}

type Pending = { post: PostRow; kind: "move" | "warning" | "hide" }

const WARNINGS = [
  { value: "pregnancy_loss", label: "Pregnancy loss" },
  { value: "graphic", label: "Graphic" },
  { value: "mental_health", label: "Mental health" },
]

const col = createDataTableColumns<PostRow>()

function RowMenu({ post, onPending }: { post: PostRow; onPending: (p: Pending) => void }) {
  const router = useRouter()
  const run = async (action: Parameters<typeof contentAction>[1], done: string) => {
    const result = await contentAction(post.id, action)
    if (result.error) return void toast.error(result.error)
    toast.success(done)
    router.refresh()
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${post.title}`} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem render={<a href={communityPost(post.id)} target="_blank" rel="noreferrer" />}>
          <ExternalLinkIcon /> View in community
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => run(post.pinned ? "unpin" : "pin", post.pinned ? "Unpinned" : "Pinned to the top of its space")}>
          {post.pinned ? "Unpin" : "Pin to space"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(post.locked ? "unlock" : "lock", post.locked ? "Replies reopened" : "Replies closed")}>
          {post.locked ? "Reopen replies" : "Lock replies"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPending({ post, kind: "move" })}>Move to another space</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPending({ post, kind: "warning" })}>Add content warning</DropdownMenuItem>
        <DropdownMenuSeparator />
        {post.status === "hidden" ? (
          <DropdownMenuItem onClick={() => run("restore", "Restored")}>Restore</DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => onPending({ post, kind: "hide" })}>
            Hide
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PostsTable({ rows, spaces }: { rows: PostRow[]; spaces: { id: string; name: string }[] }) {
  const router = useRouter()
  const [pending, setPending] = React.useState<Pending | null>(null)
  const [value, setValue] = React.useState("")

  const columns = React.useMemo(
    () => [
      col.accessor("title", {
        header: "Title",
        cell: (c) => (
          <span className="flex max-w-md items-center gap-1.5">
            {c.row.original.pinned ? <PinIcon className="size-3.5 shrink-0 text-primary" aria-label="Pinned" /> : null}
            {c.row.original.locked ? <LockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label="Locked" /> : null}
            <span className="truncate font-medium">{c.getValue()}</span>
          </span>
        ),
      }),
      col.accessor("space", { header: "Space" }),
      col.accessor("type", { header: "Type", cell: (c) => <span className="capitalize">{c.row.original.as_team ? "Team post" : c.getValue()}</span> }),
      col.accessor("status", {
        header: "Status",
        cell: (c) =>
          c.row.original.deleted_at ? (
            <Badge variant="outline">Deleted</Badge>
          ) : (
            <Badge variant={c.getValue() === "published" ? "secondary" : c.getValue() === "held" ? "warning" : "destructive"} className="capitalize">
              {c.getValue()}
            </Badge>
          ),
      }),
      col.accessor("reply_count", { header: "Replies", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
      col.accessor("view_count", { header: "Views", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
      col.accessor("has_expert_answer", {
        header: "Expert",
        cell: (c) => (c.getValue() ? <Badge variant="success">Answered</Badge> : c.row.original.ask_expert ? <Badge variant="outline">Asked</Badge> : null),
      }),
      col.accessor("created_at", { header: "Posted", cell: (c) => ago(c.getValue()) }),
      col.display({ id: "actions", header: "", cell: (c) => <RowMenu post={c.row.original} onPending={(p) => {
              setValue("")
              setPending(p)
            }} /> }),
    ],
    []
  )

  async function confirm() {
    if (!pending || !value) return
    const { post, kind } = pending
    const result =
      kind === "move"
        ? await contentAction(post.id, "move", { space_id: value })
        : kind === "warning"
          ? await contentAction(post.id, "warn_content", { warning: value })
          : await contentAction(post.id, "hide", { reason: value })
    if (result.error) return void toast.error(result.error)
    toast.success(kind === "move" ? "Moved" : kind === "warning" ? "Content warning added" : "Hidden. The author has been told why.")
    setPending(null)
    router.refresh()
  }

  const options = pending?.kind === "move" ? spaces.map((s) => ({ value: s.id, label: s.name })) : WARNINGS

  return (
    <>
      <DataTable columns={columns} data={rows} getRowId={(r) => r.id} pageSize={25} emptyTitle="No posts match these filters" />
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pending?.kind === "move" ? "Move post" : pending?.kind === "warning" ? "Add a content warning" : "Hide post"}</DialogTitle>
            <DialogDescription className="truncate">{pending?.post.title}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="content-value">{pending?.kind === "move" ? "Space" : pending?.kind === "warning" ? "Warning" : "Reason the author will see"}</FieldLabel>
            {pending?.kind === "hide" ? (
              <Input id="content-value" value={value} onChange={(e) => setValue(e.target.value)} />
            ) : (
              <Select items={options} value={value || null} onValueChange={(v) => setValue((v as string) ?? "")}>
                <SelectTrigger id="content-value" className="w-full">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant={pending?.kind === "hide" ? "destructive" : "default"} disabled={!value.trim()} onClick={confirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
