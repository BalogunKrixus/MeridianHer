# @meridianher/ui

The only source of UI for both apps (PRD section 12). Built from `C:\Users\Chris\my-design-system`
(shadcn base nova on Base UI, Tailwind v4), copied in and branded. The source project is never modified.

## Use it in an app

```css
/* app/globals.css */
@import "tailwindcss";
@import "@meridianher/ui/styles/preset.css";
```

```tsx
import { Button } from "@meridianher/ui/components/button"
import { PostCard } from "@meridianher/ui/patterns/post-card"
```

Apps need `transpilePackages: ["@meridianher/ui"]` and the two fonts in `app/fonts.ts`
(Geist `--font-geist-sans`, Geist Mono `--font-geist-mono`).
Admin sets `data-density="compact"` on `<html>` for the denser type ramp.

## Layout

| Path | What |
| --- | --- |
| `styles/tokens.css` | Every colour, shadow and type size. The only file allowed raw colour values |
| `styles/preset.css` | Tailwind v4 preset: theme mapping, `touch:` variant, `tap-target`, type utilities, reduced motion |
| `src/components` | Primitives from your design system (plus Kbd and Spinner from the registry), only the ones a pattern or screen uses |
| `src/patterns` | PostCard, ReplyThread, ExpertAnswer, badges, chips, ReactionBar, ContentWarningBlur, Composer, RichTextEditor, SignInSheet, GuidelinesCard, CrisisCard, EmptyState, DataTable, StatCard, FilterBar, QueueItem, AuditRow |
| `src/gallery` | The `/design` review page, rendered by both apps |
| `scripts/check-tokens.mjs` | Contrast check on 88 token pairs plus the raw colour guard |

## Rules

**Composition.** Apps use package components only: no raw button, input, card or similar where a component exists. If
something is missing, add it here first (`pnpm dlx shadcn add <name>` from `packages/ui`), then use it. A primitive stays in the
package only while a pattern or screen imports it. Card and Badge take a `render` prop for semantic elements
(`render={<article />}`, `render={<a href="..." />}`). Merge classes with `cn` from `src/lib/utils`, which knows the type ramp
(`text-h2` overrides `text-base`).

**Touch targets.** On phones and touch screens (`pointer: coarse` or narrower than 768px) every control is at least 44px.
Buttons, inputs, selects, tabs lists, toggles, menu items, sidebar items and calendar days grow visually through the
`touch:` variant. Controls that stay visually small (checkbox, radio, switch, small icon buttons, chips, tab triggers)
get an invisible 44px hit area from the `tap-target` utility, which needs a positioned element (`relative`).
Desktop with a mouse keeps the compact 32px controls. New interactive components must use one of the two.

**Reduced motion.** `preset.css` sets every animation and transition to 0.01ms under `prefers-reduced-motion: reduce`,
which covers tw-animate-css, Base UI transitions, sheets and spinners. Recharts honours the setting itself. Motion driven
from JavaScript must check the media query too.

**Colour.** Semantic utilities only (`bg-card`, `text-muted-foreground`, `bg-expert`, `text-(--tone-ink)`). Space accents
come from `spaceToneStyle(tone)`. Expert Green is only for verification and success.

## Checks

```powershell
pnpm check:tokens   # contrast plus raw colour guard, fails with exit code 1
pnpm typecheck
```
