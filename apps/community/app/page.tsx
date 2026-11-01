import { Button } from "@meridianher/ui/components/button"

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-display">MeridianHer</h1>
      <Button variant="link" className="px-0" render={<a href="/design" />} nativeButton={false}>
        Review the design system
      </Button>
    </main>
  )
}
