# MeridianHer Community PRD

Nov 1, 2026 · @Balogun Christopher

MeridianHer Community is a standalone, responsive web app where women talk openly about every chapter of their health, from first periods to menopause, and get real answers from verified experts. It ships with a separate admin platform for running the community. Both apps share one backend and one design system built from our shadcn/ui project. CyclePlate is the first space inside the community, not its owner.

## 1. Vision and goals

We are building the place a woman goes when she has a question about her body that she has never felt able to ask out loud. It should feel like the most knowledgeable, kindest group chat she has ever been in, moderated like a clinic waiting room and designed like a premium editorial product.

### The problem

- Women learn about their own bodies late, alone and through guesswork. Periods, fertility, pregnancy loss, postpartum recovery, painful sex, menopause and conditions like PCOS and endometriosis are still whispered about.
- Existing spaces fail in one of three ways: they are open forums full of misinformation and selling (Facebook groups, Reddit threads), they are clinical and cold (symptom checkers), or they are trackers that collect data but never let women talk to each other.
- In Nigeria and across the diaspora, cultural and religious silence makes this worse. A woman needs anonymity to be honest.

### The product

MeridianHer Community is a standalone web app with three promises:

1. **Anonymous by default.** Members choose a display name. Real names and emails are never shown to anyone except authorised admins.
2. **Answers you can trust.** Verified experts (doctors, gynaecologists, midwives, dietitians, therapists) answer questions and carry a visible badge.
3. **Safe to be honest.** Every space is moderated by people, supported by automated checks, under clear rules: no shame, no diagnoses, no selling.

Anyone can read. An account is needed to post, reply, react, save or report. Sign in with Google takes one tap.

### Year one goals

| Goal | Target by month 12 |
| --- | --- |
| Registered members | 10,000 |
| Monthly active members (read or post at least once) | 3,000 |
| Questions with at least one reply within 24 hours | 85% |
| Expert answered questions in Ask an Expert spaces within 48 hours | 70% |
| Verified experts actively answering each month | 25 |
| Reported content reviewed within 12 hours | 95% |
| Members who return in their second month | 35% |

### What this is not

- Not a symptom checker, telehealth service or replacement for medical care.
- Not a social network: no followers, no public profiles with photos, no direct messages in v1.
- Not a marketplace: no selling, sponsored posts or affiliate links from members.
- Not the CyclePlate tracker. CyclePlate lives on hellocycleplate.com and appears here as one space.

## 2. Product principles

Every screen, feature and decision is checked against these. When two conflict, the higher one wins.

1. **Her safety before our growth.** We never trade privacy or safety for engagement. No dark patterns, no streaks, no guilt notifications, no selling her data.
2. **Anonymous by default, identifiable only to us.** A member's real identity is visible only to admins with a logged reason. Display names, never avatars of real faces.
3. **Expert answers are earned and visible.** A badge means we checked credentials. We never fake expertise and never let a badge be bought.
4. **Say the real word.** Vagina, vulva, discharge, miscarriage, libido. The product copy is frank, warm and never clinical or coy. No euphemisms for body parts.
5. **Read freely, act with an account.** Visitors can read everything public so the content does good even for women who never sign up. Posting needs an account so we can moderate.
6. **Calm, editorial, grown up.** The interface feels like a well designed magazine, not a social feed. Generous space, confident Geist headlines, soft surfaces, no visual noise.
7. **Every chapter of her life.** Content and spaces cover menarche to menopause. Nothing assumes she is trying to conceive, or that she is not.
8. **Global first, Nigeria aware.** Works on low bandwidth Android phones in Lagos as well as on a laptop in London. Copy avoids region specific assumptions about healthcare systems.

### Copy rules (apply to every string in both apps)

- No hyphens or em dashes in UI copy. Rewrite the sentence instead.
- Sentence case for buttons and headings.
- Second person, warm and direct: "Ask your question" not "Submit a query".
- Never mention a mobile app, an app store or anything "coming soon" that is not public.

## 3. Users and roles

Five roles, one account system. Roles stack: an expert is also a member, an admin can do everything a moderator can.

### Personas

| Persona | Who she is | What she needs from us |
| --- | --- | --- |
| Ada, 16 to 19 | Just started university in Lagos. Irregular periods, too embarrassed to ask her mum. | A safe, anonymous place to ask "is this normal" and get a kind, accurate answer. |
| Funmi, 28 | Married, trying to conceive for two years, in Abuja. Tired of family pressure. | Honest fertility conversations, women who understand, and a real doctor's view. |
| Sarah, 34 | New mum in London, six weeks postpartum. Pain, low mood, no time. | Quick answers at 3am from women who have been there and an expert she can trust. |
| Ngozi, 49 | Perimenopausal, hot flushes, no one around her talks about it. | Language for what is happening and proof she is not alone. |
| Dr Amaka | Gynaecologist, wants to educate and build her name. | A credible place to answer questions, a profile that shows her credentials, low admin. |

Users under 16 cannot create an account. Sign up asks for year of birth and blocks under 16s. Members aged 16 and 17 see the same content but some spaces (Sex and intimacy) are hidden from them.

### Roles and permissions

