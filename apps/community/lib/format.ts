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
