import { SidebarInset, SidebarProvider } from "@meridianher/ui/components/sidebar"

import { getQueueCounts, requireStaff } from "@/lib/staff"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"

export default async function ConsoleLayout({ children }: LayoutProps<"/">) {
  const [staff, counts] = await Promise.all([requireStaff(), getQueueCounts()])
  return (
    <SidebarProvider>
      <AppSidebar isAdmin={staff.isAdmin} counts={counts} />
      <SidebarInset>
        <TopBar name={staff.display_name ?? "Team member"} role={staff.role} isAdmin={staff.isAdmin} counts={counts} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