| Capability | Visitor | Member | Expert | Moderator | Admin |
| --- | --- | --- | --- | --- | --- |
| Read public posts and replies | Yes | Yes | Yes | Yes | Yes |
| Search | Yes | Yes | Yes | Yes | Yes |
| Create posts, reply, react, save | No | Yes | Yes | Yes | Yes |
| Report content | No | Yes | Yes | Yes | Yes |
| Follow spaces, get notifications | No | Yes | Yes | Yes | Yes |
| EXPERT ANSWERED badge on replies | No | No | Yes | No | No |
| Public expert profile with credentials | No | No | Yes | No | No |
| Mark an answer as the expert answer | No | No | Yes | No | No |
| Hide content, warn and mute members | No | No | No | Yes | Yes |
| Review the moderation queue | No | No | No | Yes | Yes |
| Approve and revoke experts | No | No | No | No | Yes |
| Manage spaces, rules and announcements | No | No | No | No | Yes |
| See real name and email (logged) | No | No | No | No | Yes |
| Assign roles, see analytics and audit log | No | No | No | No | Yes |

**Team reply.** Admins can post as "MeridianHer Team" with a team badge instead of their display name. Moderators cannot.

**Super admin.** One or two accounts (Chris and the founder) hold super admin, which is the only role that can create other admins and change platform settings.

## 4. System at a glance

```
Community app                 Design system              Admin platform
community.meridianher.com  <-- packages/ui -->           admin.meridianher.com
Visitors, members, experts    shadcn/ui, our tokens      Moderators and admins
Feed, spaces, posts, search   Used by both apps          Queue, members, experts, analytics
        |                                                        |
        | reads and writes, RLS enforced                         | admin role checked server side
        v                                                        v
+---------------------------------------------------------------------------------+
| Supabase (one project, EU or UK region)                                         |
|  Auth: Google sign in, email magic link                                         |
|  Postgres: row level security, full text search                                 |
|  Storage: private bucket for expert documents                                   |
|  Edge Functions: moderation checks, digests, renewals                           |
+---------------------------------------------------------------------------------+
        |                              |                          |
        v                              v                          v
  Google OAuth                   Moderation AI                 Resend
  sign in identity only          pre publish checks            emails and digests
```

Members and admins never share a front door: each app deploys separately on Vercel, but both read the same Supabase data under row level security. hellocycleplate.com stays fully separate.

## 5. Sign in and accounts

Google sign in is the primary path. A passwordless email link is the fallback for women who do not want to use their Google account here. No passwords to store or reset.

### Sign in methods

| Method | Priority | Notes |
| --- | --- | --- |
| Continue with Google | Primary, top button | Supabase Auth Google OAuth. Request only `openid`, `email`, `profile`. Never use her Google name or photo publicly. |
| Email magic link | Secondary | One time link valid 15 minutes. Same account if the email matches a Google account. |
| Continue with Apple | Phase 2 | Useful for iPhone users who hide their email. |

### When sign in is asked for

Visitors browse freely. The sign in sheet appears only when she tries to act: post, reply, react, save, report or follow a space. After signing in she returns to exactly where she was, with her draft text kept.

### First time onboarding (under 60 seconds, 4 steps)

1. **Welcome and promise.** "Your name and email are never shown. You choose how you appear."
2. **Choose your display name.** Free text with suggestions such as "Amber Fern" or "Quiet River" (adjective plus nature word). Checked for uniqueness, profanity and real name patterns. A warning appears if it matches her Google first or last name.
3. **Year of birth.** Required. Under 16 is blocked with a kind message and links to youth resources. 16 and 17 get age restricted spaces hidden.
4. **Pick your spaces.** Choose at least one: Periods and cycles, Fertility and TTC, Pregnancy, Postpartum, Menopause, PCOS and endo, Sexual health, Mental health, Nutrition (CyclePlate), Body and skin. This shapes her home feed.

Then she accepts the community guidelines (one screen, five plain rules, one checkbox) and lands on her feed.

### Account settings

- Change display name (once every 30 days, old names never reused by others for 90 days).
- Notification preferences per type and channel (in app, email digest).
- Hide my activity: her posts stay up but are not linked to each other on her profile.
- Download my data (JSON and readable PDF, emailed within 72 hours).
- Delete my account: posts are anonymised to "Former member" or deleted, her choice. Completed within 30 days.
- Expert only: credentials, specialty, bio, professional photo (optional), availability status.

### Profile visibility

A member's profile page shows only display name, initial avatar, joined month, spaces she is active in and her public posts. No age, location, email or photo. Experts additionally show title, specialty, verification date and answer count.

## 6. Community app

The community app runs at its own address (proposed community.meridianher.com) and is responsive from 360px phones to wide desktops. Priority labels: **P0** must ship in beta, **P1** must ship at public launch, **P2** later.

### 6.1 Navigation and screens

| Screen | Route | Who | Purpose |
| --- | --- | --- | --- |
| Home feed | `/` | All | Posts from followed spaces (members) or trending across all spaces (visitors). |
| Space | `/s/[space]` | All | One topic: description, rules, pinned posts, feed, top experts. |
| Post | `/p/[id]` | All | The post, expert answer pinned first, then threaded replies. |
| Ask | `/ask` | Member | Full page composer (also opens as a sheet on mobile). |
| Search | `/search` | All | Posts, replies, spaces and experts. |
| Experts | `/experts` | All | Directory of verified experts by specialty. |
| Expert profile | `/e/[handle]` | All | Credentials, bio, recent answers. |
| Member profile | `/m/[name]` | All | Display name and public posts only. |
| Saved | `/saved` | Member | Bookmarked posts and replies. |
| Notifications | `/notifications` | Member | Replies, expert answers, mentions, moderation notices. |
| Settings | `/settings` | Member | Account, privacy, notifications, data. |
| Guidelines | `/guidelines` | All | The community rules in full. |
| Apply as expert | `/experts/apply` | Member | Expert application form. |

**Layout.** Desktop: left rail with spaces, centre feed (max 680px), right rail with guidelines card, trending questions and featured experts. Mobile: top bar with search and avatar, bottom nav with Home, Spaces, Ask (centre, prominent), Notifications, Profile.

