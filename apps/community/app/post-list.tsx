import { MessageCircleQuestionIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import type { PostCardData } from "@meridianher/ui/patterns/post-card"

import { FeedPostCard } from "./feed-post-card"

/** A feed of post cards with a designed empty state and "Show more" (PRD 6.3 and 6.10). */
export function PostList({
  posts,
  moreHref,
  empty,
}: {
  posts: PostCardData[]
  moreHref: string | null
  empty: { title: string; description: string; action?: { label: string; href: string } }
}) {
  if (!posts.length) {
    return (
      <EmptyState
        className="flex-none"
        icon={MessageCircleQuestionIcon}
        title={empty.title}
        description={empty.description}
        action={empty.action ? <ButtonLink href={empty.action.href}>{empty.action.label}</ButtonLink> : undefined}
      />
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {posts.map((p) => (
        <FeedPostCard key={p.id} post={p} />
      ))}
      {moreHref ? (
        <ButtonLink variant="outline" className="self-center" href={moreHref}>
          Show more
        </ButtonLink>
      ) : (
        <p className="text-center text-small text-muted-foreground">You're all caught up.</p>
      )}
    </div>
  )
}
