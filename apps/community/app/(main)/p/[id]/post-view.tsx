"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BellIcon,
  BellOffIcon,
  BookmarkIcon,
  FlagIcon,
  LightbulbIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@meridianher/ui/components/alert"
import { Badge } from "@meridianher/ui/components/badge"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@meridianher/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@meridianher/ui/components/dropdown-menu"
import { Field, FieldLabel } from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { toast } from "@meridianher/ui/components/sonner"
import { plainText } from "@meridianher/ui/lib/rich-text"
import type { SpaceTone } from "@meridianher/ui/lib/spaces"
import { TeamBadge } from "@meridianher/ui/patterns/badges"
import { CrisisCard, type CrisisCountry } from "@meridianher/ui/patterns/cards"
import { InitialAvatar, SpaceChip, TagChip } from "@meridianher/ui/patterns/chips"
import { ContentWarningBlur, type ContentWarningType } from "@meridianher/ui/patterns/content-warning-blur"
import { ReactionBar, type ReactionKind } from "@meridianher/ui/patterns/reaction-bar"
import { ReplyComposer } from "@meridianher/ui/patterns/reply-composer"
import { ExpertAnswer, ReplyMenu, ReplyThread, type ExpertAnswerData, type ReplyData } from "@meridianher/ui/patterns/reply-thread"
import { ReportSheet } from "@meridianher/ui/patterns/report-sheet"
import { RichTextContent } from "@meridianher/ui/patterns/rich-text-content"
import { RichTextEditor, type JSONContent } from "@meridianher/ui/patterns/rich-text-editor"

import { useAccount } from "@/components/account-gate"
import { ConfirmDelete } from "@/components/confirm-delete"
import {
  createReply,
  deleteContent,
  editPost,
  editReply,
  followPost,
  markExpertAnswer,
  markHelped,
  needsCrisisHelp,
  react,
  report,
  setSaved,
} from "@/lib/actions"

type Post = {
  id: string
  title: string
  body: JSONContent | null
  authorName: string
  authorHref?: string
  anonymous: boolean
  asTeam: boolean
  space: { slug: string; name: string; tone: SpaceTone }
  tags: string[]
  timeAgo: string
  edited: boolean
  locked: boolean
  contentWarning?: ContentWarningType
  reactions: Record<ReactionKind, number>
  myReactions: ReactionKind[]
  saved: boolean
  mine: boolean
  editable: boolean
  following: boolean
  justPosted: boolean
  askExpert: boolean
}

type Reply = ReplyData & { bodyJson?: JSONContent | null; replies?: Reply[] }

function findReply(thread: Reply[], id: string): Reply | undefined {
  for (const r of thread) {
    if (r.id === id) return r
    const inner = r.replies ? findReply(r.replies, id) : undefined
    if (inner) return inner
  }
}

/** Swaps the body of the reply she is editing for an inline editor. */
function withEditor(thread: Reply[], id: string | null, editor: (r: Reply) => React.ReactNode): Reply[] {
  if (!id) return thread
  return thread.map((r) => ({
    ...r,
    editor: r.id === id ? editor(r) : undefined,
    replies: r.replies ? withEditor(r.replies, id, editor) : undefined,
  }))
}