### 6.2 Spaces (P0)

Spaces are topic communities. Launch set of ten:

| Space | Notes |
| --- | --- |
| Periods and cycles | Includes first periods, irregular cycles, period pain |
| Fertility and TTC | Trying to conceive, IVF, pregnancy loss (with content warning) |
| Pregnancy | Trimester by trimester |
| Postpartum | Recovery, feeding, mental health after birth |
| Menopause | Perimenopause through postmenopause |
| PCOS and endometriosis | Conditions, diagnosis journeys, management |
| Sexual health | Contraception, STIs, pain, libido. 18+ only |
| Mental health | Hormones and mood, PMDD, anxiety. Crisis signposting always visible |
| Nutrition by CyclePlate | Cycle syncing, cravings, eating for each phase. Links to hellocycleplate.com |
| Body and skin | Hair, skin, weight, breasts, discharge |

Each space has: name, slug, icon, accent colour, description, rules (up to 5 extra on top of global rules), tags, age gate flag, ask an expert flag, pinned posts (up to 3), and assigned moderators. Admins create, edit, archive and reorder spaces without a deploy.

### 6.3 Feed (P0)

- Sort tabs: **For you** (followed spaces, ranked), **New**, **Unanswered** (zero replies, for helpers and experts), **Expert answered**.
- Ranking for For you: recency, reply count, reactions, expert answer present, with a decay over 72 hours. No infinite engagement bait: the feed shows a calm "You're all caught up" state.
- Infinite scroll with cursor pagination, 20 per page. Skeleton loading.
- Filter chips for space tags (for example Cravings, Period pain, First period).
- Pinned and announcement posts sit above the feed with a distinct style.

### 6.4 Post card

Avatar initial circle in the space accent colour, display name, time ago, space chip, tag chip, optional content warning blur, title (bold), first three lines of body, badges row (EXPERT ANSWERED in green pill, TEAM badge), footer with reaction count, reply count, save, share and overflow menu (report, hide, copy link).

### 6.5 Creating a post (P0)

