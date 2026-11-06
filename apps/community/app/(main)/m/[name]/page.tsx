import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EyeOffIcon, MessageCircleQuestionIcon, SettingsIcon } from "lucide-react"
import { Alert, AlertDescription } from "@meridianher/ui/components/alert"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import type { SpaceTone } from "@meridianher/ui/lib/spaces"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { InitialAvatar, SpaceChip } from "@meridianher/ui/patterns/chips"
import { createClient } from "@meridianher/db/server"

import { getViewer, toPostCard } from "@/lib/data"
import { FeedPostCard } from "@/components/feed-post-card"
import { ReportProfile } from "./report-profile"

async function loadProfile(name: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("public_profiles").select("*").eq("display_name", decodeURIComponent(name)).maybeSingle()
  return data
}

export async function generateMetadata({ params }: PageProps<"/m/[name]">): Promise<Metadata> {
  const profile = await loadProfile((await params).name)
  // Member profiles are for the community, not for search engines
  return { title: profile?.display_name ?? "Member", robots: { index: false } }
}

export default async function MemberPage({ params }: PageProps<"/m/[name]">) {
  const profile = await loadProfile((await params).name)
  if (!profile?.user_id) notFound()
  const supabase = await createClient()
  const viewer = await getViewer()
  const isMe = viewer?.user_id === profile.user_id

  const { data: rows } = profile.hide_activity
    ? { data: [] }
    : await supabase.from("feed_posts").select("*").eq("author_user_id", profile.user_id).order("created_at", { ascending: false }).limit(20)
  const posts = (rows ?? []).map((r) => toPostCard(r, new Set()))
  const spaces = [...new Map((rows ?? []).map((r) => [r.space_slug, { slug: r.space_slug!, name: r.space_name!, tone: r.space_tone as SpaceTone }])).values()]
  const joined = profile.joined_month
    ? new Date(profile.joined_month).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      {isMe ? (
        <Alert>
          <EyeOffIcon aria-hidden />
          <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-2 text-foreground">
            This is how other members see you. Your age, email and Google name are never shown.
            <ButtonLink variant="link" size="sm" className="px-0" href="/settings">
              <SettingsIcon data-icon="inline-start" aria-hidden />
              Privacy settings
            </ButtonLink>
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader className="flex items-center gap-4">
          <InitialAvatar name={profile.display_name!} size="lg" tone={spaces[0]?.tone} />
          <div className="min-w-0 flex-1">
            <CardTitle render={<h1 />} className="text-h1">
              {profile.display_name}
            </CardTitle>
            {joined ? <CardDescription>Member since {joined}</CardDescription> : null}
          </div>
          {!isMe ? <ReportProfile userId={profile.user_id} /> : null}
        </CardHeader>
        {spaces.length ? (
          <CardContent className="flex flex-wrap gap-1.5">
            {spaces.map((s) => (
              <SpaceChip key={s.slug} name={s.name} tone={s.tone} href={`/s/${s.slug}`} />
            ))}
          </CardContent>
        ) : null}
      </Card>

      {profile.hide_activity ? (
        <EmptyState
          icon={EyeOffIcon}
          title={isMe ? "Your activity is hidden" : "Activity is private"}
          description={
            isMe
              ? "Your posts are still in their spaces, but they are not listed here. You can change this in settings."
              : `${profile.display_name} keeps their posts off their profile. You will still find them in the spaces.`
          }
        />
      ) : posts.length ? (
        <section aria-labelledby="member-posts" className="flex flex-col gap-4">
          <h2 id="member-posts" className="text-h3">
            Posts
          </h2>
          {posts.map((p) => (
            <FeedPostCard key={p.id} post={p} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={MessageCircleQuestionIcon}
          title={isMe ? "You have not posted yet" : "No public posts yet"}
          description={isMe ? "Anonymous posts never appear here. Ask your first question whenever you are ready." : "Posts made anonymously never appear on a profile."}
          action={isMe ? <ButtonLink href="/ask">Ask a question</ButtonLink> : undefined}
        />
      )}
    </main>
  )
}
