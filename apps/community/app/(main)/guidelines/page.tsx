import type { Metadata } from "next"
import { ShieldCheckIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { COMMUNITY_GUIDELINES, CrisisCard } from "@meridianher/ui/patterns/cards"


export const metadata: Metadata = {
  title: "Community guidelines",
  description: "The five rules every MeridianHer member agrees to, and how we keep the community safe.",
}

/** The community rules in full (PRD sections 6.1 and 8). */
export default function GuidelinesPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-display">Community guidelines</h1>
        <p className="mt-3 text-body text-muted-foreground">
          MeridianHer is a place to talk openly about your body and your health. Everyone who joins agrees to these five rules, so
          that every member can be honest and feel safe.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-h3">
            <ShieldCheckIcon className="size-5 text-primary" aria-hidden />
            The five rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-4 pl-5 text-body marker:font-semibold marker:text-primary">
            {COMMUNITY_GUIDELINES.map((rule) => (
              <li key={rule.title}>
                <span className="font-semibold">{rule.title}.</span> <span className="text-muted-foreground">{rule.body}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">How we keep it safe</CardTitle>
          <CardDescription className="text-body">
            New posts are checked before they appear. Every post, reply and profile has a Report option, and nobody is ever told who
            reported them. When three different members report something, it is hidden until a moderator reviews it. Moderators
            explain which rule was broken, and you can appeal a decision once.
          </CardDescription>
        </CardHeader>
      </Card>

      <CrisisCard />
    </main>
  )
}
