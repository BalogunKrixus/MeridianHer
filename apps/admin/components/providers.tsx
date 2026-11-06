"use client"

import * as React from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@meridianher/ui/components/sonner"
import { TooltipProvider } from "@meridianher/ui/components/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
