import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { VerifiedTick } from "@meridianher/ui/patterns/badges"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"
import { createClient } from "@meridianher/db/server"

import { EXPERT_CATEGORY_LABELS } from "@/lib/format"

/** Right rail: a few available experts, so members know who answers (PRD 6.1 layout). */
export async function FeaturedExperts() {
  const supabase = await createClient()
  const { data } = await supabase.from("public_experts").select("handle, public_name, category").eq("available", true).limit(3)
  if (!data?.length) return null
  return (
    <Card render={<section aria-labelledby="featured-experts" />} size="sm">
      <CardHeader>
        <CardTitle id="featured-experts" className="text-h3">
          Verified experts
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1.5">
        <ul>
          {data.map((e) => (
            <li key={e.handle}>
              <ButtonLink variant="ghost" href={`/e/${e.handle}`} className="h-auto w-full justify-start gap-2.5 py-2">
                <InitialAvatar name={e.public_name!} size="sm" />
                <span className="flex min-w-0 flex-col items-start">
                  <span className="flex items-center gap-1">
                    {e.public_name} <VerifiedTick />
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{EXPERT_CATEGORY_LABELS[e.category ?? "other"]}</span>
                </span>
              </ButtonLink>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardContent>
        <ButtonLink variant="link" className="px-0" href="/experts">
          Meet all our experts
        </ButtonLink>
      </CardContent>
    </Card>
  )
}
