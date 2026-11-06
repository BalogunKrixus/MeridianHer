import type { Metadata } from "next"
import { PhoneIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@meridianher/ui/components/card"

export const metadata: Metadata = { title: "Welcome" }

/** Shown after onboarding finds she is under 16 (PRD section 3). Her account is already deleted, so this page needs no session. */
export default function TooYoungPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">We are not able to create your account yet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-body">
            MeridianHer is for women aged 16 and over, so we cannot make an account for you yet. We have not kept any of your details.
          </p>
          <p className="text-body text-muted-foreground">
            If something about your body is worrying you, talk to a parent, school nurse or another adult you trust. You can also
            contact Childline in the UK any time, for free. In Nigeria, call 112 in an emergency.
          </p>
          <ButtonLink variant="outline" className="self-start" href="tel:08001111">
            <PhoneIcon data-icon="inline-start" aria-hidden />
            Childline 0800 1111
          </ButtonLink>
        </CardContent>
      </Card>
    </main>
  )
}
