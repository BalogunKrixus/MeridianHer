/** "just now", "5m ago", "3h ago", "2d ago", then "3 Nov" (and the year when it is not this year). */
export function timeAgo(iso: string | null | undefined, now = new Date()) {
  if (!iso) return ""
  const then = new Date(iso)
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  })
}

export const EXPERT_CATEGORY_LABELS: Record<string, string> = {
  gp: "GP",
  gynaecologist: "Gynaecologist",
  midwife: "Midwife",
  fertility_specialist: "Fertility specialist",
  dietitian: "Registered dietitian",
  nutritionist: "Registered nutritionist",
  therapist: "Psychologist or therapist",
  pelvic_physio: "Pelvic health physiotherapist",
  pharmacist: "Pharmacist",
  other: "Expert",
}

export const NOTIFICATION_KINDS = ["reply_to_post", "expert_answered", "reply_to_reply", "followed_post_reply", "helped_me", "moderation"] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

/** What each notification setting covers, and its default email channel (PRD 6.8). */
export const NOTIFICATION_SETTINGS: Record<NotificationKind, { label: string; email: "off" | "immediate" | "digest"; locked?: boolean }> = {
  reply_to_post: { label: "Replies to my posts", email: "digest" },
  expert_answered: { label: "An expert answered my question", email: "immediate" },
  reply_to_reply: { label: "Replies to my replies", email: "digest" },
  followed_post_reply: { label: "New replies on posts I follow", email: "off" },
  helped_me: { label: "My reply helped someone", email: "off" },
  moderation: { label: "Decisions about my posts or account", email: "immediate", locked: true },
}

export function notificationText(kind: string, payload: Record<string, unknown>) {
  const title = typeof payload.post_title === "string" ? `"${payload.post_title}"` : "your post"
  switch (kind) {
    case "reply_to_post":
      return `Someone replied to ${title}`
    case "reply_to_reply":
      return `Someone replied to you on ${title}`
    case "followed_post_reply":
      return `New reply on ${title}, a post you follow`
    case "expert_answered":
      return `An expert answered ${title}`
    case "helped_me":
      return `Your reply on ${title} was marked as Helped me`
    case "expert_application":
      return payload.status === "approved"
        ? "Your expert application was approved. Welcome to the team."
        : payload.status === "more_info"
          ? "We need a little more information about your expert application"
          : "There is an update on your expert application"
    case "moderation":
      switch (payload.action) {
        case "approved":
          return `Your ${payload.target_type === "reply" ? "reply" : "post"} on ${title} is now live`
        case "hidden":
          return `Your ${payload.target_type === "reply" ? "reply" : "post"} on ${title} was removed by a moderator`
        case "warn":
          return "A moderator sent you a warning"
        case "mute":
          return `Your account is muted for ${payload.days ?? 1} ${payload.days === 1 ? "day" : "days"}`
        case "ban":
          return "Your account has been banned"
        case "unmute":
        case "unban":
        case "appeal_overturned":
          return "Your account restriction was lifted"
        case "appeal_upheld":
          return "Your appeal was reviewed and the decision stands"
        default:
          return "A moderator reviewed your content"
      }
    default:
      return "You have a new notification"
  }
}
