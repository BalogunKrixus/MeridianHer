"use client"

import * as React from "react"
import { cn } from "cn"
import { FlagIcon, HeartHandshakeIcon, MessageCircleReplyIcon } from "lucide-react"

import { Badge } from "../components/badge"
import { Button } from "../components/button"
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
}

/** Pinned under the post when an expert has answered (PRD 6.6). Disclaimer is always attached. */
function ExpertAnswer({ answer, className }: { answer: ExpertAnswerData; className?: string }) {
  const nameEl = answer.expert.href ? (
    <a href={answer.expert.href} className="relative tap-target font-medium text-foreground underline-offset-4 hover:underline">
      {answer.expert.name}
    </a>
  ) : (
    <span className="font-medium text-foreground">{answer.expert.name}</span>
  )
  return (
    <section
      aria-label={`Expert answer from ${answer.expert.name}`}
      className={cn("rounded-xl bg-expert-soft p-4 sm:p-5", className)}
    >
      <ExpertBadge category={answer.expert.specialty} />
      <div className="mt-3 flex items-center gap-2.5">
        <InitialAvatar name={answer.expert.name} />
        <div className="min-w-0 text-sm">
          <p className="flex items-center gap-1">
            {nameEl}
            <VerifiedTick />
          </p>
          <p className="text-muted-foreground">
            {answer.expert.title} · {answer.timeAgo}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-3 text-body text-foreground">{answer.body}</div>
      <p className="mt-4 border-t border-expert/20 pt-3 text-small text-muted-foreground">{EXPERT_DISCLAIMER}</p>
      <ReactionBar className="mt-3" counts={answer.reactions} size="sm" />
    </section>
  )
}

export type ReplyData = {
  id: string
  author: { displayName: string; tone?: SpaceTone; anonymous?: boolean; asTeam?: boolean }
  body: React.ReactNode
  timeAgo: string
  reactions: Record<ReactionKind, number>
  expertCategory?: string
  helpedMe?: boolean
  removed?: { reason: string }
  replies?: ReplyData[]
}

function ReplyItem({
  reply,
  depth,
  onReply,
  onReport,
}: {
  reply: ReplyData
  depth: 0 | 1
  onReply?: (id: string) => void
  onReport?: (id: string) => void
}) {
  const name = reply.author.asTeam
    ? "MeridianHer Team"
    : reply.author.anonymous
      ? "Anonymous member"
      : reply.author.displayName

  if (reply.removed) {
    return (
      <li className="py-3 text-sm text-muted-foreground italic">
        This reply was removed ({reply.removed.reason}).
      </li>
    )
  }

  return (
    <li className="py-3">
      <article aria-label={`Reply from ${name}`} className="flex gap-3">
        <InitialAvatar name={name} tone={reply.author.tone} size={depth ? "sm" : "default"} />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-foreground">{name}</span>
            <span className="text-xs text-muted-foreground">{reply.timeAgo}</span>
            {reply.expertCategory ? <ExpertBadge category={reply.expertCategory} /> : null}
            {reply.author.asTeam ? <TeamBadge /> : null}
            {reply.helpedMe ? (
              <Badge variant="soft">
                <HeartHandshakeIcon data-icon="inline-start" aria-hidden />
                Helped me
              </Badge>
            ) : null}
          </header>
          <div className="mt-1.5 space-y-2 text-body text-foreground">{reply.body}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <ReactionBar counts={reply.reactions} size="sm" />
            {depth === 0 ? (
              <Button variant="ghost" size="sm" onClick={() => onReply?.(reply.id)}>
                <MessageCircleReplyIcon data-icon="inline-start" aria-hidden />
                Reply
              </Button>
            ) : null}
            <Button variant="ghost" size="icon-sm" aria-label="Report reply" onClick={() => onReport?.(reply.id)}>
              <FlagIcon />
            </Button>
          </div>
          {depth === 0 && reply.replies?.length ? (
            <ul className="mt-1 border-l-2 border-border pl-4">
              {reply.replies.map((child) => (
                <ReplyItem key={child.id} reply={child} depth={1} onReply={onReply} onReport={onReport} />
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </li>
  )
}

/** Threaded replies, two levels deep (PRD 6.6). */
function ReplyThread({
  replies,
  onReply,
  onReport,
  className,
}: {
  replies: ReplyData[]
  onReply?: (id: string) => void
  onReport?: (id: string) => void
  className?: string
}) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {replies.map((r) => (
        <ReplyItem key={r.id} reply={r} depth={0} onReply={onReply} onReport={onReport} />
      ))}
    </ul>
  )
}

export { ExpertAnswer, ReplyThread }
