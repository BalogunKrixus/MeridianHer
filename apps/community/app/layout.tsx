import type { Metadata } from "next"

import { getViewer } from "../lib/data"
import { AccountGate } from "./account-gate"
import { geistMono, geistSans } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "MeridianHer Community", template: "%s · MeridianHer" },
  description: "Talk openly about every chapter of your health, from first periods to menopause, with answers from verified experts.",
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer()
  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AccountGate signedIn={!!viewer?.onboarding_complete}>{children}</AccountGate>
      </body>
    </html>
  )
}
