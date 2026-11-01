import type { AuditEntry } from "../patterns/audit-row"
import type { ComposerSpace } from "../patterns/composer"
import type { PostCardData } from "../patterns/post-card"
import type { QueueItemData } from "../patterns/queue-item"
import type { ExpertAnswerData, ReplyData } from "../patterns/reply-thread"

/** Demo content for the /design gallery only. Never shipped as real data. */

export const samplePosts: PostCardData[] = [
  {
    id: "p1",
    href: "#",
    title: "Is it normal for my period to be two weeks late at 19?",
    excerpt:
      "I started university in September and my cycle has always been about 30 days. This month nothing, and I have not had sex so I know I am not pregnant. Could stress really do this?",
    author: { displayName: "Amber Fern" },
    space: { name: "Periods and cycles", tone: "periods", href: "#" },
    tag: { label: "Irregular cycles", href: "#" },
    timeAgo: "2h ago",
    replyCount: 14,
    reactionCount: 32,
    expertAnswer: { category: "Gynaecologist" },
  },
  {
    id: "p2",
    href: "#",
    title: "Hot flushes at work and nobody talks about it",
    excerpt:
      "I am 49 and the flushes come in meetings. I have started carrying a fan but I feel like everyone can see. What has actually helped you?",
    author: { displayName: "Quiet River" },
    space: { name: "Menopause", tone: "menopause", href: "#" },
    tag: { label: "Perimenopause", href: "#" },
    timeAgo: "5h ago",
    edited: true,
    replyCount: 41,
    reactionCount: 88,
  },
  {
    id: "p3",
    href: "#",
    title: "Our second loss at eleven weeks, and how we are getting through it",
    excerpt:
      "Writing this because the posts here helped me so much the first time. This is what the scan, the waiting and the weeks after looked like for us.",
    author: { displayName: "Soft Willow", anonymous: true },
    space: { name: "Fertility and TTC", tone: "fertility", href: "#" },
    tag: { label: "Pregnancy loss", href: "#" },
    timeAgo: "1d ago",
    replyCount: 67,
    reactionCount: 214,
    contentWarning: "pregnancy-loss",
  },
]

export const sampleAnnouncement: PostCardData = {
  id: "a1",
  href: "#",
  title: "Ask an expert this week: Dr Amaka answers your PCOS questions",
  excerpt: "Post your question in PCOS and endometriosis with Ask an expert switched on. Dr Amaka will answer as many as she can before Friday.",
  author: { displayName: "MeridianHer Team", asTeam: true },
  space: { name: "PCOS and endometriosis", tone: "conditions", href: "#" },
  timeAgo: "3d ago",
  replyCount: 9,
  reactionCount: 51,
}

export const sampleExpertAnswer: ExpertAnswerData = {
  id: "e1",
  expert: { name: "Dr Amaka Obi", title: "Consultant gynaecologist", specialty: "Gynaecologist", href: "#" },
  timeAgo: "1h ago",
  reactions: { hug: 4, same: 0, helpful: 27 },
  body: (
    <>
      <p>
        <strong>What this could mean.</strong> Stress, a big change in routine, travel, weight change and intense exercise can all delay ovulation, which pushes your period later. In your first year of university this is very common.
      </p>
      <p>
        <strong>When to see a doctor.</strong> If you have missed three periods in a row, have severe pain, or notice new hair growth or acne, book an appointment.
      </p>
      <p>
        <strong>What to ask your doctor.</strong> Ask whether a blood test for hormones or a scan would help, and bring a note of your last few cycle dates.
      </p>
    </>
  ),
}

export const sampleReplies: ReplyData[] = [
  {
    id: "r1",
    author: { displayName: "Golden Moss", tone: "nutrition" },
    timeAgo: "1h ago",
    reactions: { hug: 6, same: 11, helpful: 3 },
    helpedMe: true,
    body: <p>Same thing happened to me in first year. Mine came back after about six weeks once I started sleeping properly again. You are not alone.</p>,
    replies: [
      {
        id: "r1a",
        author: { displayName: "Amber Fern", tone: "periods" },
        timeAgo: "45m ago",
        reactions: { hug: 2, same: 0, helpful: 0 },
        body: <p>Thank you, this makes me feel so much calmer.</p>,
      },
    ],
  },
  {
    id: "r2",
    author: { displayName: "Morning Fig", tone: "mind" },
    timeAgo: "30m ago",
    reactions: { hug: 1, same: 4, helpful: 0 },
    body: <p>Tracking it for a couple of months helped me see the pattern. I could show my GP the dates.</p>,
  },
  {
    id: "r3",
    author: { displayName: "Removed" },
    timeAgo: "20m ago",
    reactions: { hug: 0, same: 0, helpful: 0 },
    body: null,
    removed: { reason: "selling" },
  },
]