- Post type: **Question** (default, eligible for expert answer) or **Discussion** (sharing an experience, no answer expected).
- Fields: space (required), title (required, 10 to 150 characters), body (optional, up to 5,000 characters, rich text: bold, italic, lists, links), tags (up to 3 from the space's tag list), content warning toggle with type (pregnancy loss, graphic, mental health), ask an expert toggle (Questions only, in eligible spaces).
- **Post anonymously to everyone** toggle: hides even her display name, shows "Anonymous member". Moderators and admins still see the account.
- Drafts autosave locally every 5 seconds.
- Before publishing, show similar existing posts ("Others asked this") from search to reduce duplicates.
- Automated checks on submit (see section 8). Posts that fail go to review and she sees "Your post is being checked and will appear shortly".
- Edit within 24 hours (shows "edited"). Delete any time.
- Images: P2, moderated, never faces.

### 6.6 Post page and replies (P0)

- Expert answer block pinned under the post when an expert has answered, with the expert's name, title, specialty and verification tick.
- Threaded replies, two levels deep (reply and reply to reply), sorted Top or Oldest.
- Original poster can mark one member reply as **Helped me**.
- Experts can mark their reply as the **Expert answer** (one per post per expert, multiple experts allowed).
- Reactions: one tap set of three, labelled not emoji only: Hug (support), Same (me too), Helpful. Counts visible, reactors not listed publicly.
- Medical disclaimer footer on every post page: "Community answers share experience, not diagnosis. If you are worried, speak to a doctor."
- Related posts at the bottom.

### 6.7 Search (P0)

- Postgres full text search across post titles, bodies and replies, with space and tag filters and sort by relevance or date.
- Results show posts with matching snippet highlighted. Matches in replies show the reply inline under its post.
- Also returns spaces and experts.
- Visitor search works without an account. Search terms are not stored against identity.
- P2: semantic search with embeddings.

### 6.8 Notifications (P1)

| Event | In app | Email |
| --- | --- | --- |
| Reply to my post | Yes | Daily digest |
| Expert answered my question | Yes | Immediate |
| Reply to my reply | Yes | Digest |
| My post marked Helped me | Yes | No |
| Moderation action on my content | Yes | Immediate |
| Weekly best of my spaces | No | Weekly, opt in |

Emails never contain post content in the subject line (privacy on shared screens), only "You have a new reply on MeridianHer".

### 6.9 Saved and following (P1)

Save any post or reply to a private list. Follow spaces and individual posts to get notified of new replies.

### 6.10 Empty, error and edge states

Every list has a designed empty state with a next step. Offline and slow network states show cached content with a banner. A deleted post shows "This post was removed" with the reason category. Error pages (404, 500) use brand copy and a link home.

## 7. Expert programme

Experts are the reason women trust the community. A badge is granted only after an admin checks a licence against a public register. Experts join two ways: they apply, or an admin invites them. Both end in the same review.

### Expert categories

Doctor (GP), Gynaecologist or Obstetrician, Midwife, Fertility specialist, Registered dietitian, Registered nutritionist, Psychologist or Therapist, Pelvic health physiotherapist, Pharmacist, Other (admin approved free text).

### Path A: application

1. Signed in member opens `/experts/apply`.
2. Form: full legal name, professional title, category, specialties (up to 3), licensing body (for example MDCN, NMC, GMC, HCPC), licence or registration number, country of practice, years in practice, workplace (optional), LinkedIn or practice web page, short bio (300 characters), upload of licence or ID (PDF or image, stored in a private bucket), consent to verification and the expert code of conduct.
3. Application enters the **Expert review** queue in admin with status Submitted.
4. Admin checks the register, may request more info (applicant gets an email and can reply in app), then Approves or Rejects with a reason.
5. On approval the role becomes Expert, she chooses a public expert handle and profile, and gets an onboarding email with the expert guidelines.

### Path B: invite

1. Admin enters name, email and category in admin. System sends an invite link valid 14 days.
2. Invitee signs in with Google or email and lands on a shortened form (credentials and bio prefilled where known).
3. Same review step as Path A. Invited experts are flagged so the admin can fast track, but licence checks are never skipped.

### Expert obligations and features

- Code of conduct: general education only, no diagnosis or prescribing for an individual, no soliciting patients, no selling, declare conflicts of interest.
- **Expert inbox**: questions in her specialties with Ask an expert switched on, sorted oldest unanswered first.
- Answer template prompts: what this could mean, when to see a doctor, what to ask your doctor.
- Every expert answer carries the standard disclaimer automatically.
- Monthly impact email: answers given, helpful reactions, members reached.
- Re verification every 12 months. Badge suspended automatically if not renewed within 30 days of expiry.
- Admins can suspend or revoke instantly. Past answers stay but lose the badge and show "Expert status ended".

### Badge display

- On replies: green pill "EXPERT ANSWERED" plus category, for example "EXPERT ANSWERED, Gynaecologist".
- On profile: verification tick, licensing body and verification month.

## 8. Trust, safety and moderation

Moderation runs in three layers: automated checks before content goes live, member reports after, and a human moderation team working one queue in the admin platform. Health communities attract misinformation, selling and people in crisis, so this is P0 for beta, not a later add on.

### Community guidelines (the five rules members accept)

1. Be kind. No shaming, mocking or judging anyone's body, choices or beliefs.
2. Share experience, not diagnosis. Only verified experts give clinical context, and never a diagnosis.
3. No selling. No products, clinics, MLMs, links for profit or DMs to sell.
4. Protect privacy. Never share anyone's real name, photo or details, including your own.
5. Keep it real and respectful. No spam, hate, harassment or sexual content outside health discussion.

### Layer 1: automated checks on every post and reply

| Check | Action |
| --- | --- |
| Profanity and slurs list | Block with a message to edit |
| Phone numbers, emails, WhatsApp links, social handles | Hold for review (anti selling, anti doxxing) |
| External links | Allowed only from an approved domain list (NHS, WHO, ACOG, NICE, hellocycleplate.com). Others held for review |
| AI moderation classifier (OpenAI moderation or a Claude prompt) for harassment, sexual content, self harm, medical misinformation | Score above threshold goes to review |
| Self harm and crisis keywords | Post publishes, crisis resources card shown to her immediately, urgent flag to moderators |
| New accounts (under 24 hours) | First 2 posts held for review |
| Rate limits | 5 posts and 30 replies per hour per member |

### Layer 2: reporting

Every post, reply and profile has Report. Reasons: harassment, misinformation, selling or spam, privacy breach, self harm concern, sexual content, other. Optional note. Reporter is never revealed. Content reaching 3 reports from different members is hidden automatically pending review.

### Layer 3: human moderation

- Actions: approve, hide (soft delete, reversible), edit to remove personal info (logged), add content warning, move to another space, lock replies, pin.
- Member actions: warn (with reason template), mute for 24 hours, 7 days or 30 days, ban. Bans block the account and the Google ID from rejoining.
- Every action logs moderator, time, reason and before and after state. Members get a notification with the rule broken and can appeal once.
- Service levels: urgent (self harm) within 1 hour during staffed hours, everything else within 12 hours.

### Crisis handling

- A persistent "Need help now?" link in the footer and in the Mental health and Postpartum spaces, listing UK (Samaritans 116 123, NHS 111) and Nigeria (emergency 112, Mentally Aware Nigeria Initiative) resources. Resource list is admin editable per country.
- Moderators get a crisis playbook in the admin help panel. We signpost; we never attempt counselling through moderation messages.

### Medical misinformation

Claims that contradict established guidance in harmful ways (for example stopping prescribed medication, unsafe abortion methods, unproven fertility cures) are hidden and an expert or team note is added explaining the evidence.

## 9. Admin platform

The admin platform is a separate web app (proposed admin.meridianher.com) for moderators and admins. It shares the database and design system with the community app but has its own deploy, its own login gate and no public pages. It is desktop first, dense and fast, built for someone spending an hour a day in it. Access requires Google sign in plus a moderator or admin role; super admins can enforce two factor authentication.

### 9.1 Navigation

Left sidebar: Overview, Moderation, Members, Experts, Content, Spaces, Announcements, Analytics, Audit log, Settings. Top bar: global search (members, posts, experts by any field), queue counters, profile. Command palette (Ctrl or Cmd plus K) for every action.

### 9.2 Overview dashboard (P0)

One screen that answers "is the community healthy today".

| Panel | Content |
| --- | --- |
| Headline numbers | Total members, new members today and 7 days, daily and monthly active members, posts and replies today, each with change versus previous period |
| Needs attention | Open reports, urgent crisis flags, held posts, pending expert applications, unanswered expert questions older than 48 hours. Each is a link into the queue |
| Activity chart | Posts, replies and new members per day, 30 days |
| Response health | Percent of questions answered in 24 hours, median time to first reply, median time to expert answer |
| Spaces table | Each space with members, posts this week, unanswered count, open reports |
| Expert leaderboard | Answers this month per expert, helpful reactions |
| Moderation load | Reports in and resolved per day, median resolution time |

Date range picker (today, 7, 30, 90 days, custom) and space filter apply to every panel.

### 9.3 Moderation queue (P0)

- One unified queue with tabs: Urgent, Reported, Held by automation, Appeals, Resolved.
- Each item shows the content in context (parent post, thread), the author's display name, account age, past warnings, report reasons and count, automated scores.
- One click actions with keyboard shortcuts: A approve, H hide, W warn, M mute, B ban, E escalate to admin. Reason required for hide, warn, mute and ban, from templates.
- Bulk select for spam waves.
- Claim an item so two moderators do not work the same report.

### 9.4 Members (P0)

- Searchable, filterable table: display name, email (admin only, reveal is logged), role, joined, last active, posts, replies, reports against, status (active, muted, banned).
- Member detail: activity timeline, all content, moderation history, notes from moderators (private), role changes, account actions (mute, ban, reset display name, delete account, export data on request).
- Role assignment: member, expert, moderator, admin. Only super admins assign admin.

### 9.5 Experts (P0)

- Applications kanban: Submitted, In review, More info requested, Approved, Rejected.
- Application detail: all fields, uploaded documents in a secure viewer, link to the licensing register, checklist (name matches, licence active, specialty matches), notes, decision with reason.
- Invite expert form and list of pending invites.
- Active experts table: category, verified date, renewal due, answers this month, average helpful score, status. Suspend and revoke actions.

### 9.6 Content and spaces (P1)

- All posts table with filters (space, type, status, answered, has expert answer, date) and actions (pin, lock, move, feature, hide).
- Spaces manager: create, edit, reorder, archive, set accent colour, rules, tags, age gate, ask an expert flag, assign moderators.
- Allowed link domains list, blocked words list, crisis resources per country, guideline text: all editable here without a deploy.

### 9.7 Announcements and team posts (P1)

Write a post as MeridianHer Team in any space, pin it, schedule it for a date and time, and optionally show a dismissible banner across the community.

### 9.8 Analytics (P1)

Retention cohorts by signup week, funnel from visit to signup to first post, top searched terms with no results (content gaps), most viewed posts, space growth, traffic sources. Export any table to CSV.

### 9.9 Audit log (P0)

Append only log of every admin and moderator action: who, what, target, before, after, reason, time, IP. Filterable and exportable. Cannot be edited or deleted, even by super admins.

### 9.10 Settings (P1)

Platform name and copy, sign in methods on or off, new account hold rules, rate limits, report auto hide threshold, email templates, admin team management, two factor enforcement.

## 10. Data model

Postgres in Supabase. All tables have `id uuid`, `created_at`, `updated_at`. Content tables use soft delete (`deleted_at`, `deleted_by`, `delete_reason`). Row level security on every table: public reads only see published, non deleted content in non age gated spaces (or age gated ones the reader qualifies for).

| Table | Key fields |
| --- | --- |
| `profiles` | user\_id (auth.users), display\_name (unique), birth\_year, role (member, expert, moderator, admin, super\_admin), status (active, muted, banned), muted\_until, onboarding\_complete, hide\_activity, last\_active\_at |
| `expert_profiles` | user\_id, handle, legal\_name (private), title, category, specialties\[\], licensing\_body, licence\_number (private), country, bio, photo\_url, verified\_at, renewal\_due, status (active, suspended, revoked) |
| `expert_applications` | user\_id, source (applied, invited), all form fields, document\_paths\[\] (private bucket), status, reviewer\_id, decision\_reason, reviewed\_at |
| `expert_invites` | email, name, category, token\_hash, invited\_by, expires\_at, accepted\_at |
| `spaces` | slug, name, description, icon, accent\_color, rules\[\], tags\[\], min\_age, ask\_expert\_enabled, sort\_order, archived |
| `space_moderators` | space\_id, user\_id |
| `space_follows` | space\_id, user\_id |
| `posts` | author\_id, space\_id, type (question, discussion, announcement), title, body (sanitised rich text JSON), tags\[\], content\_warning, ask\_expert, fully\_anonymous, as\_team, status (published, held, hidden), pinned, locked, edited\_at, reply\_count, reaction\_counts jsonb, has\_expert\_answer, search\_vector |
| `replies` | post\_id, parent\_reply\_id, author\_id, body, author\_role\_snapshot, expert\_category\_snapshot, is\_expert\_answer, is\_helped\_me, as\_team, status, reaction\_counts, search\_vector |
| `reactions` | target\_type, target\_id, user\_id, kind (hug, same, helpful). Unique per user, target, kind |
| `saves` | user\_id, target\_type, target\_id |
| `reports` | target\_type, target\_id, reporter\_id, reason, note, status (open, claimed, resolved), claimed\_by, resolution, resolved\_at |
| `moderation_flags` | target\_type, target\_id, source (classifier, keyword, new\_account, link, threshold), score, details jsonb, priority (urgent, normal) |
| `moderation_actions` | moderator\_id, target\_type, target\_id, action, reason\_code, reason\_text, before jsonb, after jsonb |
| `member_sanctions` | user\_id, kind (warn, mute, ban), until, reason, issued\_by, appeal\_text, appeal\_status |
| `notifications` | user\_id, kind, payload jsonb, read\_at, emailed\_at |
| `notification_prefs` | user\_id, kind, in\_app, email (off, immediate, digest) |
| `announcements` | author\_id, space\_id (nullable for global), body, banner, starts\_at, ends\_at |
| `settings` | key, value jsonb (blocked words, allowed domains, crisis resources by country, thresholds) |
| `audit_log` | actor\_id, action, target\_type, target\_id, before, after, reason, ip, at. Insert only, no update or delete grants |
| `pii_access_log` | admin\_id, member\_id, field, reason, at |

Counts (reply\_count, reaction\_counts) are maintained by database triggers. Full text search uses `tsvector` columns with GIN indexes, updated by triggers.

## 11. Tech stack and architecture

One monorepo, two Next.js apps, one shared UI package, one Supabase project. Each app deploys to its own Vercel project. Nothing in this repo touches hellocycleplate.com.

### Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Repo | Turborepo with pnpm workspaces | Shared design system and types across both apps |
| Framework | Next.js 16 App Router, TypeScript strict (matches the local design system, decision D1) | Server components for fast, SEO friendly public pages |
| UI | shadcn/ui base nova (React, Tailwind CSS v4, Base UI) from our local design system project (decision D2) | Accessible primitives, our own tokens |
| Rich text | Tiptap with a restricted schema | Bold, italic, lists, links only. Stored as JSON, sanitised on the server |
| Database and auth | Supabase (Postgres, Auth, Storage, Realtime) | Google OAuth and magic link built in, row level security |
| Data access | Supabase client with generated types, server actions for writes, Zod validation on every input | Type safe end to end |
| Client data | TanStack Query for feeds and infinite scroll | Caching and optimistic reactions |
| Email | Resend with React Email templates | Digests, expert notifications, invites |
| Moderation AI | OpenAI moderation endpoint or Claude via API, called from a Supabase Edge Function | Pre publish classification |
| Background jobs | Supabase cron (pg\_cron) and Edge Functions | Digests, expert renewals, unanswered alerts |
| Rate limiting | Upstash Redis | Per user and per IP limits |
| Analytics | PostHog (EU cloud) with no personal data in events | Funnels, retention, feature flags |
| Errors | Sentry | Both apps |
| Hosting | Vercel, two projects | Preview deploys per pull request |
| Tests | Vitest for units, Playwright for key journeys | Sign in, post, reply, report, moderate, approve expert |

### Repo structure

```
meridianher/
  apps/
    community/        Next.js app, public plus member features
    admin/            Next.js app, moderators and admins only
  packages/
    ui/               design system: tokens, shadcn components, patterns
    db/               Supabase types, queries, RLS tested helpers
    config/           eslint, tsconfig, tailwind preset
    emails/           React Email templates
  supabase/
    migrations/       SQL schema, RLS policies, triggers
    functions/        edge functions (moderation, digests)
    seed.sql          spaces, tags, demo content
```

### Auth setup

- Google OAuth client in Google Cloud Console, redirect URIs for both apps and preview URLs, scopes `openid email profile` only.
- Supabase Auth with Google and email magic link providers. Session cookies via `@supabase/ssr`, shared across subdomains of meridianher.com.
- Admin app middleware checks role on every request server side. Role lives in `profiles`, mirrored into a JWT custom claim for RLS.

### Environments

Local (Windows with PowerShell; every script must run in PowerShell, no bash only scripts; a hosted Supabase dev project unless Docker Desktop is installed for the Supabase CLI), Preview (per pull request, seeded staging database), Production. Secrets only in Vercel and Supabase dashboards.

## 12. Design system

Both apps are built only from `packages/ui`, which Claude Code creates by reading Chris's local shadcn/ui project at C:\\Users\\Chris\\my-design-system. No component is styled ad hoc inside an app. If something is missing, it is added to the package first.

### Step 1 for Claude Code: audit the local project

1. Read `components.json`, `tailwind.config` (or the Tailwind v4 `@theme` block), `globals.css` and every file in `components/ui`.
2. Produce `packages/ui/AUDIT.md` listing: colour tokens (light and dark), radius, spacing, fonts, shadows, every component and its variants, any custom components beyond stock shadcn, and gaps.
3. Stop and show Chris the audit before building any screens.

### Step 2: build the package

- **Tokens** as CSS variables in `packages/ui/styles/tokens.css`, exposed through a shared Tailwind preset. Semantic names only in app code (`bg-surface`, `text-muted-foreground`, `border-subtle`), never raw hex.
- **Brand layer** on top of the local system: warm cream background (around #FAF8F4), deep ink text, Meridian Plum as primary (full token set below), phase accents for spaces (#B23A4B, #7C9A65, #E0A33E, #96617F) plus extra accents for non cycle spaces, green for expert badges. Soft shadows instead of hard borders. **Geist** is the only typeface: Geist for headings and body (headings set in semibold with tighter tracking), Geist Mono for IDs and technical values in admin. Loaded with `next/font` with the Latin, Latin Extended and Vietnamese subsets so Yoruba, Igbo and Hausa characters render.
- **Primitives**: the local shadcn components with brand variants. A primitive lives in the package only while a pattern or screen uses it: it is added from the local system or the shadcn registry when first needed (for example Tabs, Skeleton, Toast, Command, AlertDialog) and removed when nothing imports it.
- **Composition rule**: apps are built only from package components. No raw button, input, card or similar element where a component exists, no wrapper divs without a purpose, and no one off styling outside the package.
- **Patterns** built once and shared: PostCard, ReplyThread, ExpertBadge, TeamBadge, SpaceChip, TagChip, ReactionBar, ContentWarningBlur, Composer, EmptyState, SignInSheet, GuidelinesCard, CrisisCard, and for admin DataTable (TanStack Table), StatCard, QueueItem, FilterBar, AuditRow.
- **Storybook** or a `/design` route in each app showing every component and state, used for review before screens.

### Colour palette and rationale

The palette is called **Dusk at the Meridian**: a deep plum and night sky, warm paper and earth tones. It speaks to grown women without falling back on baby pink or clinical hospital blue.

| Role | Name | Hex | Why |
| --- | --- | --- | --- |
| Primary | Meridian Plum | #5B2E52 | Rich, mature and feminine without being girly. It carries over from the purple in the MeridianHer brand brief and sits in the same family as the luteal mauve. Contrast with white text is 10.7:1. |
| Ink | Night | #1A1A2E | The deep navy of the brand brief cover: the sky at dusk, when the sun crosses the meridian. Used for text, which reads softer than pure black. Contrast on the background is 16:1. |
| Background | Warm Paper | #FAF8F4 | Carried over from CyclePlate. Feels like a printed magazine, calm, low glare for reading at 3am. |
| Accent | Terracotta | #C4704F | Warmth, earth, clay and textiles. Connects the brand to Nigerian and African women without making it a theme. Used sparingly for highlights and illustration, never for small text. |
| Trust | Expert Green | #2F6B4F | Green reads as safe, verified and healthy. Reserved only for expert badges and verification ticks so it keeps its meaning. |
| Soft tint | Plum Mist | #F1E8EF | Selected states, member avatars, soft callouts. |

Why not pink: most women's health brands use pink, so it fades into the category and reads young. Plum keeps the warmth but signals the depth of topics such as pregnancy loss and menopause. Why not blue: blue says hospital, and this community should feel like a conversation, not a clinic.

### Colour tokens

Semantic tokens, defined as CSS variables in `packages/ui/styles/tokens.css` and mapped to the shadcn/ui variable names so every stock component picks them up. All contrast ratios checked against WCAG 2.2 AA.

| Token (shadcn name) | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | #FAF8F4 | #16131D | Page background |
| `--foreground` | #1A1A2E | #F3EEE8 | Body text and headings |
| `--card` | #FFFFFF | #211C2B | Post cards, panels |
| `--card-foreground` | #1A1A2E | #F3EEE8 | Text on cards |
| `--popover` | #FFFFFF | #2A2436 | Menus, dialogs, sheets |
| `--primary` | #5B2E52 | #D7B4CF | Main buttons, links, active chips |
| `--primary-foreground` | #FFFFFF | #16131D | Text on primary |
| `--secondary` | #F1E8EF | #3A2F44 | Soft buttons, selected rows |
| `--secondary-foreground` | #5B2E52 | #F3EEE8 | Text on secondary |
| `--muted` | #F3EEE8 | #241F2E | Quiet surfaces, inputs, skeletons |
| `--muted-foreground` | #6B6475 | #A9A1B3 | Timestamps, helper text (5.3:1) |
| `--accent` | #F7EAE3 | #3B2A25 | Hover and highlight surfaces |
| `--accent-foreground` | #A3553A | #E8A88C | Terracotta text and icons |
| `--brand-terracotta` | #C4704F | #D98A6A | Illustration, large highlights only |
| `--expert` | #2F6B4F | #7FBF9C | EXPERT ANSWERED badge, verified tick |
| `--expert-foreground` | #FFFFFF | #16131D | Text on expert badge |
| `--expert-soft` | #E6F0EA | #1F3329 | Pinned expert answer background |
| `--destructive` | #B3261E | #F2938C | Delete, ban, errors |
| `--warning` | #B7791F | #E8B464 | Held content, warnings |
| `--success` | #2F6B4F | #7FBF9C | Approved, resolved |
| `--border` | #E8E1DA | #352E40 | Hairlines only where a shadow cannot work |
| `--input` | #E2DAD2 | #3A3346 | Input outlines |
| `--ring` | #5B2E52 | #D7B4CF | Focus ring, always visible |
| `--shadow-soft` | 0 1px 2px rgba(26,26,46,0.04), 0 4px 16px rgba(26,26,46,0.06) | 0 4px 16px rgba(0,0,0,0.4) | Cards instead of borders |

### Space accent colours

Each space has one accent, used for its icon, avatar circles and chip dot. The four cycle phase colours from CyclePlate carry over so the two brands feel related. On chips and avatars the accent is shown as a 15% tint with Night text on top, because some accents (sage, gold, terracotta) fall below 4.5:1 with white text.

| Space | Token | Hex |
| --- | --- | --- |
| Periods and cycles | `--space-periods` | #B23A4B (menstrual rose) |
| Fertility and TTC | `--space-fertility` | #D08C60 (apricot) |
| Pregnancy | `--space-pregnancy` | #E0A33E (ovulatory gold) |
| Postpartum | `--space-postpartum` | #4F8A8B (soft teal) |
| Menopause | `--space-menopause` | #96617F (luteal mauve) |
| PCOS and endometriosis | `--space-conditions` | #5E7A99 (dusk blue) |
| Sexual health | `--space-sexual` | #C25B7A (deep rose) |
| Mental health | `--space-mind` | #6C7BB0 (periwinkle) |
| Nutrition by CyclePlate | `--space-nutrition` | #7C9A65 (follicular sage) |
| Body and skin | `--space-body` | #A67C52 (clay) |

### Colour rules

- Primary plum appears on one main action per screen. Everything else is quiet.
- Expert Green is never used for anything except expert verification and success states.
- Terracotta is never used for body text or small buttons (3.6:1 with white).
- App code uses tokens only, never raw hex. A lint rule blocks hex values outside `tokens.css`.

### Quality rules

- WCAG 2.2 AA contrast on every token pair, checked automatically.
- Every interactive element keyboard reachable with a visible focus ring.
- Motion respects `prefers-reduced-motion`.
- Dark mode supported in the token set from day one, shipped in community at P1.
- Admin uses the same tokens at a denser scale (smaller type ramp, tighter spacing, compact table rows).

## 13. Quality bar

This is what separates a real product from a quick AI build. Nothing ships to public launch unless it meets every line below.

### Performance

| Measure | Target |
| --- | --- |
| Largest Contentful Paint, mid range Android on 4G | Under 2.5 seconds |
| Interaction to Next Paint | Under 200 ms |
| Cumulative Layout Shift | Under 0.1 |
| JavaScript on first load, community home | Under 150 KB gzipped |
| Feed page API response (p95) | Under 300 ms |
| Lighthouse (performance, accessibility, best practices, SEO) | 90 or above on all four |

Public pages (spaces, posts, expert profiles) are server rendered with caching so they load fast and are indexed by search engines. Each post page has its own title, description and structured data (QAPage schema).

### Accessibility

WCAG 2.2 AA. Screen reader tested with VoiceOver and TalkBack on the five key journeys. Text resizes to 200% without breaking layout. Content warnings are announced to screen readers.

### Privacy and data protection

- Complies with UK GDPR and the Nigeria Data Protection Act 2023. Health related posts are special category data: explicit consent at sign up, a clear privacy notice, a data protection impact assessment before launch.
- Data hosted in an EU or UK Supabase region.
- Minimum data: no phone number, no location, no real name for members.
- No third party advertising trackers. Analytics events carry an anonymous ID only, never post content.
- Admin reveal of a member's email or Google name requires a reason and is logged in `pii_access_log`.
- Retention: deleted content purged after 90 days, except where held for a safety investigation. Expert documents deleted 30 days after a decision.
- Cookie banner only for non essential cookies.

### Security

- Row level security on every table, with automated tests proving a member cannot read another member's private data or admin tables.
- All writes go through server actions with Zod validation. Rich text sanitised server side.
- CSP headers, secure cookies, CSRF protection via same site cookies.
- Private storage bucket for expert documents, signed URLs valid 5 minutes, admin only.
- Two factor authentication enforced for all admin and moderator accounts before launch.
- Dependency scanning and a penetration test before public launch.

## 14. Metrics

The north star is **questions that got a helpful answer within 24 hours, per week**. It captures both sides of the community: women asking and the community or experts answering well.

| Area | Metric | Beta target | Month 12 target |
| --- | --- | --- | --- |
| Acquisition | Visitor to signup conversion | 3% | 5% |
| Activation | New members who post, reply or react in first 7 days | 40% | 50% |
| Engagement | Weekly active members / monthly active members | 30% | 40% |
| Answers | Questions with a reply within 24 hours | 75% | 85% |
| Experts | Ask an expert questions answered within 48 hours | 50% | 70% |
| Quality | Replies marked Helpful or Helped me | 20% | 30% |
| Retention | Members active in month 2 after signup | 25% | 35% |
| Safety | Reports resolved within 12 hours | 90% | 95% |
| Safety | Content hidden after publishing, as share of all content | Under 2% | Under 1% |
| Search | Searches with zero results | Under 15% | Under 8% |

Every metric is visible in the admin Analytics page, with no personal data in the events.

## 15. Release plan

Four phases over roughly 16 weeks of build time. Each phase ends with a gate; we do not move on until its exit criteria are met.

### Phase 0: Foundations (weeks 1 to 3)

Monorepo, design system audit and `packages/ui`, Supabase schema with RLS and tests, Google and email sign in, onboarding, spaces seeded, CI with preview deploys.

**Gate:** Chris approves the design system audit and the component gallery. RLS test suite passes.

### Phase 1: Private alpha (weeks 4 to 8)

Feed, spaces, post composer, post page, replies, reactions, search, report button, automated checks, admin overview (basic), moderation queue, members table, expert application and invite, expert review, audit log. Seeded with 50 real questions written by the team and answered by 3 to 5 founding experts.

**Gate:** 20 internal testers complete the five key journeys (sign up, ask, reply, report, get an expert answer) with no blocking bugs. Moderation queue tested with a simulated spam wave.

### Phase 2: Private beta (weeks 9 to 12)

Invite 300 to 500 women from the CyclePlate survey list and social followers, plus 10 founding experts. Add notifications, email digests, saved, follow, expert inbox, admin analytics, announcements. Weekly feedback sessions.

**Gate:** beta targets in section 14 met for 3 consecutive weeks. Privacy impact assessment signed off. Penetration test issues fixed. 2FA on all admin accounts.

### Phase 3: Public launch (weeks 13 to 16)

Open sign up, SEO for public posts, launch campaign across MeridianHer social channels, link from hellocycleplate.com to the Nutrition by CyclePlate space, dark mode, settings, data export and deletion.

**Gate:** performance and accessibility targets in section 13 met in production.

### Later (P2 backlog)

Sign in with Apple, image uploads with moderation, semantic search, expert live Q and A events, polls, content in Yoruba, Igbo, Hausa and Pidgin, a curated articles section, member to expert private questions (paid, with safeguards).

## 16. Open questions

- [ ] Domain: is meridianher.com secured? Confirm community.meridianher.com and admin.meridianher.com.
- [x] Whether the design system at C:\\Users\\Chris\\my-design-system uses Tailwind v3 or v4. Confirmed in the audit: Tailwind v4.
- [ ] Confirm the proposed colour tokens in section 12 and supply the MeridianHer logo before the token layer is built.
- [ ] Minimum age: confirm 16, with 18+ for Sexual health.
- [ ] Who are the 3 to 5 founding experts, and who on the team reviews expert applications?
- [ ] Moderation staffing: who covers the queue each day, and what hours count as staffed for the 1 hour urgent target?
- [ ] Crisis resources: verify the Nigeria list with a local mental health partner before launch.
- [ ] Moderation AI: OpenAI moderation (free, general) or Claude (better on medical nuance, paid per call)?
- [ ] Legal review of guidelines, privacy notice and expert terms in the UK and Nigeria.
- [ ] Should the Nutrition by CyclePlate space show a CyclePlate banner and link, and is that allowed under our no selling rule for members (it is our own product)?
