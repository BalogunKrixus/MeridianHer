"use client"

import * as React from "react"
import { TriangleAlertIcon, XIcon } from "lucide-react"

import { Alert, AlertDescription } from "../components/alert"
import { Button } from "../components/button"
import { Spinner } from "../components/spinner"
import { RichTextEditor, type JSONContent } from "./rich-text-editor"

/** Reply box under a post (PRD 6.6). Shows who she is replying to when it is a reply to a reply. */
function ReplyComposer({
  replyingTo,
  onCancelReplyTo,
  onSubmit,
  disabledReason,
}: {
  replyingTo?: string
  onCancelReplyTo?: () => void
  /** Resolve with an error message to show it; on success the box clears */
  onSubmit: (body: JSONContent) => Promise<{ error?: string } | void>
  /** When set, the box is replaced by this message (for example a locked post) */
  disabledReason?: string
}) {
  const [body, setBody] = React.useState<{ json: JSONContent; text: string }>()
  const [editorKey, setEditorKey] = React.useState(0)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  if (disabledReason) return <p className="text-small text-muted-foreground">{disabledReason}</p>

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body?.text.trim()) return
    setPending(true)
    setError(undefined)
    const result = await onSubmit(body.json)
    setPending(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setBody(undefined)
    setEditorKey((k) => k + 1)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" aria-label="Write a reply">
      {replyingTo ? (
        <p className="flex items-center gap-2 text-small text-muted-foreground">
          Replying to <span className="font-medium text-foreground">{replyingTo}</span>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Reply to the post instead" onClick={onCancelReplyTo}>
            <XIcon />
          </Button>
        </p>
      ) : null}
      <RichTextEditor key={editorKey} onChange={setBody} placeholder="Share your experience. Kind words only." aria-label="Your reply" />
      {error ? (
        <Alert variant="destructive" role="alert">
          <TriangleAlertIcon aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="self-end" disabled={pending || !body?.text.trim()}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Post reply
      </Button>
    </form>
  )
}

export { ReplyComposer }
