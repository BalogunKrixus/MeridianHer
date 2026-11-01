import { Fraunces, Geist_Mono, Inter } from "next/font/google"

// latin-ext and vietnamese cover the dotted and hooked letters in Yoruba, Igbo and Hausa (AUDIT G12)
export const inter = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
})

export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext", "vietnamese"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
})

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})
