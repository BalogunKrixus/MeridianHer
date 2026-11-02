import * as React from "react"
import { cn } from "../lib/utils"
import { XIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "../components/avatar"
import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { spaceToneStyle, type SpaceTone } from "../lib/spaces"

/** Space chip in the space accent tint (PRD section 12). Renders a link when `href` is set. */
function SpaceChip({
  name,
  tone,
  href,
  icon: Icon,
  className,
}: {
  name: string
  tone: SpaceTone
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <Badge
      variant="space"
      style={spaceToneStyle(tone)}
      className={className}
      render={href ? <a href={href} /> : undefined}
    >
      {Icon ? <Icon aria-hidden /> : null}
      <span className="truncate">{name}</span>
    </Badge>
  )
}

/** Tag chip: static label, link, or removable (active filters). Pressable tags use ToggleGroup with the chip variant. */
function TagChip({
  label,
  href,
  onRemove,
  className,
}: {
  label: string
  href?: string
  onRemove?: () => void
  className?: string
}) {
  return (
    <Badge variant="tag" className={cn(onRemove && "pr-1", className)} render={href ? <a href={href} /> : undefined}>
      {label}
      {onRemove ? (
        <Button variant="ghost" size="icon-xs" className="size-4 rounded-full" onClick={onRemove} aria-label={`Remove ${label}`}>
          <XIcon />
        </Button>
      ) : null}
    </Badge>
  )
}

/** Avatar with the display name's initial in the space accent tint. Never a photo for members. */
function InitialAvatar({
  name,
  tone,
  size,
  className,
}: {
  name: string
  tone?: SpaceTone
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  return (
    <Avatar size={size} aria-hidden className={className} style={tone ? spaceToneStyle(tone) : undefined}>
      <AvatarFallback
        className={cn(
          "font-medium",
          tone ? "bg-[color-mix(in_oklab,var(--tone)_18%,var(--card))] text-foreground" : "bg-secondary text-secondary-foreground"
        )}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  )
}

export { SpaceChip, TagChip, InitialAvatar }
