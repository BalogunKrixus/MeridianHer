"use client"

import * as React from "react"
import { PostCard, type PostCardData } from "@meridianher/ui/patterns/post-card"
import { ReportSheet } from "@meridianher/ui/patterns/report-sheet"

import { useAccount } from "@/components/account-gate"
import { report, setSaved } from "@/lib/actions"

export function FeedPostCard({ post, variant }: { post: PostCardData; variant?: "pinned" | "announcement" }) {
  const { requireAccount } = useAccount()
  const [reporting, setReporting] = React.useState(false)
  return (
    <>
      <PostCard
        post={post}
        variant={variant}
        onSave={async (saved) => {
          if (!requireAccount("save this post")) return false
          return !(await setSaved("post", post.id, saved)).error
        }}
        onReport={() => requireAccount("report this post") && setReporting(true)}
      />
      <ReportSheet
        open={reporting}
        onOpenChange={setReporting}
        target="post"
        onSubmit={(reason, note) => report({ type: "post", id: post.id, reason, note })}
      />
    </>
  )
}
