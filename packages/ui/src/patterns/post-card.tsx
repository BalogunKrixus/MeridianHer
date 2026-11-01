"use client"

import * as React from "react"
import { cn } from "cn"
import {
  BookmarkIcon,
  EllipsisIcon,
  EyeOffIcon,
  FlagIcon,
  HeartIcon,
  LinkIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  PinIcon,
  Share2Icon,
} from "lucide-react"

import { Button } from "../components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu"
import type { SpaceTone } from "../lib/spaces"
import { ExpertBadge, TeamBadge } from "./badges"
import { InitialAvatar, SpaceChip, TagChip } from "./chips"
import { ContentWarningBlur, type ContentWarningType } from "./content-warning-blur"

export type PostCardData = {
  id: string
  href: string
  title: string
  excerpt?: string
  author: { displayName: string; anonymous?: boolean; asTeam?: boolean }
  space: { name: string; tone: SpaceTone; href?: string }
  tag?: { label: string; href?: string }
  timeAgo: string
  edited?: boolean
  replyCount: number
  reactionCount: number
  expertAnswer?: { category: string }
  contentWarning?: ContentWarningType
  saved?: boolean
}

/** Feed card, PRD section 6.4. */
function PostCard({
  post,
  variant = "default",
  onSave,
  onShare,
  onReport,
  onHide,
  onCopyLink,
  className,
}: {
  post: PostCardData
  variant?: "default" | "pinned" | "announcement"
  onSave?: (saved: boolean) => void
  onShare?: () => void
  onReport?: () => void
  onHide?: () => void
  onCopyLink?: () => void
  className?: string
}) {
  const [saved, setSaved] = React.useState(!!post.saved)
  const name = post.author.asTeam
    ? "MeridianHer Team"
    : post.author.anonymous
      ? "Anonymous member"
      : post.author.displayName
  const titleId = `post-${post.id}-title`

  const body = (
    <>
      <h3 id={titleId} className="font-heading text-lg leading-snug font-semibold text-foreground text-pretty">
        <a href={post.href} className="after:absolute after:inset-0 focus-visible:outline-none">
          {post.title}
        </a>
      </h3>
      {post.excerpt ? (
        <p className="mt-1.5 line-clamp-3 text-body text-muted-foreground">{post.excerpt}</p>
      ) : null}
    </>
  )

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "group/post relative flex flex-col gap-3 rounded-xl bg-card p-4 text-card-foreground shadow-soft transition-shadow focus-within:ring-3 focus-within:ring-ring sm:p-5",
        variant === "announcement" && "bg-secondary",
        variant === "pinned" && "ring-1 ring-primary/20",
        className
      )}
    >
      {variant !== "default" ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-secondary-foreground">
          {variant === "pinned" ? <PinIcon className="size-3.5" aria-hidden /> : <MegaphoneIcon className="size-3.5" aria-hidden />}
          {variant === "pinned" ? "Pinned" : "Announcement"}
        </p>
      ) : null}

      <header className="flex items-center gap-2.5">
        <InitialAvatar name={name} tone={post.author.anonymous || post.author.asTeam ? undefined : post.space.tone} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">
            {post.timeAgo}
            {post.edited ? " · edited" : ""}
          </span>
        </div>
      </header>

      <div className="relative z-10 flex flex-wrap items-center gap-1.5">
        <SpaceChip name={post.space.name} tone={post.space.tone} href={post.space.href} />
        {post.tag ? <TagChip label={post.tag.label} href={post.tag.href} /> : null}
      </div>

      {post.contentWarning ? (
        <ContentWarningBlur type={post.contentWarning} className="relative z-10">
          {body}
        </ContentWarningBlur>
      ) : (
        <div>{body}</div>
      )}

      {post.expertAnswer || post.author.asTeam ? (
        <div className="flex flex-wrap gap-1.5">
          {post.expertAnswer ? <ExpertBadge category={post.expertAnswer.category} /> : null}
          {post.author.asTeam ? <TeamBadge /> : null}
        </div>
      ) : null}

      <footer className="relative z-10 -mx-2 -mb-2 flex items-center gap-1 text-muted-foreground">
        <span className="inline-flex h-8 items-center gap-1.5 px-2 text-sm tabular-nums">
          <HeartIcon className="size-4" aria-hidden />
          {post.reactionCount}
          <span className="sr-only">reactions</span>
        </span>
        <span className="inline-flex h-8 items-center gap-1.5 px-2 text-sm tabular-nums">
          <MessageCircleIcon className="size-4" aria-hidden />
          {post.replyCount}
          <span className="sr-only">{post.replyCount === 1 ? "reply" : "replies"}</span>
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={saved}
            aria-label={saved ? "Saved" : "Save"}
            onClick={() => {
              setSaved(!saved)
              onSave?.(!saved)
            }}
          >
            <BookmarkIcon className={cn(saved && "fill-current text-primary")} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Share" onClick={onShare}>
            <Share2Icon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More actions" />}>
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onCopyLink}>
                <LinkIcon /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onHide}>
                <EyeOffIcon /> Hide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onReport}>
                <FlagIcon /> Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </footer>
    </article>
  )
}

export { PostCard }
