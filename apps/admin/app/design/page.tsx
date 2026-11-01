import type { Metadata } from "next"
import { DesignGallery } from "@meridianher/ui/gallery"

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
}

export default function DesignPage() {
  return <DesignGallery app="admin" />
}
