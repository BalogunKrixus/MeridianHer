import {
  ActivityIcon,
  BabyIcon,
  BrainIcon,
  DropletIcon,
  HeartHandshakeIcon,
  HeartIcon,
  SaladIcon,
  SparklesIcon,
  SproutIcon,
  SunsetIcon,
  type LucideIcon,
} from "lucide-react"

/** Token key used in `--space-<key>` and `--space-<key>-ink`. */
export type SpaceTone =
  | "periods"
  | "fertility"
  | "pregnancy"
  | "postpartum"
  | "menopause"
  | "conditions"
  | "sexual"
  | "mind"
  | "nutrition"
  | "body"

export type SpaceMeta = {
  slug: string
  name: string
  tone: SpaceTone
  icon: LucideIcon
}

/** Launch set from PRD section 6.2. Admins will manage these in the database; this is the seed and design reference. */
export const LAUNCH_SPACES: SpaceMeta[] = [
  { slug: "periods", name: "Periods and cycles", tone: "periods", icon: DropletIcon },
  { slug: "fertility", name: "Fertility and TTC", tone: "fertility", icon: SproutIcon },
  { slug: "pregnancy", name: "Pregnancy", tone: "pregnancy", icon: BabyIcon },
  { slug: "postpartum", name: "Postpartum", tone: "postpartum", icon: HeartHandshakeIcon },
  { slug: "menopause", name: "Menopause", tone: "menopause", icon: SunsetIcon },
  { slug: "conditions", name: "PCOS and endometriosis", tone: "conditions", icon: ActivityIcon },
  { slug: "sexual-health", name: "Sexual health", tone: "sexual", icon: HeartIcon },
  { slug: "mental-health", name: "Mental health", tone: "mind", icon: BrainIcon },
  { slug: "nutrition", name: "Nutrition by CyclePlate", tone: "nutrition", icon: SaladIcon },
  { slug: "body", name: "Body and skin", tone: "body", icon: SparklesIcon },
]

/** CSS custom properties that point a component at one space's accent. */
export function spaceToneStyle(tone: SpaceTone): React.CSSProperties {
  return {
    "--tone": `var(--space-${tone})`,
    "--tone-ink": `var(--space-${tone}-ink)`,
  } as React.CSSProperties
}
