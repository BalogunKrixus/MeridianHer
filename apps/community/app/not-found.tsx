import { CompassIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { EmptyState } from "@meridianher/ui/patterns/cards"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-16">
      <EmptyState
        icon={CompassIcon}
        title="We could not find that page"
        description="It may have been moved or removed. Try searching, or head back to the community."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/">Go to the community</ButtonLink>
            <ButtonLink variant="outline" href="/search">
              Search
            </ButtonLink>
          </div>
        }
      />
    </main>
  )
}
