import type { Metadata } from "next"
import { Badge } from "@meridianher/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@meridianher/ui/components/card"
import { Table, TableBody, TableCell, TableRow } from "@meridianher/ui/components/table"
import { DEFAULT_CRISIS_RESOURCES, type CrisisCountry } from "@meridianher/ui/patterns/cards"
import { createClient } from "@meridianher/db/server"

import { ago } from "@/lib/format"
import { requireAdmin } from "@/lib/staff"
import { PageHeader } from "@/components/page-header"
import { CrisisEditor, ListSetting, RulesSetting } from "./setting-forms"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const [{ data: rows }, { data: team }] = await Promise.all([
    supabase.from("settings").select("key, value"),
    supabase.from("profiles").select("user_id, display_name, role, last_active_at").in("role", ["moderator", "admin", "super_admin"]).order("role"),
  ])
  const get = <T,>(key: string, fallback: T): T => (rows?.find((r) => r.key === key)?.value as T) ?? fallback

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Settings" description="Changes apply to every new post and reply straight away." />
      <div className="grid gap-4 xl:grid-cols-3">
        <ListSetting
          setting="blocked_words"
          title="Blocked words"
          description="Posts with these words cannot be published. One per line."
          initial={get<string[]>("blocked_words", [])}
        />
        <ListSetting
          setting="allowed_link_domains"
          title="Allowed link domains"
          description="Links to other sites are held for review. One domain per line, like nhs.uk."
          initial={get<string[]>("allowed_link_domains", [])}
        />
        <ListSetting
          setting="crisis_keywords"
          title="Crisis words"
          description="Posts are published but raise an urgent flag, and the member sees crisis help."
          initial={get<string[]>("crisis_keywords", [])}
        />
      </div>

      <CrisisEditor initial={get<CrisisCountry[]>("crisis_resources", DEFAULT_CRISIS_RESOURCES)} />

      <RulesSetting
        hold={get("new_account_hold", { hours: 24, items: 2 })}
        limits={get("rate_limits", { posts_per_hour: 5, replies_per_hour: 30 })}
        threshold={get<number>("report_auto_hide_threshold", 3)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Team</CardTitle>
          <CardDescription>Change roles from a member&apos;s page. Only super admins can grant admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {(team ?? []).map((t) => (
                <TableRow key={t.user_id}>
                  <TableCell>
                    <a href={`/members/${t.user_id}`} className="font-medium underline-offset-4 hover:underline">
                      {t.display_name ?? "Not onboarded"}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {t.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">Active {ago(t.last_active_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
