import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { after } from "next/server"
import { AwardIcon, BadgeCheckIcon, BellIcon, HeartHandshakeIcon, MessageCircleIcon, ShieldIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent } from "@meridianher/ui/components/card"
import { EmptyState } from "@meridianher/ui/patterns/cards"
import { createClient } from "@meridianher/db/server"

import { getViewer } from "@/lib/data"
import { notificationText, timeAgo } from "@/lib/format"

export const metadata: Metadata = { title: "Notifications" }

const ICONS: Record<string, typeof BellIcon> = {
  reply_to_post: MessageCircleIcon,
  reply_to_reply: MessageCircleIcon,
  followed_post_reply: MessageCircleIcon,
  expert_answered: BadgeCheckIcon,
  helped_me: HeartHandshakeIcon,
  moderation: ShieldIcon,
  expert_application: AwardIcon,
}

function hrefFor(kind: string, payload: Record<string, unknown>) {
  if (kind === "expert_application") return payload.status === "approved" ? "/experts/inbox" : "/experts/apply"
  if (typeof payload.post_id === "string") return `/p/${payload.post_id}${typeof payload.reply_id === "string" ? `#reply-${payload.reply_id}` : ""}`
  // Warnings, mutes and bans: where she can read the reason and appeal
  if (kind === "moderation") return "/settings#standing"
  return "/guidelines"
}

export default async function NotificationsPage() {
  const viewer = await getViewer()
  if (!viewer?.onboarding_complete) redirect("/sign-in?next=/notifications")
  const supabase = await createClient()
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, payload, read_at, created_at")
    .eq("user_id", viewer.user_id)
    .order("created_at", { ascending: false })
    .limit(50)
  const items = data ?? []
  // Opening the page counts as reading: the dots show for this visit, the badge clears on the next page
  if (items.some((n) => !n.read_at)) {
    after(async () => {
      await supabase.rpc("mark_notifications_read")
    })
  }

  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-h1">Notifications</h1>
        <ButtonLink variant="ghost" size="sm" href="/settings#notifications">
          Settings
        </ButtonLink>
      </header>
      {items.length ? (
        <Card>
          <CardContent className="px-1.5">
            <ul className="flex flex-col">
              {items.map((n) => {
                const payload = (n.payload ?? {}) as Record<string, unknown>
                const Icon = ICONS[n.kind] ?? BellIcon
                const reason = n.kind === "moderation" && typeof payload.reason === "string" ? payload.reason : null
                return (
                  <li key={n.id}>
                    <ButtonLink
                      variant="ghost"
                      href={hrefFor(n.kind, payload)}
                      className="h-auto w-full items-start justify-start gap-3 py-3 text-left whitespace-normal"
                    >
                      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={n.read_at ? "font-normal" : "font-semibold"}>{notificationText(n.kind, payload)}</span>
                        {reason ? <span className="text-small text-muted-foreground">Reason: {reason}</span> : null}
                        <span className="text-xs font-normal text-muted-foreground">{timeAgo(n.created_at)}</span>
                      </span>
                      {n.read_at ? null : <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </ButtonLink>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={BellIcon}
          title="No notifications yet"
          description="When someone replies to you, or an expert answers your question, you will see it here."
          action={<ButtonLink href="/?sort=unanswered">Help answer a question</ButtonLink>}
        />
      )}
    </main>
  )
}
