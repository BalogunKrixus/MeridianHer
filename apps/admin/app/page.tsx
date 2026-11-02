import { Badge } from "@meridianher/ui/components/badge"
import { Button } from "@meridianher/ui/components/button"
import { InitialAvatar } from "@meridianher/ui/patterns/chips"

import { signOut } from "./auth/actions"
import { requireStaff } from "./staff"

export default async function AdminHome() {
  const staff = await requireStaff()
  const name = staff.display_name ?? "Team member"

  return (
    <>
      <header className="border-b">
        <nav aria-label="Main" className="flex h-12 items-center gap-3 px-4">
          <span className="mr-auto font-semibold tracking-tight">MeridianHer admin</span>
          <InitialAvatar name={name} size="sm" />
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="secondary" className="capitalize">
            {staff.role.replace("_", " ")}
          </Badge>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </nav>
      </header>
      <main className="px-4 py-8">
        <h1 className="text-h1">Overview</h1>
      </main>
    </>
  )
}
