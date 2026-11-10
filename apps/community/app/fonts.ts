import { Geist, Geist_Mono } from "next/font/google"

// latin-ext and vietnamese cover the dotted and hooked letters in Yoruba, Igbo and Hausa (AUDIT G12)
export const geistSans = Geist({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-geist-sans",
  display: "swap",
})

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})
