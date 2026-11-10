import { CompassIcon } from "lucide-react"
import { ButtonLink } from "@meridianher/ui/components/button"
import { EmptyState } from "@meridianher/ui/patterns/cards"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-16">
      <EmptyState
        icon={CompassIcon}
        title="Nothing here"
        description="That page or record does not exist, or it was removed."
        action={<ButtonLink href="/">Back to the overview</ButtonLink>}
      />
    </div>
  )
}
