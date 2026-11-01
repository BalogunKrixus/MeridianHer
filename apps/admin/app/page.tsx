export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4">
      <h1 className="text-display">MeridianHer</h1>
      <p className="text-body text-muted-foreground">Screens are built after the design system is approved.</p>
      <a href="/design" className="text-primary underline underline-offset-4">
        Review the design system
      </a>
    </main>
  )
}
