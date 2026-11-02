"use server"

import * as auth from "@meridianher/db/auth"

export async function signInWithGoogle(next: string) {
  await auth.startGoogleSignIn(next)
}

export async function signOut() {
  await auth.signOut()
}
