import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ExternalLinkIcon, FileTextIcon } from "lucide-react"
import { Badge } from "@meridianher/ui/components/badge"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { createClient } from "@meridianher/db/server"

import { ago, date, EXPERT_CATEGORY_LABELS } from "@/lib/format"
import { requireAdmin } from "@/lib/staff"
import { ReviewPanel } from "./review-panel"

export const metadata: Metadata = { title: "Expert application" }

/** Public registers to check a licence against (PRD section 7). */
const REGISTERS: [RegExp, string, string][] = [
  [/MDCN/i, "Medical and Dental Council of Nigeria", "https://www.mdcn.gov.ng/"],
  [/NMCN/i, "Nursing and Midwifery Council of Nigeria", "https://www.nmcn.gov.ng/"],
  [/PCN/i, "Pharmacy Council of Nigeria", "https://www.pcn.gov.ng/"],
  [/GMC/i, "General Medical Council register", "https://www.gmc-uk.org/registration-and-licensing/the-medical-register"],
  [/\bNMC\b/i, "Nursing and Midwifery Council register", "https://www.nmc.org.uk/registration/search-the-register/"],
  [/HCPC/i, "HCPC register", "https://www.hcpc-uk.org/check-the-register/"],
  [/GPhC/i, "General Pharmaceutical Council register", "https://www.pharmacyregulation.org/registers"],
]

export default async function ApplicationPage({ params }: PageProps<"/experts/applications/[id]">) {
  await requireAdmin()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: a } = await supabase.from("expert_applications").select("*").eq("id", id).maybeSingle()
  if (!a) notFound()
  const [{ data: profile }, docs] = await Promise.all([
    supabase.from("profiles").select("display_name, created_at").eq("user_id", a.user_id).maybeSingle(),
    Promise.all(
      a.document_paths.map(async (path) => {
        // Short lived links: the documents never leave the private bucket
        const { data } = await supabase.storage.from("expert-documents").createSignedUrl(path, 600)
        return { path, url: data?.signedUrl, isImage: /\.(jpe?g|png|webp)$/i.test(path) }
      })
    ),
  ])
  const register = REGISTERS.find(([re]) => re.test(a.licensing_body))
  const suggestedName = `${/doctor|dr\b|gp|gynae|obstet/i.test(a.title + a.category) ? "Dr " : ""}${a.legal_name.split(" ").slice(-1)[0]}`
  const facts: [string, React.ReactNode][] = [
    ["Professional title", a.title],
    ["Category", a.category === "other" ? `Other: ${a.category_other}` : EXPERT_CATEGORY_LABELS[a.category]],
    ["Specialties", a.specialties.join(", ") || "None given"],
    ["Licensing body", a.licensing_body],
    ["Licence number", <span className="font-mono">{a.licence_number}</span>],
    ["Country of practice", a.country],
    ["Years in practice", a.years_in_practice],
    ["Workplace", a.workplace ?? "Not given"],
    [
      "Profile page",
      <a href={a.profile_url} target="_blank" rel="noreferrer" className="break-all text-primary underline-offset-4 hover:underline">
        {a.profile_url}
      </a>,
    ],
    ["Community name", profile?.display_name ?? "Unknown"],
    ["Member since", date(profile?.created_at)],
    ["Consented", date(a.consent_at)],
  ]

  return (
    <div className="flex flex-col gap-4 p-6">
      <ButtonLink variant="ghost" size="sm" href="/experts" className="self-start">
        <ArrowLeftIcon data-icon="inline-start" aria-hidden />
        All applications
      </ButtonLink>
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle render={<h1 />} className="flex flex-wrap items-center gap-2 text-h2">
                {a.legal_name}
                <Badge variant="secondary" className="capitalize">
                  {a.status.replace("_", " ")}
                </Badge>
                {a.source === "invited" ? <Badge variant="soft">Invited</Badge> : null}
              </CardTitle>
              <CardDescription>Applied {ago(a.created_at)}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 text-small sm:grid-cols-2">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
            <CardContent>
              <p className="text-small text-muted-foreground">Bio</p>
              <p className="text-body">{a.bio}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Documents</CardTitle>
              <CardDescription>Links expire after 10 minutes. Reload the page for fresh ones. Do not download to shared devices.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {docs.map((d, i) =>
                d.url ? (
                  d.isImage ? (
                    <a key={d.path} href={d.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border">
                      <img src={d.url} alt={`Uploaded document ${i + 1}`} className="max-h-80 w-full bg-muted object-contain" />
                    </a>
                  ) : (
                    <ButtonLink key={d.path} variant="outline" href={d.url} target="_blank" rel="noreferrer" className="justify-start">
                      <FileTextIcon data-icon="inline-start" aria-hidden />
                      Open document {i + 1} (PDF)
                    </ButtonLink>
                  )
                ) : (
                  <p key={d.path} className="text-small text-destructive">
                    Document {i + 1} could not be opened.
                  </p>
                )
              )}
              {!docs.length ? <p className="text-small text-muted-foreground">No documents uploaded.</p> : null}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Check the register</CardTitle>
              <CardDescription>Search for licence {a.licence_number}</CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink
                variant="outline"
                className="w-full justify-start"
                target="_blank"
                rel="noreferrer"
                href={register ? register[2] : `https://www.google.com/search?q=${encodeURIComponent(`${a.licensing_body} register ${a.licence_number}`)}`}
              >
                <ExternalLinkIcon data-icon="inline-start" aria-hidden />
                {register ? register[1] : `Search for the ${a.licensing_body} register`}
              </ButtonLink>
            </CardContent>
          </Card>
          <ReviewPanel
            application={{ id: a.id, status: a.status, reason: a.decision_reason }}
            suggestedName={suggestedName}
            suggestedHandle={a.legal_name.toLowerCase().normalize("NFD").replace(/[^a-z\s]/g, "").trim().split(/\s+/).slice(-2).join("-")}
          />
        </aside>
      </div>
    </div>
  )
}
