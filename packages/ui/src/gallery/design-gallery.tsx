"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { ButtonLink } from "../components/button"
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group"
import { TooltipProvider } from "../components/tooltip"
import { AdminPatterns } from "./patterns-admin"
import { CommunityPatterns } from "./patterns-community"
import { Foundations } from "./foundations"
import { Primitives } from "./primitives"

const NAV = [
  { id: "foundations", label: "Foundations" },
  { id: "primitives", label: "Primitives" },
  { id: "community", label: "Community" },
  { id: "admin", label: "Admin" },
]

/**
 * The /design gallery. Rendered by both apps so each reviews the package
 * inside its own providers. Admin starts in compact density.
 */
export function DesignGallery({ app }: { app: "community" | "admin" }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [density, setDensity] = React.useState<"comfortable" | "compact">(app === "admin" ? "compact" : "comfortable")

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])
  React.useEffect(() => {
    if (density === "compact") document.documentElement.dataset.density = "compact"
    else delete document.documentElement.dataset.density
  }, [density])

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <p className="mr-auto text-lg font-semibold tracking-tight">
            MeridianHer <span className="text-muted-foreground">design system, {app} app</span>
          </p>
          <ToggleGroup
            aria-label="Theme"
            variant="outline"
            size="sm"
            spacing={0}
            value={[theme]}
            onValueChange={(v) => v[0] && setTheme(v[0] as "light" | "dark")}
          >
            <ToggleGroupItem value="light" aria-label="Light theme">
              <SunIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark theme">
              <MoonIcon />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            aria-label="Density"
            variant="outline"
            size="sm"
            spacing={0}
            value={[density]}
            onValueChange={(v) => v[0] && setDensity(v[0] as "comfortable" | "compact")}
          >
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <nav aria-label="Gallery sections" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV.map((n) => (
            <ButtonLink key={n.id} variant="ghost" size="sm" href={`#${n.id}`}>
              {n.label}
            </ButtonLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pt-10 pb-24 sm:px-6">
        <Foundations themeKey={theme} />
        <Primitives />
        <CommunityPatterns />
        <AdminPatterns />
      </main>
    </TooltipProvider>
  )
}
