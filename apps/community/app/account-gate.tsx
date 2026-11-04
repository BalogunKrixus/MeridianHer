"use client"

import * as React from "react"
import { SignInSheet } from "@meridianher/ui/patterns/sign-in-sheet"

import { sendMagicLink, signInWithGoogle } from "./auth/actions"

type Gate = {
  signedIn: boolean
  /** True when she can act now; otherwise opens the sign in sheet ("Sign in to {action}") and returns false */
  requireAccount: (action: string) => boolean
}

const GateContext = React.createContext<Gate>({ signedIn: false, requireAccount: () => false })

export const useAccount = () => React.useContext(GateContext)

/** Visitors read freely; the sign in sheet appears only when they try to act, and brings them back here (PRD section 5). */
export function AccountGate({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [action, setAction] = React.useState("join the conversation")
  const [next, setNext] = React.useState("/")

  const requireAccount = React.useCallback(
    (what: string) => {
      if (signedIn) return true
      setAction(what)
      setNext(window.location.pathname + window.location.search)
      setOpen(true)
      return false
    },
    [signedIn]
  )

  return (
    <GateContext.Provider value={{ signedIn, requireAccount }}>
      {children}
      <SignInSheet
        open={open}
        onOpenChange={setOpen}
        action={action}
        onGoogle={() => signInWithGoogle(next)}
        onEmail={(email) => sendMagicLink(next, email)}
        guidelinesHref="/guidelines"
      />
    </GateContext.Provider>
  )
}
