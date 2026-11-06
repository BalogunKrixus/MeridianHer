"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Composer, type ComposerSpace } from "@meridianher/ui/patterns/composer"

import { createPost, findSimilar } from "@/lib/actions"

export function AskForm({ spaces, defaultSpace }: { spaces: ComposerSpace[]; defaultSpace?: string }) {
  const router = useRouter()
  const [similar, setSimilar] = React.useState<Awaited<ReturnType<typeof findSimilar>>>([])
  const timer = React.useRef<number>(undefined)

  const lookUp = React.useCallback((title: string) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => setSimilar(await findSimilar(title)), 600)
  }, [])

  return (
    <Composer
      spaces={spaces}
      defaultSpace={defaultSpace}
      draftKey="meridianher:draft:ask"
      onTitleChange={lookUp}
      similar={
        similar.length ? (
          <ul className="space-y-1.5">
            {similar.map((p) => (
              <li key={p.id}>
                <a href={`/p/${p.id}`} target="_blank" rel="noreferrer">
                  {p.title}
                </a>{" "}
                <span className="text-muted-foreground">
                  · {p.replies} {p.replies === 1 ? "reply" : "replies"}
                </span>
              </li>
            ))}
          </ul>
        ) : undefined
      }
      onSubmit={async (values) => {
        const result = await createPost({ ...values, body: values.body })
        if (result.error || !result.id) return { error: result.error ?? "We could not publish your post. Please try again." }
        router.push(`/p/${result.id}?new=1`)
      }}
    />
  )
}
