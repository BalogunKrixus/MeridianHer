"use client"

import * as React from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@meridianher/ui/components/sonner"
import { TooltipProvider } from "@meridianher/ui/components/tooltip"

import { AccountGate } from "./account-gate"

export function Providers({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AccountGate signedIn={signedIn}>{children}</AccountGate>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
