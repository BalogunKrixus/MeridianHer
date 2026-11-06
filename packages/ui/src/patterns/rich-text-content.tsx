import * as React from "react"
import type { JSONContent } from "@tiptap/react"

import { cn } from "../lib/utils"

function renderNode(node: JSONContent, key: React.Key): React.ReactNode {
  const children = node.content?.map((c, i) => renderNode(c, i))
  switch (node.type) {
    case "doc":
      return <React.Fragment key={key}>{children}</React.Fragment>
    case "paragraph":
      return <p key={key}>{children}</p>
    case "bulletList":
      return <ul key={key} className="list-disc pl-5">{children}</ul>
    case "orderedList":
      return <ol key={key} className="list-decimal pl-5">{children}</ol>
    case "listItem":
      return <li key={key}>{children}</li>
    case "hardBreak":
      return <br key={key} />
    case "text": {
      let out: React.ReactNode = node.text
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") out = <strong>{out}</strong>
        else if (mark.type === "italic") out = <em>{out}</em>
        else if (mark.type === "link" && typeof mark.attrs?.href === "string" && mark.attrs.href.startsWith("https://"))
          out = (
            <a href={mark.attrs.href} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-primary underline underline-offset-3">
              {out}
            </a>
          )
      }
      return <React.Fragment key={key}>{out}</React.Fragment>
    }
    default:
      return null
  }
}

/** Renders stored rich text JSON as React elements. Never uses raw HTML. */
function RichTextContent({ doc, className }: { doc: JSONContent | null | undefined; className?: string }) {
  if (!doc) return null
  return <div className={cn("space-y-3 text-body [&_li+li]:mt-1", className)}>{renderNode(doc, "root")}</div>
}

export { RichTextContent }
