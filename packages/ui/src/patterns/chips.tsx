import * as React from "react"
import { cn } from "cn"
import { XIcon } from "lucide-react"

import { spaceToneStyle, type SpaceTone } from "../lib/spaces"

/**
 * Space chip: 15% accent tint with foreground text (PRD section 12, space
 * accents). Renders a link when `href` is set.
 */
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
  const classes = cn(
    "relative inline-flex h-6 max-w-full items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--tone)_15%,transparent)] px-2.5 text-xs font-medium text-foreground",
    href && "tap-target transition-colors hover:bg-[color-mix(in_oklab,var(--tone)_25%,transparent)] focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
    className
  )
  const content = (
    <>
      {Icon ? (
        <Icon className="size-3.5 shrink-0 text-(--tone-ink)" aria-hidden />
      ) : (
        <span className="size-1.5 shrink-0 rounded-full bg-(--tone)" aria-hidden />
      )}
      <span className="truncate">{name}</span>
    </>
  )
  return href ? (
    <a href={href} className={classes} style={spaceToneStyle(tone)}>
      {content}
    </a>
  ) : (
    <span className={classes} style={spaceToneStyle(tone)}>
      {content}
    </span>
  )
}

/**
 * Tag chip. Static label, link, or a pressable filter chip (pass `pressed`).
 * Filter chips are 44px tall on touch.
 */
function TagChip({
  label,
  href,
  pressed,
  onPressedChange,
  onRemove,
  className,
}: {
  label: string
  href?: string
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  onRemove?: () => void
  className?: string
}) {
  const base =
    "relative inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
  if (pressed !== undefined) {
    return (
      <button
        type="button"
        aria-pressed={pressed}
        onClick={() => onPressedChange?.(!pressed)}
        className={cn(
          base,
          "h-8 px-3 text-sm touch:h-11 touch:px-4",
          pressed
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground shadow-soft hover:bg-secondary",
          className
        )}
      >
        {label}
      </button>
    )
  }
  if (href) {
    return (
      <a href={href} className={cn(base, "tap-target bg-muted text-muted-foreground hover:text-foreground", className)}>
        {label}
      </a>
    )
  }
  return (
    <span className={cn(base, "bg-muted text-muted-foreground", className)}>
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="relative tap-target -mr-1 rounded-full p-0.5 hover:bg-foreground/10"
        >
          <XIcon className="size-3" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}

/** Avatar circle with the display name's initial in the space accent tint. Never a photo for members. */
function InitialAvatar({
  name,
  tone,
  size = "default",
  className,
}: {
  name: string
  tone?: SpaceTone
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?"
  return (
    <span
      aria-hidden
      style={tone ? spaceToneStyle(tone) : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-heading font-medium text-foreground select-none",
        tone ? "bg-[color-mix(in_oklab,var(--tone)_18%,var(--card))]" : "bg-secondary text-secondary-foreground",
        size === "sm" && "size-6 text-xs",
        size === "default" && "size-8 text-sm",
        size === "lg" && "size-12 text-lg",
        className
      )}
    >
      {initial}
    </span>
  )
}

export { SpaceChip, TagChip, InitialAvatar }
