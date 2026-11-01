"use client"

import * as React from "react"
import { BookmarkIcon, CoffeeIcon } from "lucide-react"

import { Button } from "../components/button"
import { Card, CardContent } from "../components/card"
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
import { Row, Section, Specimen } from "./layout"
import {
  sampleAnnouncement,
  sampleComposerSpaces,
  sampleExpertAnswer,
  samplePosts,
  sampleReplies,
} from "./sample-data"

export function CommunityPatterns() {
  const [signInOpen, setSignInOpen] = React.useState(false)

  return (
    <Section id="community" title="Community patterns" description="Built once in packages/ui and shared. Demo content only.">
      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Badges">
          <Row>
            <ExpertBadge category="Gynaecologist" />
            <ExpertBadge />
            <ExpertBadge ended />
            <TeamBadge />
            <span className="flex items-center gap-1">
              Dr Amaka Obi <VerifiedTick />
            </span>
          </Row>
        </Specimen>
        <Specimen title="Tag chips" note="Link, static and removable. Pressable tags are a chip ToggleGroup.">
          <Row className="gap-2">
            <TagChip label="First period" href="#" />
            <TagChip label="Cravings" />
            <TagChip label="Heavy bleeding" onRemove={() => {}} />
          </Row>
        </Specimen>
      </div>

      <Specimen title="Space chips" note="All ten launch spaces.">
        <Row className="gap-2">
          {LAUNCH_SPACES.map((s) => (
            <SpaceChip key={s.slug} name={s.name} tone={s.tone} icon={s.icon} href="#" />
          ))}
        </Row>
      </Specimen>

      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Initial avatars" note="Space accent tint. Anonymous and team posts use the neutral tint.">
          <Row>
            {LAUNCH_SPACES.slice(0, 6).map((s, i) => (
              <InitialAvatar key={s.slug} name={["Amber", "Quiet", "Golden", "Morning", "Soft", "Bright"][i]} tone={s.tone} />
            ))}
            <InitialAvatar name="Anonymous" />
            <InitialAvatar name="Amaka" size="lg" tone="conditions" />
          </Row>
        </Specimen>
        <Specimen title="Reaction bar">
          <ReactionBar counts={{ hug: 12, same: 30, helpful: 7 }} mine={["same"]} />
        </Specimen>
      </div>

      <Specimen title="Post card" note="Announcement, pinned, expert answered, edited and content warning." bare className="flex max-w-[680px] flex-col gap-4">
        <PostCard post={sampleAnnouncement} variant="announcement" />
        <PostCard post={samplePosts[0]} variant="pinned" />
        {samplePosts.slice(1).map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </Specimen>

      <Specimen
        title="Post page: expert answer and replies"
        note="Expert answer pinned first, then threaded replies two levels deep."
        bare
        className="flex max-w-[680px] flex-col gap-4"
      >
        <ExpertAnswer answer={sampleExpertAnswer} />
        <Card>
          <CardContent>
            <ReplyThread replies={sampleReplies} />
          </CardContent>
        </Card>
      </Specimen>

      <Specimen title="Content warning" note="Blurred, inert and hidden from screen readers until revealed. The warning itself is announced.">
        <ContentWarningBlur type="mental-health">
          <p className="text-body">
            This is the kind of post that would sit behind a mental health warning, so members can choose when they are ready to read it.
          </p>
        </ContentWarningBlur>
      </Specimen>

      <Specimen title="Composer" note="Question or discussion, restricted rich text, tags, content warning, ask an expert, post anonymously." className="max-w-[680px]">
        <Composer
          spaces={sampleComposerSpaces}
          defaultSpace="periods"
          similar={
            <ul className="space-y-1.5">
              <li>
                <a href="#">Is it normal for my period to be two weeks late at 19?</a>
              </li>
              <li>
                <a href="#">Late period after starting university</a>
              </li>
            </ul>
          }
        />
      </Specimen>

      <div className="grid items-start gap-10 lg:grid-cols-2">
        <Specimen title="Sign in sheet" note="Opens only when a visitor tries to act. Bottom sheet on phones.">
          <Button onClick={() => setSignInOpen(true)}>Reply</Button>
          <SignInSheet open={signInOpen} onOpenChange={setSignInOpen} action="reply" />
        </Specimen>
        <Specimen title="Empty states" bare className="flex flex-col gap-4">
          <EmptyState
            icon={CoffeeIcon}
            title="You're all caught up"
            description="That is everything new in your spaces. Come back later, or help someone with an unanswered question."
            action={<Button variant="secondary">See unanswered questions</Button>}
          />
          <EmptyState
            icon={BookmarkIcon}
            title="Nothing saved yet"
            description="Tap the bookmark on any post or reply to keep it here. Only you can see your saved list."
          />
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
