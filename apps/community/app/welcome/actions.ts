"use server"

import { redirect } from "next/navigation"
import { createSecretClient } from "@meridianher/db/secret"
import { safeNext } from "@meridianher/db/proxy"
import { createClient } from "@meridianher/db/server"
import { z } from "zod"

const NAME_MESSAGES: Record<string, string> = {
  invalid: "Use letters and spaces only, between 3 and 40 characters.",
  blocked: "That name is not allowed here. Please choose another.",
  taken: "Someone already uses that name. Try another, or pick a suggestion.",
}

export async function checkDisplayName(name: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("check_display_name", { name })
  if (error) return { error: "We could not check that name just now. Please try again." }
  return data === "ok" ? {} : { error: NAME_MESSAGES[data] ?? NAME_MESSAGES.invalid }
}

const onboarding = z.object({
  displayName: z.string().trim().min(3).max(40),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  spaces: z.array(z.string()).min(1),
  acceptGuidelines: z.literal(true),
  next: z.string(),
})

const ONBOARDING_MESSAGES: Record<string, string> = {
  display_name_taken: NAME_MESSAGES.taken,
  display_name_invalid: NAME_MESSAGES.invalid,
  no_spaces_chosen: "Choose at least one space.",
  guidelines_not_accepted: "Please accept the community guidelines to join.",
}

export async function finishOnboarding(input: z.input<typeof onboarding>): Promise<{ error: string }> {
  const parsed = onboarding.safeParse(input)
  if (!parsed.success) return { error: "Please check your answers and try again." }
  const { displayName, birthYear, spaces, next } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.rpc("complete_onboarding", {
    display_name: displayName,
    birth_year: birthYear,
    space_slugs: spaces,
    accept_guidelines: true,
  })
  if (error && error.message !== "already_onboarded") {
    return { error: ONBOARDING_MESSAGES[error.message] ?? "Something went wrong saving your details. Please try again." }
  }
  // New token, so the proxy sees onboarded: true
  await supabase.auth.refreshSession()
  redirect(safeNext(next))
}

/**
 * Under 16s cannot have an account (PRD section 3). The account Google or the
 * email link just created is deleted so we keep nothing about her.
 */
export async function leaveUnderAge(): Promise<never> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  await supabase.auth.signOut()
  if (data.user) await createSecretClient().auth.admin.deleteUser(data.user.id)
  redirect("/welcome/too-young")
}
