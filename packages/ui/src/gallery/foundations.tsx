"use client"

import * as React from "react"
import { cn } from "cn"

import { LAUNCH_SPACES, spaceToneStyle } from "../lib/spaces"
import { SpaceChip } from "../patterns/chips"
import { Label, Row, Section, Specimen } from "./layout"

function luminance(hex: string) {
  const m = hex.trim().replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(m)) return null
  const c = [0, 2, 4]
    .map((i) => parseInt(m.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

function contrast(a: string, b: string) {
  const la = luminance(a)
  const lb = luminance(b)
  if (la === null || lb === null) return null
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Reads token values live, so the swatches always match the stylesheet and theme. */
function useTokens(names: string[], themeKey: string) {
  const [values, setValues] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    setValues(Object.fromEntries(names.map((n) => [n, style.getPropertyValue(`--${n}`).trim()])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey])
  return values
}

const PAIRS: { bg: string; fg: string; use: string; min: number }[] = [
  { bg: "background", fg: "foreground", use: "Page and body text", min: 4.5 },
  { bg: "card", fg: "card-foreground", use: "Cards", min: 4.5 },
  { bg: "background", fg: "muted-foreground", use: "Timestamps, helper text", min: 4.5 },
  { bg: "muted", fg: "muted-foreground", use: "Helper text on quiet surfaces", min: 4.5 },
  { bg: "primary", fg: "primary-foreground", use: "Main action", min: 4.5 },
  { bg: "secondary", fg: "secondary-foreground", use: "Soft buttons, selected", min: 4.5 },
  { bg: "accent", fg: "accent-foreground", use: "Highlight surface", min: 4.5 },
  { bg: "expert", fg: "expert-foreground", use: "Expert badge", min: 4.5 },
  { bg: "expert-soft", fg: "foreground", use: "Pinned expert answer", min: 4.5 },
  { bg: "background", fg: "destructive", use: "Errors", min: 4.5 },
  { bg: "background", fg: "warning", use: "Held content, warnings", min: 4.5 },
  { bg: "background", fg: "success", use: "Approved, resolved", min: 4.5 },
  { bg: "background", fg: "input", use: "Input outlines (non text)", min: 3 },
  { bg: "background", fg: "ring", use: "Focus ring (non text)", min: 3 },
]

const SWATCHES = [
  "background", "foreground", "card", "popover", "primary", "secondary", "muted", "muted-foreground",
  "accent", "accent-foreground", "brand-terracotta", "expert", "expert-soft", "destructive", "warning",
  "success", "border", "input", "ring", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
]

export function Foundations({ themeKey }: { themeKey: string }) {
  const names = React.useMemo(
    () => [...new Set([...SWATCHES, ...PAIRS.flatMap((p) => [p.bg, p.fg]), ...LAUNCH_SPACES.flatMap((s) => [`space-${s.tone}`, `space-${s.tone}-ink`])])],
    []
  )
  const t = useTokens(names, themeKey)

  return (
    <Section
      id="foundations"
      title="Foundations"
      description="Dusk at the Meridian. Values are read live from tokens.css, so switching theme updates every swatch and ratio."
    >
      <Specimen title="Colour tokens" note="Semantic names only in app code. Raw values live in packages/ui/styles/tokens.css.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {SWATCHES.map((n) => (
            <div key={n} className="min-w-0">
              <div className="h-14 rounded-lg ring-1 ring-foreground/10" style={{ background: `var(--${n})` }} />
              <p className="mt-1.5 truncate font-mono text-xs text-foreground">--{n}</p>
              <p className="font-mono text-xs text-muted-foreground uppercase">{t[n]}</p>
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen title="Contrast" note="WCAG 2.2 AA: 4.5:1 for text, 3:1 for control outlines and focus. Also enforced in CI by pnpm check:tokens.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Sample</th>
                <th className="pb-2 font-medium">Pair</th>
                <th className="pb-2 font-medium">Use</th>
                <th className="pb-2 text-right font-medium">Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PAIRS.map((p) => {
                const r = t[p.bg] && t[p.fg] ? contrast(t[p.bg], t[p.fg]) : null
                const pass = r !== null && r >= p.min
                return (
                  <tr key={`${p.bg}-${p.fg}`}>
                    <td className="py-2 pr-3">
                      <span
                        className="inline-flex h-8 w-16 items-center justify-center rounded-md text-sm font-medium ring-1 ring-foreground/10"
                        style={{ background: `var(--${p.bg})`, color: `var(--${p.fg})` }}
                      >
                        {p.min === 3 ? "▢" : "Aa"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">
                      {p.fg} on {p.bg}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.use}</td>
                    <td className={cn("py-2 text-right font-medium tabular-nums whitespace-nowrap", pass ? "text-success" : "text-destructive")}>
                      {r ? `${r.toFixed(2)}:1` : "..."} {r ? (pass ? "Pass" : "Fail") : ""}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Specimen>

      <Specimen title="Space accents" note="Chips use a 15% tint with foreground text. Icons and text in the accent use the ink shade (4.5:1 or better).">
        <div className="grid gap-3 sm:grid-cols-2">
          {LAUNCH_SPACES.map((s) => {
            const ink = t[`space-${s.tone}-ink`]
            const r = ink && t.background ? contrast(ink, t.background) : null
            return (
              <div key={s.slug} className="flex items-center gap-3 rounded-lg bg-background p-2.5" style={spaceToneStyle(s.tone)}>
                <span className="size-8 shrink-0 rounded-full bg-(--tone)" aria-hidden />
                <s.icon className="size-5 shrink-0 text-(--tone-ink)" aria-hidden />
                <SpaceChip name={s.name} tone={s.tone} />
                <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{r ? `${r.toFixed(1)}:1` : ""}</span>
              </div>
            )
          })}
        </div>
      </Specimen>

      <Specimen title="Type" note="Fraunces for headings, Inter for body, Geist Mono for IDs. Switch density to compact to see the admin ramp.">
        <div className="space-y-4">
          <p className="text-display">Every chapter of her life</p>
          <p className="text-h1">Heading one, community questions</p>
          <p className="text-h2">Heading two, space titles</p>
          <p className="text-h3">Heading three, card titles</p>
          <p className="max-w-prose text-body">
            Body. Vagina, vulva, discharge, miscarriage, libido. We say the real words, warmly and without fuss. Yoruba, Igbo and Hausa: ẹ ọ ṣ ị ụ ń ɓ ɗ ƙ.
          </p>
          <p className="text-small text-muted-foreground">Small. Timestamps and helper text.</p>
          <p className="font-mono text-xs text-muted-foreground">Mono. post_8f2c41 · 102.89.x.x</p>
        </div>
      </Specimen>

      <div className="grid gap-10 md:grid-cols-2">
        <Specimen title="Radius">
          <Row>
            {["sm", "md", "lg", "xl", "2xl", "4xl"].map((r) => (
              <div key={r} className="text-center">
                <div className="size-14 bg-secondary" style={{ borderRadius: `var(--radius-${r})` }} />
                <p className="mt-1 font-mono text-xs text-muted-foreground">{r}</p>
              </div>
            ))}
          </Row>
        </Specimen>
        <Specimen title="Elevation" note="Soft shadow instead of hairline borders.">
          <div className="grid grid-cols-2 gap-4 bg-background p-4">
            <div className="rounded-xl bg-card p-4 text-sm shadow-soft">shadow-soft</div>
            <div className="rounded-xl bg-card p-4 text-sm ring-1 ring-border">Hairline, only where a shadow cannot work</div>
          </div>
        </Specimen>
      </div>

      <Specimen title="Accent rules" bare>
        <Label>Primary plum on one main action per screen</Label>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Expert Green only for expert verification and success states.</li>
          <li>Terracotta only for illustration and large highlights, never body text or small buttons.</li>
          <li>No raw colour values in app code. pnpm check:tokens fails the build if one appears.</li>
        </ul>
      </Specimen>
    </Section>
  )
}
