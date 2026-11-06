"use client"

import * as React from "react"
import type { JSONContent } from "@meridianher/ui/patterns/rich-text-editor"
import { BookmarkIcon, CheckIcon, FlagIcon, Share2Icon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import type { SpaceTone } from "@meridianher/ui/lib/spaces"
import { TeamBadge } from "@meridianher/ui/patterns/badges"
import { InitialAvatar, SpaceChip, TagChip } from "@meridianher/ui/patterns/chips"
import { ContentWarningBlur, type ContentWarningType } from "@meridianher/ui/patterns/content-warning-blur"
import { ReactionBar, type ReactionKind } from "@meridianher/ui/patterns/reaction-bar"
import { ReplyComposer } from "@meridianher/ui/patterns/reply-composer"
import { ExpertAnswer, ReplyThread, type ExpertAnswerData, type ReplyData } from "@meridianher/ui/patterns/reply-thread"
import { ReportSheet } from "@meridianher/ui/patterns/report-sheet"
import { RichTextContent } from "@meridianher/ui/patterns/rich-text-content"

import { useAccount } from "@/components/account-gate"
import { createReply, react, report, setSaved } from "@/lib/actions"

type Post = {
  id: string
  title: string
  body: JSONContent | null
  authorName: string
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
}

function findName(thread: ReplyData[], id: string): string | undefined {
  for (const r of thread) {
    if (r.id === id) return r.author.displayName
    const inner = r.replies ? findName(r.replies, id) : undefined
    if (inner) return inner
  }
}

export function PostView({
  post,
  expertAnswers,
  thread,
  replyCount,
}: {
  post: Post
  expertAnswers: ExpertAnswerData[]
  thread: ReplyData[]
  replyCount: number
}) {
  const { signedIn, requireAccount } = useAccount()
  const [saved, setSavedState] = React.useState(post.saved)
  const [copied, setCopied] = React.useState(false)
  const [replyTo, setReplyTo] = React.useState<string | null>(null)
  const [reportTarget, setReportTarget] = React.useState<{ type: "post" | "reply"; id: string }>({ type: "post", id: post.id })
  const [reporting, setReporting] = React.useState(false)
  const openReport = (type: "post" | "reply", id: string) => {
    setReportTarget({ type, id })
    setReporting(true)
  }
  const composerRef = React.useRef<HTMLDivElement>(null)

  const reactTo = (type: "post" | "reply", id: string) => async (kind: ReactionKind, active: boolean) => {
    if (!requireAccount("react")) return false
    return !(await react(type, id, kind, active)).error
  }

  async function share() {
    const url = window.location.href
    if (navigator.share) return void (await navigator.share({ title: post.title, url }).catch(() => {}))
    await navigator.clipboard.writeText(url).catch(() => window.prompt("Copy this link", url))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

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
            <span className="truncate text-sm font-medium text-foreground">{post.authorName}</span>
            {post.timeAgo}
            {post.edited ? " · edited" : ""}
          </CardDescription>
          {post.asTeam ? <TeamBadge /> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <SpaceChip name={post.space.name} tone={post.space.tone} href={`/s/${post.space.slug}`} />
            {post.tags.map((t) => (
              <TagChip key={t} label={t} />
            ))}
          </div>
          {post.contentWarning ? <ContentWarningBlur type={post.contentWarning}>{body}</ContentWarningBlur> : <div>{body}</div>}
        </CardContent>
        <CardContent className="flex flex-wrap items-center gap-1">
          <ReactionBar counts={post.reactions} mine={post.myReactions} onReact={reactTo("post", post.id)} />
          <span role="status" className="ml-auto text-xs text-muted-foreground">
            {copied ? "Link copied" : null}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={saved}
            aria-label={saved ? "Saved" : "Save"}
            onClick={async () => {
              if (!requireAccount("save this post")) return
              if (!(await setSaved("post", post.id, !saved)).error) setSavedState(!saved)
            }}
          >
            <BookmarkIcon className={saved ? "fill-current text-primary" : undefined} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Share" onClick={share}>
            {copied ? <CheckIcon /> : <Share2Icon />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Report post"
            onClick={() => requireAccount("report this post") && openReport("post", post.id)}
          >
            <FlagIcon />
          </Button>
        </CardContent>
      </Card>

      {expertAnswers.map((a) => (
        <ExpertAnswer key={a.id} answer={a} onReact={reactTo("reply", a.id)} />
      ))}

      <Card render={<section aria-labelledby="replies-title" />}>
        <CardHeader>
          <CardTitle render={<h2 />} id="replies-title" className="flex items-center gap-2 text-h3">
            Replies <Badge variant="secondary">{replyCount}</Badge>
          </CardTitle>
        </CardHeader>
        {thread.length ? (
          <CardContent>
            <ReplyThread
              replies={thread}
              onReact={(id, kind, active) => reactTo("reply", id)(kind, active)}
              onReply={(id) => {
                if (!requireAccount("reply")) return
                setReplyTo(id)
                composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
              }}
              onReport={(id) => requireAccount("report this reply") && openReport("reply", id)}
            />
          </CardContent>
        ) : null}
        <CardContent ref={composerRef}>
          {signedIn ? (
            <ReplyComposer
              replyingTo={replyTo ? findName(thread, replyTo) : undefined}
              onCancelReplyTo={() => setReplyTo(null)}
              disabledReason={post.locked ? "Replies are closed on this post." : undefined}
              onSubmit={async (doc) => {
                const result = await createReply(post.id, replyTo, doc)
                if (!result.error) setReplyTo(null)
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
    </>
  )
}
