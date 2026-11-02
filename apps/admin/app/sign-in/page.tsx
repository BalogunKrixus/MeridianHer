import type { Metadata } from "next"
import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription } from "@meridianher/ui/components/alert"
import { Button } from "@meridianher/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { SignInForm } from "@meridianher/ui/patterns/sign-in-sheet"
import { safeNext } from "@meridianher/db/proxy"

import { signInWithGoogle, signOut } from "../auth/actions"

export const metadata: Metadata = { title: "Sign in" }

const ERRORS: Record<string, string> = {
  google: "Google sign in did not finish. Please try again.",
  link: "That sign in attempt expired. Please try again.",
  access: "This account does not have moderator or admin access. Sign out and use your team Google account.",
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams
  const next = safeNext(typeof params.next === "string" ? params.next : undefined)
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">MeridianHer admin</CardTitle>
          <CardDescription>For moderators and admins. Sign in with your Google account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {error ? (
            <Alert variant="warning">
              <TriangleAlertIcon aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {params.error === "access" ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full">
                Sign out
              </Button>
            </form>
          ) : (
            <SignInForm onGoogle={signInWithGoogle.bind(null, next)} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
