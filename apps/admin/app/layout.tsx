import type { Metadata } from "next"

import { Providers } from "@/components/providers"
import { geistMono, geistSans } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "MeridianHer Admin", template: "%s · MeridianHer Admin" },
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" data-density="compact" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
