import type { JSONContent } from "@tiptap/react"

/**
 * The restricted rich text schema (PRD sections 6.5 and 11): paragraphs, line
 * breaks, bullet and numbered lists, bold, italic and https links. Anything
 * else is dropped. Used on the server before storing, and safe to run again.
 */
const BLOCKS = new Set(["doc", "paragraph", "bulletList", "orderedList", "listItem", "hardBreak", "text"])
const MARKS = new Set(["bold", "italic", "link"])
const MAX_DEPTH = 8

function cleanHref(href: unknown) {
  if (typeof href !== "string") return null
  try {
    const url = new URL(href)
    return url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

function cleanNode(node: JSONContent, depth: number): JSONContent | null {
  if (!node || typeof node !== "object" || !BLOCKS.has(node.type ?? "") || depth > MAX_DEPTH) return null
  if (node.type === "text") {
    if (typeof node.text !== "string" || !node.text) return null
    const marks = (node.marks ?? []).flatMap((m) => {
      if (!MARKS.has(m.type)) return []
      if (m.type !== "link") return [{ type: m.type }]
      const href = cleanHref(m.attrs?.href)
      return href ? [{ type: "link", attrs: { href } }] : []
    })
    return marks.length ? { type: "text", text: node.text, marks } : { type: "text", text: node.text }
  }
  if (node.type === "hardBreak") return { type: "hardBreak" }
  const content = (node.content ?? []).map((c) => cleanNode(c, depth + 1)).filter((c): c is JSONContent => c !== null)
  return content.length ? { type: node.type, content } : node.type === "paragraph" ? { type: "paragraph" } : null
}

export function sanitizeRichText(doc: unknown): JSONContent | null {
  const clean = cleanNode(doc as JSONContent, 0)
  if (!clean || clean.type !== "doc" || !plainText(clean).trim()) return null
  return clean
}

export function plainText(doc: JSONContent | null | undefined): string {
  if (!doc) return ""
  if (doc.type === "text") return doc.text ?? ""
  const sep = doc.type === "doc" || doc.type === "bulletList" || doc.type === "orderedList" ? "\n" : ""
  return (doc.content ?? []).map(plainText).join(sep)
}