function InlineEditor({
  initial,
  onSave,
  onCancel,
  label,
}: {
  initial: JSONContent | null | undefined
  onSave: (doc: JSONContent) => Promise<{ error?: string }>
  onCancel: () => void
  label: string
}) {
  const [doc, setDoc] = React.useState<JSONContent | undefined>(initial ?? undefined)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()
  return (
    <div className="mt-2 flex flex-col gap-2">
      <RichTextEditor aria-label={label} defaultValue={initial ?? undefined} onChange={(v) => setDoc(v.json)} maxLength={5000} />
      {error ? <p className="text-small text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={async () => {
            if (!doc) return
            setPending(true)
            const result = await onSave(doc)
            setPending(false)
            if (result.error) setError(result.error)
          }}
        >
          Save changes
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function PostView({
  post,
  expertAnswers,
  thread,
  replyCount,
  isExpert,
  crisis,
  sortTabs,
}: {
  post: Post
  expertAnswers: (ExpertAnswerData & { mine: boolean; saved: boolean })[]
  thread: Reply[]
  replyCount: number
  isExpert: boolean
  crisis: CrisisCountry[]
  sortTabs: React.ReactNode
}) {
  const router = useRouter()
  const { signedIn, requireAccount } = useAccount()
  const [saved, setSavedState] = React.useState(post.saved)
  const [following, setFollowing] = React.useState(post.following)
  const [replyTo, setReplyTo] = React.useState<string | null>(null)
  const [reportTarget, setReportTarget] = React.useState<{ type: "post" | "reply"; id: string }>({ type: "post", id: post.id })
  const [reporting, setReporting] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState(false)
  const [title, setTitle] = React.useState(post.title)
  const [postBody, setPostBody] = React.useState<JSONContent | null>(post.body)
  const [editError, setEditError] = React.useState<string>()
  const [editingReply, setEditingReply] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState<{ type: "post" | "reply"; id: string } | null>(null)
  const [crisisOpen, setCrisisOpen] = React.useState(false)
  const composerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (post.justPosted) {
      toast.success("Your post is live", { description: "We will let you know when someone replies." })
      router.replace(`/p/${post.id}`, { scroll: false })
    }
  }, [post.justPosted, post.id, router])

  const openReport = (type: "post" | "reply", id: string) => {
    if (!requireAccount(type === "post" ? "report this post" : "report this reply")) return
    setReportTarget({ type, id })
    setReporting(true)
  }

  const reactTo = (type: "post" | "reply", id: string) => async (kind: ReactionKind, active: boolean) => {
    if (!requireAccount("react")) return false
    const result = await react(type, id, kind, active)
    if (result.error) toast.error(result.error)
    return !result.error
  }

  async function copyLink(hash = "") {
    const url = `${window.location.origin}/p/${post.id}${hash}`
    await navigator.clipboard.writeText(url).then(
      () => toast("Link copied"),
      () => window.prompt("Copy this link", url)
    )
  }

  async function share() {
    const url = `${window.location.origin}/p/${post.id}`
    if (navigator.share) return void (await navigator.share({ title: post.title, url }).catch(() => {}))
    await copyLink()
  }

  async function toggleSave(type: "post" | "reply", id: string, next: boolean) {
    if (!requireAccount(type === "post" ? "save this post" : "save this reply")) return false
    const result = await setSaved(type, id, next)
    if (result.error) {
      toast.error(result.error)
      return false
    }
    toast(next ? "Saved. Find it any time under Saved." : "Removed from saved")
    if (type === "reply") router.refresh()
    return true
  }

  async function toggleFollow() {
    if (!requireAccount("follow this post")) return
    const result = await followPost(post.id, !following)
    if (result.error) return void toast.error(result.error)
    setFollowing(!following)
    toast(following ? "You will no longer be notified about new replies" : "We will let you know about new replies")
  }

  async function confirmDelete() {
    if (!deleting) return
    const result = await deleteContent(deleting.type, deleting.id, post.id)
    if (result.error) return void toast.error(result.error)
    setDeleting(null)
    if (deleting.type === "post") {
      toast("Your post was deleted")
      router.push("/")
    } else {
      toast("Your reply was deleted")
    }
  }

  const replyHandlers = {
    onReact: (id: string, kind: ReactionKind, active: boolean) => reactTo("reply", id)(kind, active),
    onReply: (id: string) => {
      if (!requireAccount("reply")) return
      setReplyTo(id)
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    onReport: (id: string) => openReport("reply", id),
    onSave: (id: string, next: boolean) => void toggleSave("reply", id, next),
    onCopyLink: (id: string) => void copyLink(`#reply-${id}`),
    onEdit: (id: string) => setEditingReply(id),
    onDelete: (id: string) => setDeleting({ type: "reply", id }),
    onMarkExpertAnswer: async (id: string) => {
      const isAnswer = !expertAnswers.some((a) => a.id === id)
      const result = await markExpertAnswer(id, post.id, isAnswer)
      if (result.error) return void toast.error(result.error)
      toast(isAnswer ? "Pinned as your expert answer" : "No longer pinned as an expert answer")
    },
    onHelped: post.mine
      ? async (id: string, helped: boolean) => {
          const result = await markHelped(id, post.id, helped)
          if (result.error) return void toast.error(result.error)
          if (helped) toast.success("Thank you. We let them know their reply helped.")
        }
      : undefined,
  }

  const threadWithEditor = withEditor(thread, editingReply, (r) => (
    <InlineEditor
      label="Edit your reply"
      initial={r.bodyJson}
      onCancel={() => setEditingReply(null)}
      onSave={async (doc) => {
        const result = await editReply(r.id, post.id, doc)
        if (!result.error) {
          setEditingReply(null)
          toast("Reply updated")
        }
        return result
      }}
    />
  ))

  const body = (
    <>
      <CardTitle render={<h1 />} id="post-title" className="text-h1 text-pretty">
        {post.title}
      </CardTitle>
      {post.body ? <RichTextContent doc={post.body} className="mt-3" /> : null}
    </>
  )

  return (
    <>
      <Card render={<article aria-labelledby="post-title" />}>
        <CardHeader className="flex items-center gap-2.5">
          <InitialAvatar name={post.authorName} tone={post.anonymous || post.asTeam ? undefined : post.space.tone} />
          <CardDescription className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-xs">
            {post.authorHref ? (
              <a href={post.authorHref} className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline">
                {post.authorName}
              </a>
            ) : (
              <span className="truncate text-sm font-medium text-foreground">{post.authorName}</span>
            )}
            {post.timeAgo}
            {post.edited ? " · edited" : ""}
          </CardDescription>
          {post.asTeam ? <TeamBadge /> : null}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More options for this post" />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={toggleFollow}>
                {following ? <BellOffIcon /> : <BellIcon />}
                {following ? "Stop following" : "Follow new replies"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyLink()}>
                <LinkIcon /> Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {post.mine ? (
                <>
                  {post.editable ? (
                    <DropdownMenuItem onClick={() => setEditingPost(true)}>
                      <PencilIcon /> Edit post
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleting({ type: "post", id: post.id })}>
                    <Trash2Icon /> Delete post
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => openReport("post", post.id)}>
                  <FlagIcon /> Report post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <SpaceChip name={post.space.name} tone={post.space.tone} href={`/s/${post.space.slug}`} />
            {post.tags.map((t) => (
              <TagChip key={t} label={t} />
            ))}
          </div>
          {editingPost ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault()
                const result = await editPost(post.id, { title, body: postBody })
                if (result.error) return setEditError(result.error)
                setEditingPost(false)
                setEditError(undefined)
                toast("Post updated")
              }}
            >
              <Field>
                <FieldLabel htmlFor="edit-title">Title</FieldLabel>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required minLength={10} />
              </Field>
              <RichTextEditor aria-label="Edit your post" defaultValue={post.body ?? undefined} onChange={(v) => setPostBody(v.json)} maxLength={5000} />
              {editError ? <p className="text-small text-destructive">{editError}</p> : null}
              <div className="flex gap-2">
                <Button type="submit">Save changes</Button>
                <Button type="button" variant="ghost" onClick={() => setEditingPost(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : post.contentWarning ? (
            <ContentWarningBlur type={post.contentWarning}>{body}</ContentWarningBlur>
          ) : (
            <div>{body}</div>
          )}
        </CardContent>
        <CardContent className="flex flex-wrap items-center gap-1">
          <ReactionBar counts={post.reactions} mine={post.myReactions} onReact={reactTo("post", post.id)} />
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-pressed={saved}
            aria-label={saved ? "Saved" : "Save"}
            onClick={async () => {
              if (await toggleSave("post", post.id, !saved)) setSavedState(!saved)
            }}
          >
            <BookmarkIcon className={saved ? "fill-current text-primary" : undefined} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Share" onClick={share}>
            <Share2Icon />
          </Button>
        </CardContent>
      </Card>

      {post.askExpert && post.mine ? (
        <Alert>
          <BellIcon aria-hidden />
          <AlertTitle>You asked for an expert</AlertTitle>
          <AlertDescription>Your question is in the expert inbox. We will notify you the moment an expert answers.</AlertDescription>
        </Alert>
      ) : null}

      {expertAnswers.map((a) => (
        <ExpertAnswer
          key={a.id}
          answer={a}
          onReact={reactTo("reply", a.id)}
          menu={
            <ReplyMenu
              reply={{ id: a.id, mine: a.mine, saved: a.saved, canMarkExpertAnswer: a.mine && isExpert }}
              markExpertLabel="Unpin expert answer"
              onSave={replyHandlers.onSave}
              onCopyLink={replyHandlers.onCopyLink}
              onReport={replyHandlers.onReport}
              onDelete={replyHandlers.onDelete}
              onMarkExpertAnswer={replyHandlers.onMarkExpertAnswer}
            />
          }
        />
      ))}

      <Card render={<section aria-labelledby="replies-title" />}>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle render={<h2 />} id="replies-title" className="flex items-center gap-2 text-h3">
            Replies <Badge variant="secondary">{replyCount}</Badge>
          </CardTitle>
          {sortTabs}
        </CardHeader>
        {threadWithEditor.length ? (
          <CardContent>
            <ReplyThread replies={threadWithEditor} {...replyHandlers} />
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-small text-muted-foreground">
              {post.mine ? "No replies yet. Members usually answer within a few hours." : "Be the first to reply. Your experience could help."}
            </p>
          </CardContent>
        )}
        <CardContent ref={composerRef} className="flex flex-col gap-3">
          {isExpert && !expertAnswers.some((a) => a.mine) ? (
            <Alert>
              <LightbulbIcon aria-hidden />
              <AlertTitle>Answering as an expert</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  <li>What this could mean, in plain words</li>
                  <li>When to see a doctor, and how soon</li>
                  <li>What to ask the doctor</li>
                </ul>
                After posting, choose Mark as expert answer from the reply menu to pin it. The disclaimer is added for you.
              </AlertDescription>
            </Alert>
          ) : null}
          {signedIn ? (
            <ReplyComposer
              replyingTo={replyTo ? findReply(thread, replyTo)?.author.displayName : undefined}
              onCancelReplyTo={() => setReplyTo(null)}
              disabledReason={post.locked ? "Replies are closed on this post." : undefined}
              onSubmit={async (doc) => {
                const result = await createReply(post.id, replyTo, doc)
                if (result.error) return result
                setReplyTo(null)
                if (await needsCrisisHelp(plainText(doc))) setCrisisOpen(true)
                else toast("Reply posted")
                return result
              }}
            />
          ) : (
            <Button variant="outline" className="w-full" onClick={() => requireAccount("reply")}>
              Sign in to reply
            </Button>
          )}
        </CardContent>
      </Card>

      <ReportSheet
        open={reporting}
        onOpenChange={setReporting}
        target={reportTarget.type}
        onSubmit={(reason, note) => report({ ...reportTarget, reason, note })}
      />

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting?.type === "post" ? "Delete this post?" : "Delete this reply?"}
        description={
          deleting?.type === "post"
            ? "It will disappear for everyone, along with its place in the feed. Replies go with it. This cannot be undone."
            : "It will show as removed in the thread. This cannot be undone."
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={crisisOpen} onOpenChange={setCrisisOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thank you for sharing</DialogTitle>
            <DialogDescription>
              Your reply is posted. It sounds like things may be really hard right now. You do not have to go through it alone.
            </DialogDescription>
          </DialogHeader>
          <CrisisCard countries={crisis} compact />
        </DialogContent>
      </Dialog>
    </>
  )
}
