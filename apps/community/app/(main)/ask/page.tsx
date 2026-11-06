import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import type { SpaceTone } from "@meridianher/ui/lib/spaces"

import { getSpaces, getViewer } from "@/lib/data"
import { AskForm } from "./ask-form"

export const metadata: Metadata = { title: "Ask a question" }

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const params = await searchParams
  const space = typeof params.space === "string" ? params.space : undefined
  const viewer = await getViewer()
  if (!viewer?.onboarding_complete) redirect(`/sign-in?next=${encodeURIComponent(space ? `/ask?space=${space}` : "/ask")}`)

  const spaces = await getSpaces()
  return (
    <main className="mx-auto max-w-[680px] px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle render={<h1 />} className="text-h1">
            Ask your question
          </CardTitle>
          <CardDescription className="text-body">
            Say the real words. Members who have been there, and verified experts, will answer. You can post anonymously.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AskForm
            defaultSpace={spaces.some((s) => s.slug === space) ? space : undefined}
            spaces={spaces.map((s) => ({
              slug: s.slug,
              name: s.name,
              tone: s.accent_color as SpaceTone,
              tags: s.tags,
              askExpertEnabled: s.ask_expert_enabled,
            }))}
          />
        </CardContent>
      </Card>
    </main>
  )
}
