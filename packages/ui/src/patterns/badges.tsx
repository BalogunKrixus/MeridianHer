import { cn } from "../lib/utils"
import { BadgeCheckIcon, ShieldCheckIcon } from "lucide-react"

import { Badge } from "../components/badge"

/** Green pill on replies: "EXPERT ANSWERED, Gynaecologist". Expert Green is reserved for this. */
function ExpertBadge({
  category,
  ended = false,
  className,
}: {
  category?: string
  /** Expert was suspended or revoked: past answers keep the text but lose the badge. */
  ended?: boolean
  className?: string
}) {
  if (ended) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        Expert status ended
      </Badge>
    )
  }
  return (
    <Badge variant="expert" className={cn("h-auto min-h-5", className)}>
      <BadgeCheckIcon data-icon="inline-start" aria-hidden />
      <span>
        Expert answered
        {category ? <span className="normal-case tracking-normal">, {category}</span> : null}
      </span>
    </Badge>
  )
}

/** Shown when an admin posts as "MeridianHer Team". */
function TeamBadge({ className }: { className?: string }) {
  return (
    <Badge variant="team" className={className}>
      <ShieldCheckIcon data-icon="inline-start" aria-hidden />
      Team
    </Badge>
  )
}

/** Verification tick next to an expert's name, with an accessible label. */
function VerifiedTick({ className }: { className?: string }) {
  return (
    <BadgeCheckIcon
      role="img"
      aria-label="Verified expert"
      className={cn("inline size-4 shrink-0 text-expert", className)}
    />
  )
}

export { ExpertBadge, TeamBadge, VerifiedTick }
