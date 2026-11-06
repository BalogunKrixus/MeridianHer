import { HeartIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { SPACE_ICONS, spaceToneStyle, type SpaceTone } from "@meridianher/ui/lib/spaces"

/** Every space as a link, for the right rail (PRD 6.1 layout). */
export function SpacesRail({ spaces, current }: { spaces: { slug: string; name: string; icon: string; accent_color: string }[]; current?: string }) {
  return (
    <Card render={<nav aria-labelledby="spaces-rail-title" />} size="sm">
      <CardHeader>
        <CardTitle id="spaces-rail-title" className="text-h3">
          Spaces
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1.5">
        <ul>
          {spaces.map((s) => {
            const Icon = SPACE_ICONS[s.icon] ?? HeartIcon
            return (
              <li key={s.slug}>
                <ButtonLink
                  variant="ghost"
                  href={`/s/${s.slug}`}
                  aria-current={s.slug === current ? "page" : undefined}
                  style={spaceToneStyle(s.accent_color as SpaceTone)}
                  className="w-full justify-start aria-[current=page]:bg-secondary"
                >
                  <Icon data-icon="inline-start" className="text-(--tone-ink)" aria-hidden />
                  {s.name}
                </ButtonLink>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