export const sampleComposerSpaces: ComposerSpace[] = [
  { slug: "periods", name: "Periods and cycles", tone: "periods", tags: ["First period", "Period pain", "Irregular cycles", "Heavy bleeding"], askExpertEnabled: true },
  { slug: "menopause", name: "Menopause", tone: "menopause", tags: ["Perimenopause", "Hot flushes", "HRT", "Sleep"], askExpertEnabled: true },
  { slug: "nutrition", name: "Nutrition by CyclePlate", tone: "nutrition", tags: ["Cravings", "Cycle syncing", "Iron"], askExpertEnabled: false },
]

export const sampleQueue: QueueItemData[] = [
  {
    id: "q1",
    priority: "urgent",
    source: "held",
    targetType: "reply",
    context: "Six weeks postpartum and I cannot stop crying",
    content: "I honestly do not see the point anymore. Everyone would be better off without me.",
    author: { displayName: "Grey Heron", accountAge: "3 months", pastWarnings: 0 },
    scores: [{ label: "self harm", value: 0.94 }],
    receivedAgo: "4 min ago",
  },
  {
    id: "q2",
    priority: "normal",
    source: "reported",
    targetType: "post",
    content: "My cousin sells a herbal tea that cleared my fibroids in a month. Message me on WhatsApp for the link.",
    author: { displayName: "Bright Lily", accountAge: "6 hours", pastWarnings: 1 },
    reports: [
      { reason: "Selling or spam", count: 3 },
      { reason: "Misinformation", count: 2 },
    ],
    scores: [{ label: "selling", value: 0.88 }],
    receivedAgo: "22 min ago",
    claimedBy: "Tola (moderator)",
  },
]

export type SampleMember = {
  id: string
  displayName: string
  role: "member" | "expert" | "moderator" | "admin"
  joined: string
  posts: number
  reports: number
  status: "active" | "muted" | "banned"
}

export const sampleMembers: SampleMember[] = [
  { id: "m1", displayName: "Amber Fern", role: "member", joined: "Oct 2026", posts: 12, reports: 0, status: "active" },
  { id: "m2", displayName: "Dr Amaka Obi", role: "expert", joined: "Sep 2026", posts: 48, reports: 0, status: "active" },
  { id: "m3", displayName: "Bright Lily", role: "member", joined: "Nov 2026", posts: 3, reports: 5, status: "muted" },
  { id: "m4", displayName: "Quiet River", role: "member", joined: "Aug 2026", posts: 27, reports: 0, status: "active" },
  { id: "m5", displayName: "Tola", role: "moderator", joined: "Jul 2026", posts: 9, reports: 0, status: "active" },
  { id: "m6", displayName: "Spam Account 22", role: "member", joined: "Nov 2026", posts: 1, reports: 9, status: "banned" },
]

export const sampleAudit: AuditEntry[] = [
  {
    id: "l1",
    at: "2026-11-01 21:14",
    actor: "Tola (moderator)",
    action: "hide",
    target: "Post 8f2c",
    reason: "Selling or spam",
    ip: "102.89.x.x",
    before: { status: "published" },
    after: { status: "hidden" },
  },
  {
    id: "l2",
    at: "2026-11-01 20:52",
    actor: "Chris (super admin)",
    action: "approve expert",
    target: "Dr Amaka Obi",
    reason: "MDCN register checked",
    ip: "81.2.x.x",
    before: { role: "member" },
    after: { role: "expert", verified_at: "2026-11-01" },
  },
  { id: "l3", at: "2026-11-01 19:30", actor: "Chris (super admin)", action: "reveal email", target: "Member Bright Lily", reason: "Ban evasion check", ip: "81.2.x.x" },
]
