"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import {
  BadgeCheckIcon,
  BookmarkIcon,
  FlagIcon,
  HeartHandshakeIcon,
  LinkIcon,
  MessageCircleReplyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu"
import { Separator } from "../components/separator"
import type { SpaceTone } from "../lib/spaces"
import { ExpertBadge, TeamBadge, VerifiedTick } from "./badges"
import { InitialAvatar } from "./chips"
import { ReactionBar, type ReactionKind } from "./reaction-bar"

export const EXPERT_DISCLAIMER =
  "This is general education from a verified expert, not a diagnosis. If you are worried, speak to a doctor who can examine you."

export type ExpertAnswerData = {
  id: string
  expert: { name: string; title: string; specialty: string; href?: string }
  body: React.ReactNode
  timeAgo: string
  reactions: Record<ReactionKind, number>
  myReactions?: ReactionKind[]
}

/** Pinned under the post when an expert has answered (PRD 6.6). Disclaimer is always attached. */
function ExpertAnswer({
  answer,
  onReact,
  menu,
  className,
}: {
  answer: ExpertAnswerData
  onReact?: (kind: ReactionKind, active: boolean) => void | boolean | Promise<void | boolean>
  /** Overflow actions, for example the same ReplyMenu used in the thread */
  menu?: React.ReactNode
  className?: string
}) {
  const nameEl = answer.expert.href ? (
    <a href={answer.expert.href} className="relative tap-target underline-offset-4 hover:underline">
      {answer.expert.name}
    </a>
  ) : (
    answer.expert.name
  )
  return (
    <Card
      render={<section id={`reply-${answer.id}`} aria-label={`Expert answer from ${answer.expert.name}`} />}
      variant="flat"
      className={cn("scroll-mt-20 bg-expert-soft", className)}
    >
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <ExpertBadge category={answer.expert.specialty} />
          {menu}
        </div>
        <div className="flex items-center gap-2.5">
          <InitialAvatar name={answer.expert.name} />
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-1 text-sm">
              {nameEl}
              <VerifiedTick />
            </CardTitle>
            <CardDescription>
              {answer.expert.title} · {answer.timeAgo}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-body">{answer.body}</CardContent>
      <CardContent className="space-y-3">
        <Separator className="bg-expert/20" />
        <p className="text-small text-muted-foreground">{EXPERT_DISCLAIMER}</p>
        <ReactionBar counts={answer.reactions} mine={answer.myReactions} size="sm" onReact={onReact} />
      </CardContent>
    </Card>
  )
}

export type ReplyData = {
  id: string
  author: { displayName: string; tone?: SpaceTone; anonymous?: boolean; asTeam?: boolean }
  body: React.ReactNode
  timeAgo: string
  reactions: Record<ReactionKind, number>
  myReactions?: ReactionKind[]
  expertCategory?: string
  expertEnded?: boolean
  helpedMe?: boolean
  removed?: { reason?: string }
  /** Written by the viewer: shows edit and delete instead of report */
  mine?: boolean
  /** Still inside the 24 hour edit window */
  editable?: boolean
  saved?: boolean
  /** Her own expert reply, which she can mark as the expert answer */
  canMarkExpertAnswer?: boolean
  /** Replaces the body while she edits it */
  editor?: React.ReactNode
  replies?: ReplyData[]
}

type ReplyHandlers = {
  onReply?: (id: string) => void
  onReport?: (id: string) => void
  onReact?: (id: string, kind: ReactionKind, active: boolean) => void | boolean | Promise<void | boolean>
  onSave?: (id: string, saved: boolean) => void
  onCopyLink?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onMarkExpertAnswer?: (id: string) => void
  /** Present only for the person who asked: lets her mark one reply as Helped me */
  onHelped?: (id: string, helped: boolean) => void
}

