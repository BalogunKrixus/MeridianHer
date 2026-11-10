"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSecretClient } from "@meridianher/db/secret"
import { createClient } from "@meridianher/db/server"
import { z } from "zod"

import { getViewer } from "@/lib/data"
import { NOTIFICATION_KINDS } from "@/lib/format"

type Result = { error?: string }

async function member() {
  const viewer = await getViewer()
  return viewer?.onboarding_complete ? viewer : null
}

const SIGN_IN = { error: "Please sign in first." }

const NAME_ERRORS: Record<string, string> = {
  too_soon: "You can change your display name once every 30 days.",
  display_name_taken: "Someone already uses that name. Try another.",
  display_name_invalid: "Use letters and spaces only, between 3 and 40 characters, and not your real name.",
}

export async function changeDisplayName(name: string): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const supabase = await createClient()
  const { error } = await supabase.rpc("change_display_name", { name })
  if (error) return { error: NAME_ERRORS[error.message] ?? "We could not change your name. Please try again." }
  revalidatePath("/", "layout")
  return {}
}

export async function setHideActivity(hide: boolean): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const supabase = await createClient()
  const { error } = await supabase.from("profiles").update({ hide_activity: hide }).eq("user_id", viewer.user_id)
  if (error) return { error: "We could not update your privacy setting." }
  return {}
}

const pref = z.object({
  kind: z.enum(NOTIFICATION_KINDS),
  inApp: z.boolean(),
  email: z.enum(["off", "immediate", "digest"]),
})

export async function setNotificationPref(input: z.input<typeof pref>): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const parsed = pref.safeParse(input)
  if (!parsed.success) return { error: "Something went wrong." }
  // Moderation notices always reach her in app: she must know when a rule was applied to her content
  const inApp = parsed.data.kind === "moderation" ? true : parsed.data.inApp
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("notification_prefs")
    .select("id")
    .eq("user_id", viewer.user_id)
    .eq("kind", parsed.data.kind)
    .maybeSingle()
  const { error } = existing
    ? await supabase.from("notification_prefs").update({ in_app: inApp, email: parsed.data.email }).eq("id", existing.id)
    : await supabase
        .from("notification_prefs")
        .insert({ user_id: viewer.user_id, kind: parsed.data.kind, in_app: inApp, email: parsed.data.email })
  if (error) return { error: "We could not save that preference." }
  return {}
}

/** Deletes the account now. Her posts are removed, or kept as "Former member", as she chose (PRD section 5). */
export async function deleteAccount(removeContent: boolean, confirmation: string): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  if (confirmation.trim().toLowerCase() !== "delete") return { error: "Type delete to confirm." }
  if (viewer.status === "banned") return { error: "This account is banned, so it cannot be deleted here. Please contact us and we will help." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("prepare_account_deletion", { remove_content: removeContent })
  if (error) return { error: "We could not delete your account. Please try again." }
  await supabase.auth.signOut()
  const { error: deleteError } = await createSecretClient().auth.admin.deleteUser(viewer.user_id)
  if (deleteError) return { error: "We could not finish deleting your account. Please contact us and we will do it for you." }
  redirect("/?deleted=1")
}

const application = z.object({
  legal_name: z.string().trim().min(3).max(120),
  title: z.string().trim().min(2).max(80),
  category: z.enum(["gp", "gynaecologist", "midwife", "fertility_specialist", "dietitian", "nutritionist", "therapist", "pelvic_physio", "pharmacist", "other"]),
  category_other: z.string().trim().max(60).optional(),
  specialties: z.array(z.string().trim().min(2).max(40)).min(1).max(3),
  licensing_body: z.string().trim().min(2).max(80),
  licence_number: z.string().trim().min(2).max(60),
  country: z.string().trim().min(2).max(60),
  years_in_practice: z.coerce.number().int().min(0).max(70),
  workplace: z.string().trim().max(120).optional(),
  profile_url: z.url({ protocol: /^https$/ }),
  bio: z.string().trim().min(20).max(300),
  document_paths: z.array(z.string()).min(1).max(3),
  consent: z.literal(true),
})

export type ApplicationInput = z.input<typeof application>

export async function submitApplication(input: ApplicationInput, inviteToken?: string, resubmit = false): Promise<Result> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const parsed = application.safeParse(input)
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]
    return {
      error:
        field === "profile_url"
          ? "Add a secure link (starting with https) to your LinkedIn or practice page."
          : field === "document_paths"
            ? "Upload a copy of your licence or ID so we can verify you."
            : field === "consent"
              ? "Please agree to verification and the expert code of conduct."
              : "Please check the highlighted details and try again.",
    }
  }
  const { consent: _consent, ...data } = parsed.data
  // Uploaded documents must sit in her own folder
  if (data.document_paths.some((p) => !p.startsWith(`${viewer.user_id}/`))) return { error: "Please upload your document again." }
  const supabase = await createClient()
  const { error } = resubmit
    ? await supabase.rpc("resubmit_expert_application", { data })
    : await supabase.rpc("submit_expert_application", { data, invite_token: inviteToken })
  if (error) {
    return {
      error:
        error.message === "already_applied"
          ? "You already have an application with us. We will be in touch soon."
          : "We could not send your application. Please try again.",
    }
  }
  revalidatePath("/experts/apply")
  return {}
}

export async function updateExpertProfile(input: { bio: string; available: boolean }): Promise<Result> {
  const viewer = await member()
  if (!viewer || viewer.role !== "expert") return SIGN_IN
  const bio = input.bio.trim()
  if (bio.length > 300) return { error: "Keep your bio under 300 characters." }
  const supabase = await createClient()
  const { error } = await supabase
    .from("expert_profiles")
    .update({ bio: bio || null, available: input.available })
    .eq("user_id", viewer.user_id)
  if (error) return { error: "We could not save your expert profile." }
  revalidatePath("/experts")
  return {}
}

const DOC_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }

/** A one time upload address in her own private folder, so the document goes straight to storage. */
export async function prepareDocumentUpload(type: string, size: number): Promise<{ path?: string; url?: string; error?: string }> {
  const viewer = await member()
  if (!viewer) return SIGN_IN
  const ext = DOC_TYPES[type]
  if (!ext) return { error: "Upload a PDF, JPG, PNG or WebP file." }
  if (size > 10 * 1024 * 1024) return { error: "Files can be up to 10 MB." }
  const path = `${viewer.user_id}/${crypto.randomUUID()}.${ext}`
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from("expert-documents").createSignedUploadUrl(path)
  if (error || !data) return { error: "We could not prepare the upload. Please try again." }
  return { path, url: data.signedUrl }
}

/** A member may appeal each warning, mute or ban once (PRD section 8). */
export async function appealSanction(sanctionId: string, message: string): Promise<Result> {
  const viewer = await getViewer()
  if (!viewer) return SIGN_IN
  const text = message.trim()
  if (text.length < 10) return { error: "Tell us a little more, in at least a sentence." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("appeal_sanction", { sanction: sanctionId, message: text.slice(0, 2000) })
  if (error) return { error: "This decision has already been appealed, or it no longer exists." }
  revalidatePath("/settings")
  return {}
}
