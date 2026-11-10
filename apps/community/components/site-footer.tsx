import { LifeBuoyIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { Separator } from "@meridianher/ui/components/separator"

/** "Need help now?" is on every page (PRD section 8, crisis handling). */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t pb-20 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center">
        <ButtonLink variant="outline" href="/help" className="self-start">
          <LifeBuoyIcon data-icon="inline-start" aria-hidden />
          Need help now?
        </ButtonLink>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-1 sm:ml-auto">
          <ButtonLink variant="link" size="sm" href="/guidelines">Community guidelines</ButtonLink>
          <ButtonLink variant="link" size="sm" href="/experts">Our experts</ButtonLink>
          <ButtonLink variant="link" size="sm" href="/experts/apply">Join as an expert</ButtonLink>
        </nav>
      </div>
      <Separator />
      <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
        MeridianHer shares experience, not diagnosis. If you are worried about your health, speak to a doctor.
      </p>
    </footer>
  )
}
