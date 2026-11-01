# Design system audit

Phase 0, step 1 (PRD section 12). Source audited: `C:\Users\Chris\my-design-system` (read only, nothing modified).
Date: 1 Nov 2026.

Files read: `components.json`, `package.json`, `app/globals.css`, `app/layout.tsx`, `lib/utils.ts`, every file in
`components/ui` (35 files), the dashboard block components in `components/`, `hooks/use-mobile.ts`, and the
`.design-sync` notes and conventions.

## 1. Summary

| Question | Answer |
| --- | --- |
| Tailwind version (PRD open question, section 16) | **Tailwind v4.** No `tailwind.config`; tokens live in a `@theme inline` block in `app/globals.css`. |
| shadcn style | `base-nova`, base colour `neutral`, CSS variables on, icon library lucide |
| Primitive library | **Base UI (`@base-ui/react` 1.9), not Radix.** The PRD says Radix in section 11. See decision D2. |
| Framework | **Next 16.4.2, React 19.3.** The PRD says Next 15. See decision D1. |
| Class merge helper | `cn` package 0.5 (shadcn's compiled replacement for `clsx` + `tailwind-merge`) |
| Brand layer | **None yet.** Stock neutral greyscale palette, Geist font, default radius. Nothing from section 12 exists. |
| Custom components | No custom primitives. Three small local fixes to stock files (listed in section 6). One stock block (dashboard-01). |
| Overall | A clean, current, stock shadcn foundation. Every primitive the PRD lists exists except `Form`. All brand tokens, the serif font and every MeridianHer pattern are gaps to build. |

## 2. Colour tokens (current)

All values are oklch and achromatic (chroma 0) except `destructive` and dark `sidebar-primary`.

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `oklch(1 0 0)` white | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--card-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.205 0 0)` near black | `oklch(0.922 0 0)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` red | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |
| `--chart-1` to `--chart-5` | greys 0.87 to 0.269 | same greys |
| `--sidebar`, `--sidebar-foreground` | `0.985` / `0.145` | `0.205` / `0.985` |
| `--sidebar-primary`, `-foreground` | `0.205` / `0.985` | `oklch(0.488 0.243 264.376)` blue / `0.985` |
| `--sidebar-accent`, `-foreground` | `0.97` / `0.205` | `0.269` / `0.985` |
| `--sidebar-border`, `--sidebar-ring` | `0.922` / `0.708` | `1 0 0 / 10%` / `0.556` |

Dark mode is class based: `@custom-variant dark (&:is(.dark *))`. `next-themes` is installed and used by the Toaster.

## 3. Radius, spacing, fonts, shadows

**Radius.** `--radius: 0.625rem` (10px). Scale derived in `@theme`: `sm` 0.6x (6px), `md` 0.8x (8px), `lg` 1x (10px),
`xl` 1.4x (14px), `2xl` 1.8x, `3xl` 2.2x, `4xl` 2.6x. Buttons and inputs use `rounded-lg`, cards `rounded-xl`, badges `rounded-4xl` (pill).

**Spacing.** Tailwind v4 default (`--spacing: 0.25rem`). No custom spacing scale. Card padding is a local variable
`--card-spacing` (16px, or 12px for `size="sm"`). Controls are compact: Button and Input default height 32px (`h-8`),
table head 40px, cells `p-2`. This density already suits admin; community will want larger touch targets (see G9).

**Fonts.** Geist (`--font-sans`) and Geist Mono (`--font-mono`) via `next/font/google`, Latin subset only.
`--font-heading` exists and maps to `--font-sans`; `CardTitle` and dialog/sheet titles already use `font-heading`.
That is a ready hook for the serif display face. No serif font is installed.

**Shadows.** Stock Tailwind scale only, no custom shadow tokens. Usage in components: `shadow-sm` (tabs active,
floating sidebar), `shadow-md` (dropdown, popover, select), `shadow-lg` (sheet, submenu), `shadow-xl` (one). **Cards use
`ring-1 ring-foreground/10`, a hairline, not a shadow.** The PRD wants soft shadows instead of borders, so Card needs a brand variant.

**Motion.** `tw-animate-css` enter and exit animations on overlays; drawer uses long eased transitions. No
`motion-reduce:` handling anywhere in `components/ui` (see G8).

## 4. Components and variants

All 35 files in `components/ui`. "Sync" means it is included in the design-sync bundle (32 families); three files are not.

| Component | Base | Variants and props | Sync |
| --- | --- | --- | --- |
| Alert (+ Title, Description, Action) | div | `variant`: default, destructive | Yes |
| Avatar (+ Image, Fallback, Badge, Group, GroupCount) | Base UI Avatar | `size`: sm 24px, default 32px, lg 40px | Yes |
| Badge | `useRender` span | `variant`: default, secondary, destructive, outline, ghost, link. `render` prop | Yes |
| Breadcrumb (+ List, Item, Link, Page, Separator, Ellipsis) | nav | none | Yes |
| Button | Base UI Button | `variant`: default, outline, secondary, ghost, destructive (soft red), link. `size`: xs, sm, default, lg, icon, icon-xs, icon-sm, icon-lg | Yes |
| Calendar (+ DayButton) | react-day-picker 10 | `buttonVariant`, `captionLayout` | Yes |
| Card (+ Header, Title, Description, Action, Content, Footer) | div | `size`: default, sm | Yes |
| Chart (Container, Tooltip, TooltipContent, Legend, LegendContent, Style) | Recharts 3 | `ChartConfig` per series; tooltip `indicator`: dot, line, dashed | Yes |
| Checkbox | Base UI Checkbox | none | Yes |
| Command (+ Dialog, Input, List, Empty, Group, Item, Separator, Shortcut) | cmdk 1.1 | `CommandDialog showCloseButton` | Yes |
| Dialog (+ Trigger, Portal, Close, Overlay, Content, Header, Footer, Title, Description) | Base UI Dialog | `showCloseButton` on Content and Footer | Yes |
| Drawer (+ Trigger, Close, Content, Header, Footer, Title, Description, SwipeHandle) | Base UI Drawer | swipe direction, snap points, nested stacking | **No** |
| DropdownMenu (+ 14 parts incl. Checkbox, Radio, Sub) | Base UI Menu | Item `variant`: default, destructive; `inset` | Yes |
| Empty (+ Header, Media, Title, Description, Content) | div | Media `variant`: default, icon | Yes |
| Field (+ Set, Legend, Group, Content, Label, Title, Description, Separator, Error) | div / fieldset | `orientation`: vertical, horizontal, responsive. Legend `variant`: legend, label | Yes |
| Input | Base UI Input | none | Yes |
| InputGroup (+ Addon, Button, Text, Input, Textarea) | div | Addon `align`: inline-start, inline-end, block-start, block-end. Button `size`: xs, sm, icon-xs, icon-sm | Yes |
| Label | label | none | Yes |
| Popover (+ Trigger, Content, Header, Title, Description) | Base UI Popover | `side`, `align`, offsets | Yes |
| Progress (+ Track, Indicator, Label, Value) | Base UI Progress | none | Yes |
| RadioGroup (+ Item) | Base UI Radio | none | Yes |
| ScrollArea (+ ScrollBar) | Base UI ScrollArea | `orientation` | Yes |
| Select (+ Group, Value, Trigger, Content, Label, Item, Separator, Scroll buttons) | Base UI Select | Trigger `size`: sm, default. Root needs `items` | Yes |
| Separator | Base UI Separator | `orientation` | Yes |
| Sheet (+ Trigger, Close, Content, Header, Footer, Title, Description) | Base UI Dialog | `side`: top, right, bottom, left; `showCloseButton` | Yes |
| Sidebar (Provider + 22 parts) | custom + Base UI | `variant`: sidebar, floating, inset. `collapsible`: offcanvas, icon, none. MenuButton `variant`: default, outline; `size`: sm, default, lg. Ctrl+B toggle | Yes |
| Skeleton | div | none | Yes |
| Sonner (Toaster) | sonner 2 | theme from next-themes, lucide icons per type | Yes |
| Switch | Base UI Switch | `size`: sm, default | Yes |
| Table (+ Header, Body, Footer, Row, Head, Cell, Caption) | table | none | Yes |
| Tabs (+ List, Trigger, Content) | Base UI Tabs | List `variant`: default (pill), line (underline) | Yes |
| Textarea | textarea | auto grows (`field-sizing-content`) | Yes |
| Toggle | Base UI Toggle | `variant`: default, outline. `size`: sm, default, lg | **No** |
| ToggleGroup (+ Item) | Base UI ToggleGroup | inherits Toggle variants; `spacing`, `orientation` | **No** |
| Tooltip (+ Trigger, Content, Provider) | Base UI Tooltip | `side`, `align`; styles a nested `kbd` slot | Yes |

Hook: `useIsMobile()` (breakpoint 768px).

## 5. Components outside `components/ui`

Stock shadcn **dashboard-01** block, not custom primitives: `app-sidebar`, `nav-main`, `nav-documents`, `nav-secondary`,
`nav-user`, `site-header`, `section-cards`, `chart-area-interactive`, `data-table` (TanStack Table 9 + dnd-kit row
reordering + Drawer row detail + Zod row schema). Not part of the design system, but a good reference for the admin
shell, StatCard and DataTable patterns.

## 6. Local changes to stock shadcn

1. Checkbox and RadioGroupItem use `data-disabled:opacity-50` (Base UI renders a span, so `:disabled` never matched).
2. Toaster sets `fontFamily: var(--font-sans)` (sonner forces a system font otherwise).
3. Label dims via `group-data-[disabled=true]`; its `peer-disabled:` rule is still blind to Base UI spans (known, unfixed).
4. `app/layout.tsx` font variable renamed to `--font-sans` so `@theme` resolves.

These fixes carry over when the files are copied into `packages/ui`.

## 7. PRD primitives checklist (section 12, step 2)

| PRD primitive | Status |
| --- | --- |
| Button, Input, Textarea, Select, Dialog, Sheet, DropdownMenu, Tabs, Tooltip, Avatar, Badge, Card, Skeleton, Command, Table | Present |
| Toast | Present as Sonner `Toaster` + `toast()` |
| Form | **Missing.** No `form.tsx` (react-hook-form). The Field family replaces it in this style. Recommend Field + Zod + server actions, no react-hook-form. |

## 8. Gaps

### Tokens (all missing, all in section 12)

| ID | Gap |
| --- | --- |
| G1 | Every shadcn token needs the Dusk at the Meridian values (cream, Night, Plum, Plum Mist, etc.), light and dark |
| G2 | New semantic tokens: `--brand-terracotta`, `--expert`, `--expert-foreground`, `--expert-soft`, `--warning`, `--success` (plus matching foregrounds), registered in `@theme` so `bg-expert` etc. work |
| G3 | Ten `--space-*` accent tokens, plus a tint utility (15% chip and avatar backgrounds) |
| G4 | `--shadow-soft` token and a `shadow-soft` utility; Card variant using it instead of the ring |
| G5 | Serif display face on `--font-heading`, heading type ramp, plus a denser admin ramp |
| G6 | Chart tokens are greyscale; admin charts need brand colours. Sidebar tokens need brand values |

### Primitives worth adding to the package (stock shadcn, not in the local project)

| ID | Gap | Needed for |
| --- | --- | --- |
| G7 | **AlertDialog** | Confirm ban, delete account, revoke expert |
| G7 | **Kbd** | Moderation shortcuts (A, H, W, M, B, E), Ctrl+K palette. Tooltip already styles it |
| G7 | **Accordion / Collapsible** | Guidelines, crisis resources, replies collapse |
| G7 | **HoverCard** | Expert preview on badge hover |
| G7 | **Spinner** | Post submit, "being checked" state |
| G7 | **ButtonGroup** | Reaction bar; Button already references a `button-group` slot |
| G7 | **Pagination** | Admin tables (feed uses cursor infinite scroll) |
| G7 | Tiptap editor wrapper | Composer (restricted schema) |

### Quality gaps

| ID | Gap |
| --- | --- |
| G8 | No `prefers-reduced-motion` handling. Needs a global `motion-reduce` override for overlay animations and the drawer |
| G9 | Default controls are 32px high. Community touch targets on 360px phones should be at least 44px (WCAG 2.5.8 minimum is 24px; 44px is our bar for the community app). Add a comfortable density for community, keep compact for admin |
| G10 | Focus ring is `ring-ring/50`. With Plum at 50% on cream that is **2.66:1**, below the 3:1 non-text minimum. Use the full `--ring` colour for the ring in the brand layer |
| G11 | No automated contrast check or hex lint rule yet (both required by section 12) |
| G12 | Geist is loaded with the Latin subset only. P2 content in Yoruba, Igbo and Hausa needs characters such as ẹ, ọ, ṣ (Latin Extended Additional). Inter and Fraunces both cover these; Geist coverage is unverified. Matters for decision D4 |

### Patterns (all missing, all to build)

PostCard, ReplyThread, ExpertBadge, TeamBadge, SpaceChip, TagChip, ReactionBar, ContentWarningBlur, Composer,
EmptyState (wraps `Empty`), SignInSheet, GuidelinesCard, CrisisCard. Admin: DataTable (TanStack Table), StatCard,
QueueItem, FilterBar, AuditRow. Plus a `/design` gallery or Storybook.

## 9. Contrast check of the PRD's proposed tokens

I computed WCAG 2.2 ratios for the section 12 table. Dark mode passes everywhere. Light mode has four problems.

| Pair | Ratio | Result |
| --- | --- | --- |
| Plum on white (primary button) | 10.73 | Pass (PRD says 10.7, correct) |
| Night on cream (body) | 16.08 | Pass |
| `muted-foreground` on cream | 5.34 | Pass (PRD says 5.3, correct) |
| `muted-foreground` on `muted` (input helper text) | 4.91 | Pass |
| `accent-foreground` on `accent` | 4.55 | Pass, only just |
| Expert Green on white | 6.29 | Pass |
| Expert Green on `expert-soft` | 5.40 | Pass |
| Destructive on cream | 6.16 | Pass |
| **Warning #B7791F on cream** | **3.43** | **Fails AA for text.** Proposed fix: **#8A5A12** (5.57 on cream, 5.91 with white text). Dark value #E8B464 is fine |
| Terracotta on white | 3.63 | Fails for text, as the PRD already says. Large highlights only |
| **Input border #E2DAD2 on cream** | **1.30** | **Fails 3:1 non-text contrast** for control boundaries. Proposed fix: **#8F857C** (3.41). Keep #E8E1DA for decorative hairlines |
| **Focus ring at 50% opacity** | **2.66** | **Fails 3:1.** See G10 |

Space accents with Night text on a 15% tint all pass (12.9 to 14.5). That confirms the PRD's chip approach.
White text fails on most accents, also as the PRD expects. One more issue: when the accent itself is the **icon
colour** (3:1 needed), three fail on cream: Fertility #D08C60 (2.60), Pregnancy #E0A33E (2.09), Nutrition #7C9A65 (2.97).
Fix: darker icon shades for those three, or always place icons on the tint with Night.

## 10. How `packages/ui` will consume this

The design system stays untouched. Its `components/ui` files get **copied** into `packages/ui/src/components`, with
`@/components/ui/*` imports rewritten to package-relative paths. Its dependencies (`@base-ui/react`, `cva`, `cn`,
`lucide-react`, `cmdk`, `sonner`, `recharts`, `react-day-picker`, `tw-animate-css`) become `packages/ui` dependencies.
The brand layer then goes on top in `styles/tokens.css`, plus a shared Tailwind v4 CSS preset that both apps `@import`.
Tailwind v4 has no JS preset, so the "shared Tailwind preset" in section 12 is a CSS file with `@theme` and `@source`.

## 11. Decisions I need from you before building

| # | Decision | My recommendation |
| --- | --- | --- |
| D1 | Next 15 (PRD) or Next 16 (your design system)? | **Next 16.** Matches the components you have already tested. I will update section 11 of the PRD to match |
| D2 | Radix (PRD) or Base UI (your design system)? | **Base UI.** Your system is built on it. Switching means rewriting every primitive. Triggers use `render={...}` instead of `asChild` |
| D3 | Accept the three token fixes in section 9 (warning #8A5A12, input border #8F857C, solid focus ring)? | **Yes** |
| D4 | Fonts: which serif, which sans? | **Fraunces** for headings, **Inter** for body, both self-hosted via `next/font` with Latin + Latin Extended + Vietnamese subsets, for the Yoruba, Igbo and Hausa characters (G12). Keep Geist Mono for admin IDs |
| D5 | Add the stock primitives in G7 (AlertDialog, Kbd, Accordion, Collapsible, HoverCard, Spinner, ButtonGroup, Pagination)? | **Yes**, added to `packages/ui` only, not to your design system |
| D6 | Gallery: Storybook or a `/design` route in each app? | **`/design` route.** Lighter, no extra toolchain on Windows, uses the real app providers |
| D7 | MeridianHer logo | Needed before the token layer ships (PRD open question). I can use a text wordmark placeholder until then |

Once you approve this audit and answer D1 to D7, I will scaffold the monorepo and build `packages/ui`.

## 12. Decisions (approved 1 Nov 2026)

All seven recommendations accepted: Next 16 (D1), Base UI (D2), the three token fixes (D3), Fraunces with Inter (D4),
the extra stock components (D5), a `/design` route in each app (D6), text wordmark until the logo arrives (D7).
Also requested: reduced motion across every component, and 44px touch targets on mobile while desktop admin stays at 32px.
Implementation notes are in `packages/ui/README.md`. PRD section 11 updated for D1 and D2.
