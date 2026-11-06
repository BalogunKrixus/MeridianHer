"use client"

import * as React from "react"
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { cn } from "../lib/utils"
import { BoldIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon } from "lucide-react"

import { Toggle } from "../components/toggle"

/**
 * Restricted Tiptap editor: bold, italic, lists and links only (PRD section 11).
 * Output is JSON; the server sanitises it again before storing.
 */
function RichTextEditor({
  id,
  defaultValue,
  onChange,
  placeholder,
  maxLength = 5000,
  invalid,
  className,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
}: {
  id?: string
  defaultValue?: JSONContent
  onChange?: (value: { json: JSONContent; text: string }) => void
  placeholder?: string
  maxLength?: number
  invalid?: boolean
  className?: string
  "aria-describedby"?: string
  "aria-label"?: string
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["https"] },
      }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        ...(placeholder ? { "aria-placeholder": placeholder } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class:
          "min-h-32 px-3 py-2.5 text-body outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline [&_p+p]:mt-2",
      },
    },
    onUpdate: ({ editor }) => onChange?.({ json: editor.getJSON(), text: editor.getText() }),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            bullet: editor.isActive("bulletList"),
            ordered: editor.isActive("orderedList"),
            link: editor.isActive("link"),
            length: editor.getText().length,
            empty: editor.isEmpty,
          }
        : null,
  })

  function toggleLink() {
    if (!editor) return
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt("Paste a link (https only)")
    if (url && /^https:\/\//i.test(url)) editor.chain().focus().setLink({ href: url }).run()
  }

  const tools = [
    { label: "Bold", icon: BoldIcon, pressed: state?.bold, run: () => editor?.chain().focus().toggleBold().run() },
    { label: "Italic", icon: ItalicIcon, pressed: state?.italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Bulleted list", icon: ListIcon, pressed: state?.bullet, run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrderedIcon, pressed: state?.ordered, run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "Link", icon: LinkIcon, pressed: state?.link, run: toggleLink },
  ]

  const length = state?.length ?? 0
  const over = length > maxLength

  return (
    <div
      data-invalid={invalid || over || undefined}
      className={cn(
        "rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring data-invalid:border-destructive",
        className
      )}
    >
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-border p-1">
        {tools.map(({ label, icon: Icon, pressed, run }) => (
          <Toggle
            key={label}
            size="sm"
            aria-label={label}
            pressed={!!pressed}
            onPressedChange={run}
            // Keep focus (and the caret) in the editor while formatting
            onMouseDown={(e) => e.preventDefault()}
          >
            <Icon />
          </Toggle>
        ))}
      </div>
      <div className="relative">
        {state?.empty && placeholder ? (
          <p aria-hidden className="pointer-events-none absolute top-2.5 left-3 text-body text-muted-foreground">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
      <p className={cn("px-3 pb-2 text-right text-xs tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
        {length.toLocaleString()} / {maxLength.toLocaleString()}
      </p>
    </div>
  )
}

export { RichTextEditor, type JSONContent }
