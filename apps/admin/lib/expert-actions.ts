"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@meridianher/db/server"
import { z } from "zod"

import { COMMUNITY_URL } from "@/lib/community"
import { requireAdmin } from "@/lib/staff"

type Result = { error?: string }

const CATEGORIES = ["gp", "gynaecologist", "midwife", "fertility_specialist", "dietitian", "nutritionist", "therapist", "pelvic_physio", "pharmacist", "other"] as const

const invite = z.object({ email: z.email(), name: z.string().trim().min(2).max(120), category: z.enum(CATEGORIES) })

/** Creates a 14 day invite and returns the link to send (PRD section 7, path B). */
export async function inviteExpert(input: z.input<typeof invite>): Promise<{ link?: string; error?: string }> {
  await requireAdmin()
  const parsed = invite.safeParse(input)
  if (!parsed.success) return { error: "Add their name, a valid email and a category." }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("invite_expert", parsed.data)
  if (error || !data) return { error: "We could not create the invite." }
  revalidatePath("/experts")
  return { link: `${COMMUNITY_URL}/experts/apply?invite=${data}` }
}

const review = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("in_review") }),
  z.object({ decision: z.enum(["more_info", "rejected"]), reason: z.string().trim().min(5).max(1000) }),
  z.object({
    decision: z.literal("approved"),
    handle: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,30}$/),
    publicName: z.string().trim().min(3).max(80),
  }),
])

export async function reviewApplication(application: string, input: z.input<typeof review>): Promise<Result> {
  await requireAdmin()
  const parsed = review.safeParse(input)
  if (!parsed.success) {
    return {
      error:
        input.decision === "approved"
          ? "Choose a public name, and a handle of 3 to 30 lowercase letters, numbers or dashes."
          : "Write a reason the applicant will see.",
    }
  }
  const v = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.rpc("review_application", {
    application,
    decision: v.decision,
    reason: "reason" in v ? v.reason : undefined,
    handle: v.decision === "approved" ? v.handle : undefined,
    public_name: v.decision === "approved" ? v.publicName : undefined,
  })
  revalidatePath("/experts")
  revalidatePath(`/experts/applications/${application}`)
  if (!error) return {}
  return { error: /duplicate|unique/i.test(error.message) ? "That handle is taken. Try another." : "We could not save the decision." }
}

export async function setExpertStatus(expert: string, status: "active" | "suspended" | "revoked", reason: string): Promise<Result> {
  await requireAdmin()
  if (reason.trim().length < 5) return { error: "Record a reason. It is kept in the audit log." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_expert_status", { expert, new_status: status, reason: reason.trim() })
  revalidatePath("/experts")
  return error ? { error: "We could not change their status." } : {}
}