/** Save, copy link, edit, delete and report for one reply, in one calm overflow menu. */
function ReplyMenu({
  reply,
  onSave,
  onCopyLink,
  onEdit,
  onDelete,
  onReport,
  onMarkExpertAnswer,
  markExpertLabel = "Mark as expert answer",
}: Omit<ReplyHandlers, "onReply" | "onReact" | "onHelped"> & {
  reply: Pick<ReplyData, "id" | "mine" | "editable" | "saved" | "canMarkExpertAnswer">
  markExpertLabel?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More options for this reply" />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {onSave ? (
          <DropdownMenuItem onClick={() => onSave(reply.id, !reply.saved)}>
            <BookmarkIcon /> {reply.saved ? "Remove from saved" : "Save reply"}
          </DropdownMenuItem>
        ) : null}
        {onCopyLink ? (
          <DropdownMenuItem onClick={() => onCopyLink(reply.id)}>
            <LinkIcon /> Copy link
          </DropdownMenuItem>
        ) : null}
        {reply.canMarkExpertAnswer && onMarkExpertAnswer ? (
          <DropdownMenuItem onClick={() => onMarkExpertAnswer(reply.id)}>
            <BadgeCheckIcon /> {markExpertLabel}
          </DropdownMenuItem>
        ) : null}
        {reply.mine ? (
          <>
            <DropdownMenuSeparator />
            {reply.editable && onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(reply.id)}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(reply.id)}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            ) : null}
          </>
        ) : onReport ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onReport(reply.id)}>
              <FlagIcon /> Report
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ReplyItem({ reply, depth, ...handlers }: ReplyHandlers & { reply: ReplyData; depth: 0 | 1 }) {
  const { onReply, onReact, onHelped } = handlers
  const name = reply.author.asTeam
    ? "MeridianHer Team"
    : reply.author.anonymous
      ? "Anonymous member"
      : reply.author.displayName
  const children =
    depth === 0 && reply.replies?.length ? (
      <ul className="mt-1 border-l-2 border-border pl-4">
        {reply.replies.map((child) => (
          <ReplyItem key={child.id} reply={child} depth={1} {...handlers} />
        ))}
      </ul>
    ) : null

  if (reply.removed) {
    return (
      <li id={`reply-${reply.id}`} className="scroll-mt-20 py-3 text-sm text-muted-foreground italic">
        This reply was removed{reply.removed.reason ? ` (${reply.removed.reason})` : ""}.
        {children}
      </li>
    )
  }

  return (
    <li id={`reply-${reply.id}`} className="scroll-mt-20 py-3">
      <article aria-label={`Reply from ${name}`} className="flex gap-3">
        <InitialAvatar name={name} tone={reply.author.tone} size={depth ? "sm" : "default"} />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-foreground">{name}</span>
            <span className="text-xs text-muted-foreground">{reply.timeAgo}</span>
            {reply.expertCategory ? <ExpertBadge category={reply.expertCategory} ended={reply.expertEnded} /> : null}
            {reply.author.asTeam ? <TeamBadge /> : null}
            {reply.helpedMe ? (
              <Badge variant="soft">
                <HeartHandshakeIcon data-icon="inline-start" aria-hidden />
                Helped me
              </Badge>
            ) : null}
          </header>
          {reply.editor ?? <div className="mt-1.5 text-body text-foreground">{reply.body}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <ReactionBar
              counts={reply.reactions}
              mine={reply.myReactions}
              size="sm"
              onReact={onReact ? (kind, active) => onReact(reply.id, kind, active) : undefined}
            />
            {depth === 0 && onReply ? (
              <Button variant="ghost" size="sm" onClick={() => onReply(reply.id)}>
                <MessageCircleReplyIcon data-icon="inline-start" aria-hidden />
                Reply
              </Button>
            ) : null}
            {onHelped && !reply.mine && !reply.author.asTeam ? (
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={!!reply.helpedMe}
                onClick={() => onHelped(reply.id, !reply.helpedMe)}
                className="aria-pressed:text-primary"
              >
                <HeartHandshakeIcon data-icon="inline-start" aria-hidden />
                {reply.helpedMe ? "You marked this" : "This helped me"}
              </Button>
            ) : null}
            {handlers.onSave || handlers.onCopyLink || handlers.onReport || (reply.mine && handlers.onDelete) ? (
              <span className="ml-auto">
                <ReplyMenu reply={reply} {...handlers} />
              </span>
            ) : null}
          </div>
          {children}
        </div>
      </article>
    </li>
  )
}

/** Threaded replies, two levels deep (PRD 6.6). */
function ReplyThread({
  replies,
  className,
  ...handlers
}: ReplyHandlers & {
  replies: ReplyData[]
  className?: string
}) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {replies.map((r) => (
        <ReplyItem key={r.id} reply={r} depth={0} {...handlers} />
      ))}
    </ul>
  )
}

export { ExpertAnswer, ReplyMenu, ReplyThread }
