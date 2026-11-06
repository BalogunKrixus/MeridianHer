/** "just now", "5m", "3h", "2d", then a date. Compact for dense admin tables. */
export function ago(iso: string | null | undefined, now = new Date()) {
  if (!iso) return "never"
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date(iso)
}

export function date(iso: string | null | undefined) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }) })
}

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

/** "3 days", "5 months", for account age next to queue items. */
export function age(iso: string | null | undefined) {
  if (!iso) return "unknown"
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return "today"
  if (days < 31) return `${days} ${days === 1 ? "day" : "days"}`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? "year" : "years"}`
}

export function percentChange(now: number, before: number) {
  if (!before) return now ? 100 : 0
  return Math.round(((now - before) / before) * 1000) / 10
}

export const REPORT_REASON_LABELS: Record<string, string> = {
  harassment: "Harassment or bullying",
  misinformation: "Medical misinformation",
  selling: "Selling or spam",
  privacy: "Shares private details",
  self_harm: "Self harm or crisis",
  sexual: "Sexual content",
  other: "Something else",
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
  other: "Other",
}

/** Reason templates for hide, warn, mute and ban (PRD 9.3). Codes map to the five guidelines. */
export const REASON_TEMPLATES = [
  { code: "unkind", label: "Not kind", text: "This was unkind or shaming. Our first rule is to be kind." },
  { code: "diagnosis", label: "Diagnosis or medical advice", text: "Only verified experts give clinical context, and never a diagnosis." },
  { code: "misinformation", label: "Medical misinformation", text: "This shared health information that is unsafe or untrue." },
  { code: "selling", label: "Selling or spam", text: "No selling, promotion, clinics or links for profit." },
  { code: "privacy", label: "Privacy", text: "This shared someone's real name, photo or personal details." },
  { code: "respect", label: "Hate, harassment or sexual content", text: "No hate, harassment or sexual content outside health discussion." },
] as const
