"use client"

import { useRouter } from "next/navigation"
import { Composer, type ComposerSpace } from "@meridianher/ui/patterns/composer"

import { createPost } from "@/lib/actions"

export function AskForm({ spaces, defaultSpace }: { spaces: ComposerSpace[]; defaultSpace?: string }) {
  const router = useRouter()
  return (
    <Composer
      spaces={spaces}
      defaultSpace={defaultSpace}
      draftKey="meridianher:draft:ask"
      onSubmit={async (values) => {
        const result = await createPost({ ...values, body: values.body })
        if (result.error || !result.id) return { error: result.error ?? "We could not publish your post. Please try again." }
        router.push(`/p/${result.id}`)
      }}
    />
  )
}
