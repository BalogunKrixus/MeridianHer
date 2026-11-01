// Token guard (PRD section 12): WCAG 2.2 AA contrast on every token pair in
// light and dark, and no raw colour values outside styles/tokens.css.
// Runs in PowerShell or any shell: pnpm check:tokens
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const uiRoot = path.resolve(here, "..")
const repoRoot = path.resolve(uiRoot, "../..")
const tokensFile = path.join(uiRoot, "styles", "tokens.css")
const css = fs.readFileSync(tokensFile, "utf8")

function block(selector) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`Missing ${selector} block in tokens.css`)
  const body = css.slice(start, css.indexOf("\n}", start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]))
}

const light = block(":root")
const dark = { ...light, ...block(".dark") }

function lum(hex) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT = 4.5
const UI = 3
const spaces = ["periods", "fertility", "pregnancy", "postpartum", "menopause", "conditions", "sexual", "mind", "nutrition", "body"]
const pairs = [
  ["foreground", "background", TEXT],
  ["card-foreground", "card", TEXT],
  ["popover-foreground", "popover", TEXT],
  ["muted-foreground", "background", TEXT],
  ["muted-foreground", "card", TEXT],
  ["muted-foreground", "muted", TEXT],
  ["primary-foreground", "primary", TEXT],
  ["primary", "background", TEXT],
  ["secondary-foreground", "secondary", TEXT],
  ["accent-foreground", "accent", TEXT],
  ["expert-foreground", "expert", TEXT],
  ["expert", "expert-soft", TEXT],
  ["foreground", "expert-soft", TEXT],
  ["destructive", "background", TEXT],
  ["destructive", "card", TEXT],
  ["warning", "background", TEXT],
  ["warning", "card", TEXT],
  ["warning-foreground", "warning", TEXT],
  ["success", "background", TEXT],
  ["success-foreground", "success", TEXT],
  ["input", "background", UI],
  ["input", "card", UI],
  ["ring", "background", UI],
  ["ring", "card", UI],
  ...spaces.flatMap((s) => [
    [`space-${s}-ink`, "background", TEXT],
    [`space-${s}-ink`, "card", TEXT],
  ]),
]

let failures = 0
for (const [mode, t] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg, min] of pairs) {
    if (!t[fg] || !t[bg]) {
      console.log(`  MISSING ${mode}: --${fg} or --${bg}`)
      failures++
      continue
    }
    const r = ratio(t[fg], t[bg])
    if (r < min) {
      console.log(`  FAIL ${mode}: --${fg} on --${bg} = ${r.toFixed(2)}:1 (needs ${min}:1)`)
      failures++
    }
  }
}
console.log(failures ? `Contrast: ${failures} problem(s)` : `Contrast: ${pairs.length * 2} pairs pass WCAG 2.2 AA`)

// Raw colour guard
const COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/gi
// Attribute selectors that match Recharts' own default colours, not styling with them
const ALLOWED = /\[(?:stroke|fill)='#[0-9a-f]{3,6}'\]/gi
const roots = [path.join(uiRoot, "src"), path.join(uiRoot, "styles"), path.join(repoRoot, "apps")]
const skip = new Set(["node_modules", ".next", ".turbo"])
let hexHits = 0

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(tsx?|css|mjs)$/.test(entry.name) && full !== tokensFile) {
      const lines = fs.readFileSync(full, "utf8").split(/\r?\n/)
      lines.forEach((line, i) => {
        const cleaned = line.replace(ALLOWED, "")
        if (COLOUR.test(cleaned)) {
          console.log(`  RAW COLOUR ${path.relative(repoRoot, full)}:${i + 1}: ${line.trim().slice(0, 100)}`)
          hexHits++
        }
        COLOUR.lastIndex = 0
      })
    }
  }
}
roots.forEach(walk)
console.log(hexHits ? `Raw colours: ${hexHits} found outside tokens.css` : "Raw colours: none outside tokens.css")

process.exit(failures || hexHits ? 1 : 0)
