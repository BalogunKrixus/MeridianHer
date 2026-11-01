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

import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { Card, CardContent, CardDescription, CardHeader } from "../components/card"
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
      <h3 id={titleId} className="text-lg leading-snug font-semibold tracking-tight text-pretty">
        <a href={post.href} className="after:absolute after:inset-0 focus-visible:outline-none">
          {post.title}
        </a>
      </h3>
      {post.excerpt ? <p className="mt-1.5 line-clamp-3 text-body text-muted-foreground">{post.excerpt}</p> : null}
    </>
  )

  return (
    <Card
      render={<article aria-labelledby={titleId} />}
      variant={variant === "announcement" ? "flat" : "default"}
      className={cn(
        "relative focus-within:ring-3 focus-within:ring-ring",
        variant === "announcement" && "bg-secondary",
        variant === "pinned" && "ring-1 ring-primary/20",
        className
      )}
    >
      <CardHeader className="flex items-center gap-2.5">
        <InitialAvatar name={name} tone={post.author.anonymous || post.author.asTeam ? undefined : post.space.tone} />
        <CardDescription className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-xs">
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
          {post.timeAgo}
          {post.edited ? " · edited" : ""}
        </CardDescription>
        {variant !== "default" ? (
          <Badge variant="soft">
            {variant === "pinned" ? <PinIcon data-icon="inline-start" aria-hidden /> : <MegaphoneIcon data-icon="inline-start" aria-hidden />}
            {variant === "pinned" ? "Pinned" : "Announcement"}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="relative z-10 flex flex-wrap gap-1.5">
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
      </CardContent>

      <CardContent className="relative z-10 -mb-2 flex items-center gap-3 px-2 text-sm text-muted-foreground tabular-nums">
        <span className="flex items-center gap-1.5 px-2">
          <HeartIcon className="size-4" aria-hidden />
          {post.reactionCount}
          <span className="sr-only">reactions</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircleIcon className="size-4" aria-hidden />
          {post.replyCount}
          <span className="sr-only">{post.replyCount === 1 ? "reply" : "replies"}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
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
      </CardContent>
    </Card>
  )
}

export { PostCard }
