import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Alert, AlertDescription } from "@meridianher/ui/components/alert"
import { SignInForm } from "@meridianher/ui/patterns/sign-in-sheet"
import { safeNext } from "@meridianher/db/proxy"
import { TriangleAlertIcon } from "lucide-react"

import { sendMagicLink, signInWithGoogle } from "../auth/actions"

export const metadata: Metadata = { title: "Sign in" }

const ERRORS: Record<string, string> = {
  google: "Google sign in did not finish. Please try again.",
  link: "That sign in link has expired or was already used. Ask for a new one below.",
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams
  const next = safeNext(typeof params.next === "string" ? params.next : undefined)
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Sign in to MeridianHer</CardTitle>
          <CardDescription className="text-body">
            Reading is free for everyone. To post, reply or react, you need an account so we can keep this space safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {error ? (
            <Alert variant="warning">
              <TriangleAlertIcon aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <SignInForm onGoogle={signInWithGoogle.bind(null, next)} onEmail={sendMagicLink.bind(null, next)} guidelinesHref="/guidelines" />
        </CardContent>
      </Card>
    </main>
  )
}
