"use client"

import * as React from "react"
import { cn } from "cn"
import { HandIcon, MoonIcon, MousePointerIcon, PauseIcon, PlayIcon, SunIcon } from "lucide-react"

import { Toaster } from "../components/sonner"
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group"
import { TooltipProvider } from "../components/tooltip"
import { useReducedMotion } from "../hooks/use-reduced-motion"
import { AdminPatterns } from "./patterns-admin"
import { CommunityPatterns } from "./patterns-community"
import { Foundations } from "./foundations"
import { Primitives } from "./primitives"

const TOUCH_QUERY = "(pointer: coarse), (max-width: 47.9375rem)"

function useTouchMode() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(TOUCH_QUERY)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false
  )
}

const NAV = [
  { id: "accessibility", label: "Touch and motion" },
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
  const touch = useTouchMode()
  const reduced = useReducedMotion()

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])
  React.useEffect(() => {
    if (density === "compact") document.documentElement.dataset.density = "compact"
    else delete document.documentElement.dataset.density
  }, [density])

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
            <div className="mr-auto">
              <p className="font-heading text-lg leading-tight font-semibold">
                MeridianHer <span className="text-muted-foreground">design system</span>
              </p>
              <p className="text-xs text-muted-foreground">
                packages/ui · viewing in the {app} app
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                aria-label="Theme"
                variant="outline"
                size="sm"
                spacing={0}
                value={[theme]}
                onValueChange={(v) => v[0] && setTheme(v[0] as "light" | "dark")}
              >
                <ToggleGroupItem value="light" aria-label="Light theme"><SunIcon /></ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark theme"><MoonIcon /></ToggleGroupItem>
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
          </div>
          <nav aria-label="Gallery sections" className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
            <ul className="flex gap-1 pb-2 text-sm whitespace-nowrap">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    className="relative tap-target inline-flex h-8 items-center rounded-md px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 pt-10 pb-24 sm:px-6">
          <section id="accessibility" aria-labelledby="a11y-title" className="scroll-mt-28">
            <h1 id="a11y-title" className="text-display">Design system review</h1>
            <p className="mt-3 max-w-2xl text-body text-muted-foreground">
              Every component and state in one place, for sign off before any screens are built. These two checks reflect your current device and settings.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <StatusCard
                on={touch}
                icon={touch ? HandIcon : MousePointerIcon}
                title={touch ? "Touch sizing is on" : "Desktop sizing"}
                body={
                  touch
                    ? "Phone or touch screen detected. Buttons, inputs, tabs, menu items and selects are 44px tall; checkboxes, switches and small icon buttons get an invisible 44px hit area."
                    : "Mouse on a wide screen. Controls stay compact at 32px. Narrow the window below 768px or open this on a phone to see 44px targets."
                }
              />
              <StatusCard
                on={reduced}
                icon={reduced ? PauseIcon : PlayIcon}
                title={reduced ? "Reduced motion is on" : "Motion is on"}
                body={
                  reduced
                    ? "Your system asks for less motion. Overlays, sheets, drawers, accordions, toasts, skeletons and spinners appear without animating, and charts skip their intro."
                    : "Turn on reduce motion in your system settings (Windows: Settings, Accessibility, Visual effects, Animation effects off) and every animation on this page stops."
                }
              />
            </div>
            <MotionDemo />
          </section>

          <Foundations themeKey={theme} />
          <Primitives />
          <CommunityPatterns />
          <AdminPatterns />
        </main>
        <Toaster position="bottom-center" />
      </div>
    </TooltipProvider>
  )
}

function StatusCard({
  on,
  icon: Icon,
  title,
  body,
}: {
  on: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div role="status" className="flex gap-3 rounded-xl bg-card p-4 shadow-soft">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          on ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-small text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

function MotionDemo() {
  return (
    <div className="mt-4 flex items-center gap-4 rounded-xl bg-card p-4 shadow-soft">
      <span className="relative flex size-3">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-3 rounded-full bg-primary" />
      </span>
      <p className="text-small text-muted-foreground">
        Motion check: this dot pulses when motion is allowed and sits still when reduced motion is on.
      </p>
    </div>
  )
}
