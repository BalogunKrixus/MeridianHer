"use client"

import * as React from "react"
import { BookmarkIcon, CoffeeIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "../components/button"
import { LAUNCH_SPACES } from "../lib/spaces"
import { ExpertBadge, TeamBadge, VerifiedTick } from "../patterns/badges"
import { CrisisCard, EmptyState, GuidelinesCard } from "../patterns/cards"
import { InitialAvatar, SpaceChip, TagChip } from "../patterns/chips"
import { Composer } from "../patterns/composer"
import { ContentWarningBlur } from "../patterns/content-warning-blur"
import { PostCard } from "../patterns/post-card"
import { ReactionBar } from "../patterns/reaction-bar"
import { ExpertAnswer, ReplyThread } from "../patterns/reply-thread"
import { SignInSheet } from "../patterns/sign-in-sheet"
import { Label, Row, Section, Specimen } from "./layout"
import {
  sampleAnnouncement,
  sampleComposerSpaces,
  sampleExpertAnswer,
  samplePosts,
  sampleReplies,
} from "./sample-data"

export function CommunityPatterns() {
  const [signInOpen, setSignInOpen] = React.useState(false)
  const [chips, setChips] = React.useState<string[]>(["Period pain"])
  const [submitting, setSubmitting] = React.useState(false)

  return (
    <Section
      id="community"
      title="Community patterns"
      description="Built once in packages/ui and shared. Demo content only."
    >
      <Specimen title="Badges, chips and avatars" bare>
        <div className="space-y-5 rounded-xl bg-card p-5 shadow-soft">
          <div>
            <Label>Badges</Label>
            <Row>
              <ExpertBadge category="Gynaecologist" />
              <ExpertBadge />
              <ExpertBadge ended />
              <TeamBadge />
              <span className="flex items-center gap-1 text-sm">Dr Amaka Obi <VerifiedTick /></span>
            </Row>
          </div>
          <div>
            <Label>Space chips, all ten launch spaces</Label>
            <Row className="gap-2">
              {LAUNCH_SPACES.map((s) => (
                <SpaceChip key={s.slug} name={s.name} tone={s.tone} icon={s.icon} href="#" />
              ))}
            </Row>
          </div>
          <div>
            <Label>Tag chips: link, filter, removable</Label>
            <Row className="gap-2">
              <TagChip label="First period" href="#" />
              {["Cravings", "Period pain", "First period"].map((t) => (
                <TagChip
                  key={t}
                  label={t}
                  pressed={chips.includes(t)}
                  onPressedChange={(p) => setChips((c) => (p ? [...c, t] : c.filter((x) => x !== t)))}
                />
              ))}
              <TagChip label="Heavy bleeding" onRemove={() => toast("Filter removed")} />
            </Row>
          </div>
          <div>
            <Label>Initial avatars in space accents</Label>
            <Row>
              {LAUNCH_SPACES.slice(0, 6).map((s, i) => (
                <InitialAvatar key={s.slug} name={["Amber", "Quiet", "Golden", "Morning", "Soft", "Bright"][i]} tone={s.tone} />
              ))}
              <InitialAvatar name="Anonymous" />
              <InitialAvatar name="Amaka" size="lg" tone="conditions" />
            </Row>
          </div>
          <div>
            <Label>Reaction bar</Label>
            <ReactionBar counts={{ hug: 12, same: 30, helpful: 7 }} mine={["same"]} />
          </div>
        </div>
      </Specimen>

      <Specimen title="Post card" note="Default with expert answer, edited, content warning, team announcement and pinned." bare>
        <div className="mx-auto flex max-w-[680px] flex-col gap-4">
          <PostCard post={sampleAnnouncement} variant="announcement" />
          <PostCard post={samplePosts[0]} variant="pinned" onReport={() => toast("Report sheet opens here")} />
          {samplePosts.slice(1).map((p) => (
            <PostCard key={p.id} post={p} onCopyLink={() => toast.success("Link copied")} />
          ))}
        </div>
      </Specimen>

      <Specimen title="Post page: expert answer and replies" note="Expert answer pinned first, then threaded replies two levels deep." bare>
        <div className="mx-auto flex max-w-[680px] flex-col gap-4">
          <ExpertAnswer answer={sampleExpertAnswer} />
          <div className="rounded-xl bg-card px-5 shadow-soft">
            <ReplyThread replies={sampleReplies} />
          </div>
          <p className="text-center text-small text-muted-foreground">
            Community answers share experience, not diagnosis. If you are worried, speak to a doctor.
          </p>
        </div>
      </Specimen>

      <Specimen title="Content warning" note="Blurred, inert and hidden from screen readers until revealed. The warning itself is announced.">
        <ContentWarningBlur type="mental-health">
          <p className="text-body">
            This is the kind of post that would sit behind a mental health warning, so members can choose when they are ready to read it.
          </p>
        </ContentWarningBlur>
      </Specimen>

      <Specimen title="Composer" note="Question or discussion, restricted rich text, tags, content warning, ask an expert, post anonymously." bare>
        <div className="mx-auto max-w-[680px] rounded-xl bg-card p-5 shadow-soft sm:p-6">
          <h3 className="mb-6 text-h2">Ask your question</h3>
          <Composer
            spaces={sampleComposerSpaces}
            defaultSpace="periods"
            submitting={submitting}
            similar={
              <ul className="space-y-1.5">
                <li><a href="#" className="text-primary underline-offset-4 hover:underline">Is it normal for my period to be two weeks late at 19?</a></li>
                <li><a href="#" className="text-primary underline-offset-4 hover:underline">Late period after starting university</a></li>
              </ul>
            }
            onSubmit={() => {
              setSubmitting(true)
              setTimeout(() => {
                setSubmitting(false)
                toast("Your post is being checked and will appear shortly")
              }, 1200)
            }}
          />
        </div>
      </Specimen>

      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Sign in sheet" note="Opens only when a visitor tries to act. Bottom sheet on phones.">
          <Button onClick={() => setSignInOpen(true)}>Reply</Button>
          <SignInSheet
            open={signInOpen}
            onOpenChange={setSignInOpen}
            action="reply"
            onGoogle={() => toast("Google sign in starts here")}
            onEmail={() => new Promise((r) => setTimeout(r, 800))}
          />
        </Specimen>
        <Specimen title="Empty states" bare>
          <div className="flex flex-col gap-4">
            <EmptyState icon={CoffeeIcon} title="You're all caught up" description="That is everything new in your spaces. Come back later, or help someone with an unanswered question." action={<Button variant="secondary">See unanswered questions</Button>} />
            <EmptyState icon={BookmarkIcon} title="Nothing saved yet" description="Tap the bookmark on any post or reply to keep it here. Only you can see your saved list." />
          </div>
        </Specimen>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Guidelines card" bare>
          <GuidelinesCard />
        </Specimen>
        <Specimen title="Crisis card" note="Always visible in Mental health and Postpartum. Admin editable per country." bare>
          <CrisisCard compact />
        </Specimen>
      </div>
    </Section>
  )
}
