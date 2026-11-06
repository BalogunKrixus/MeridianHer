"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileCheckIcon, UploadIcon, XIcon } from "lucide-react"
import { Alert, AlertDescription } from "@meridianher/ui/components/alert"
import { Button } from "@meridianher/ui/components/button"
import { Checkbox } from "@meridianher/ui/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@meridianher/ui/components/field"
import { Input } from "@meridianher/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meridianher/ui/components/select"
import { Spinner } from "@meridianher/ui/components/spinner"
import { toast } from "@meridianher/ui/components/sonner"
import { Textarea } from "@meridianher/ui/components/textarea"
import { TagChip } from "@meridianher/ui/patterns/chips"

import { prepareDocumentUpload, submitApplication, type ApplicationInput } from "@/lib/account-actions"

type Doc = { name: string; path: string }

export function ApplyForm({
  invite,
  initial,
  categories,
}: {
  invite?: string
  initial?: { legal_name?: string; category?: string }
  categories: { value: string; label: string }[]
}) {
  const router = useRouter()
  const [category, setCategory] = React.useState(initial?.category ?? "")
  const [specialties, setSpecialties] = React.useState<string[]>([])
  const [specialty, setSpecialty] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [docs, setDocs] = React.useState<Doc[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [consent, setConsent] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const fileRef = React.useRef<HTMLInputElement>(null)

  function addSpecialty() {
    const value = specialty.trim()
    if (value && specialties.length < 3 && !specialties.includes(value)) setSpecialties([...specialties, value])
    setSpecialty("")
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files).slice(0, 3 - docs.length)) {
      const prepared = await prepareDocumentUpload(file.type, file.size)
      if (prepared.error || !prepared.url || !prepared.path) {
        toast.error(prepared.error ?? "Upload failed")
        continue
      }
      const response = await fetch(prepared.url, { method: "PUT", body: file, headers: { "content-type": file.type } })
      if (!response.ok) {
        toast.error(`We could not upload ${file.name}. Please try again.`)
        continue
      }
      setDocs((d) => [...d, { name: file.name, path: prepared.path! }])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const text = (key: string) => String(form.get(key) ?? "")
        const input: ApplicationInput = {
          legal_name: text("legal_name"),
          title: text("title"),
          category: category as ApplicationInput["category"],
          category_other: text("category_other") || undefined,
          specialties: specialty.trim() && specialties.length < 3 ? [...specialties, specialty.trim()] : specialties,
          licensing_body: text("licensing_body"),
          licence_number: text("licence_number"),
          country: text("country"),
          years_in_practice: text("years_in_practice"),
          workplace: text("workplace") || undefined,
          profile_url: text("profile_url"),
          bio,
          document_paths: docs.map((d) => d.path),
          consent: consent as true,
        }
        setPending(true)
        const result = await submitApplication(input, invite)
        setPending(false)
        if (result.error) {
          setError(result.error)
          return
        }
        toast.success("Application sent. Thank you.")
        router.refresh()
      }}
    >
      <FieldSet>
        <FieldLegend>About you</FieldLegend>
        <FieldDescription>Your legal name is only seen by our verification team. You choose a public name after approval.</FieldDescription>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="legal_name">Full legal name</FieldLabel>
            <Input id="legal_name" name="legal_name" required minLength={3} defaultValue={initial?.legal_name} autoComplete="name" />
          </Field>
          <Field>
            <FieldLabel htmlFor="title">Professional title</FieldLabel>
            <Input id="title" name="title" required placeholder="Consultant gynaecologist" />
          </Field>
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select items={categories} value={category || null} onValueChange={(v) => setCategory((v as string) ?? "")}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Choose your field" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="years_in_practice">Years in practice</FieldLabel>
            <Input id="years_in_practice" name="years_in_practice" type="number" inputMode="numeric" min={0} max={70} required />
          </Field>
          {category === "other" ? (
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="category_other">Your field</FieldLabel>
              <Input id="category_other" name="category_other" required maxLength={60} />
            </Field>
          ) : null}
        </FieldGroup>
        <Field>
          <FieldLabel htmlFor="specialty">Specialties, up to three</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="specialty"
              value={specialty}
              disabled={specialties.length >= 3}
              placeholder={specialties.length >= 3 ? "Three added" : "Endometriosis"}
              onChange={(e) => setSpecialty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  addSpecialty()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addSpecialty} disabled={!specialty.trim() || specialties.length >= 3}>
              Add
            </Button>
          </div>
          {specialties.length ? (
            <div className="flex flex-wrap gap-1.5">
              {specialties.map((s) => (
                <TagChip key={s} label={s} onRemove={() => setSpecialties(specialties.filter((x) => x !== s))} />
              ))}
            </div>
          ) : null}
        </Field>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Registration</FieldLegend>
        <FieldDescription>We check these against the public register. We never skip this step.</FieldDescription>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="licensing_body">Licensing body</FieldLabel>
            <Input id="licensing_body" name="licensing_body" required placeholder="MDCN, NMCN, GMC, NMC or HCPC" />
          </Field>
          <Field>
            <FieldLabel htmlFor="licence_number">Licence or registration number</FieldLabel>
            <Input id="licence_number" name="licence_number" required autoComplete="off" />
          </Field>
          <Field>
            <FieldLabel htmlFor="country">Country of practice</FieldLabel>
            <Input id="country" name="country" required defaultValue="Nigeria" autoComplete="country-name" />
          </Field>
          <Field>
            <FieldLabel htmlFor="workplace">
              Workplace <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="workplace" name="workplace" autoComplete="organization" />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile_url">LinkedIn or practice web page</FieldLabel>
          <Input id="profile_url" name="profile_url" type="url" required placeholder="https://" inputMode="url" />
        </Field>
        <Field>
          <FieldLabel>Licence or ID</FieldLabel>
          <FieldDescription>PDF or photo, up to 10 MB. Stored privately and only seen by our verification team.</FieldDescription>
          <Input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            id="documents"
            onChange={(e) => upload(e.target.files)}
          />
          {docs.length ? (
            <ul className="flex flex-col gap-1.5">
              {docs.map((d) => (
                <li key={d.path} className="flex items-center gap-2 text-small">
                  <FileCheckIcon className="size-4 text-success" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${d.name}`}
                    onClick={() => setDocs(docs.filter((x) => x.path !== d.path))}
                  >
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          {docs.length < 3 ? (
            <Button type="button" variant="outline" className="self-start" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Spinner data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" aria-hidden />}
              {uploading ? "Uploading" : docs.length ? "Add another file" : "Upload a file"}
            </Button>
          ) : null}
        </Field>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Your public bio</FieldLegend>
        <Field>
          <FieldLabel htmlFor="bio">A few lines members will see on your profile</FieldLabel>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            required
            minLength={20}
            placeholder="I have worked in women's health in Lagos for twelve years, mostly with women living with endometriosis."
          />
          <FieldDescription className="text-right tabular-nums">{bio.length} / 300</FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
          <FieldContent>
            <FieldLabel htmlFor="consent">I agree to verification and the expert code of conduct</FieldLabel>
            <FieldDescription>
              General education only. No diagnosis or prescribing for an individual, no seeking patients, no selling, and I will
              declare any conflict of interest.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldSet>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" size="lg" disabled={pending || uploading || !consent} className="self-start">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Send application
      </Button>
    </form>
  )
}
