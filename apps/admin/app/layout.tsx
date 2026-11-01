import type { Metadata } from "next"

import { geistMono, geistSans } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "MeridianHer Admin",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" data-density="compact" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
