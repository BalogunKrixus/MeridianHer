import { after } from "next/server"
import { MegaphoneIcon } from "lucide-react"
import { Alert, AlertDescription } from "@meridianher/ui/components/alert"
import { createClient } from "@meridianher/db/server"

import { getBanner, getUnreadCount, getViewer } from "@/lib/data"
import { MobileNav } from "@/components/mobile-nav"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

/** Header, banner, footer and the phone tab bar around every community page. */
export default async function MainLayout({ children }: LayoutProps<"/">) {
  const [viewer, unread, banner] = await Promise.all([getViewer(), getUnreadCount(), getBanner()])
  const member = viewer?.onboarding_complete ? viewer : null
  if (member) {
    after(async () => {
      const supabase = await createClient()
      await supabase.rpc("touch_last_active")
    })
  }

  return (
    <>
      <SiteHeader />
      {banner ? (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <Alert>
            <MegaphoneIcon aria-hidden />
            <AlertDescription className="text-foreground">{banner.body}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {children}
      <SiteFooter />
      <MobileNav unread={unread} profileHref={member ? `/m/${encodeURIComponent(member.display_name!)}` : "/sign-in"} />
    </>
  )
}
