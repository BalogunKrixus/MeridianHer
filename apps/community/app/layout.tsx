import type { Metadata, Viewport } from "next"

import { getViewer } from "@/lib/data"
import { Providers } from "@/components/providers"
import { geistMono, geistSans } from "./fonts"
import "./globals.css"

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "MeridianHer Community", template: "%s · MeridianHer" },
  description: "Talk openly about every chapter of your health, from first periods to menopause, with answers from verified experts.",
  openGraph: { siteName: "MeridianHer", type: "website", locale: "en_GB" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#16131d" },
  ],
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer()
  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers signedIn={!!viewer?.onboarding_complete}>{children}</Providers>
      </body>
    </html>
  )
}
