import { NextResponse } from "next/server"
import { createClient } from "@meridianher/db/server"

/** Download my data (PRD section 5): everything we hold about her, as JSON. */
export async function GET() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims.sub) return NextResponse.redirect(new URL("/sign-in?next=/settings", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"))
  const { data, error } = await supabase.rpc("export_my_data")
  if (error) return NextResponse.json({ error: "We could not prepare your data. Please try again." }, { status: 500 })
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="meridianher-data-${date}.json"`,
      "cache-control": "no-store",
    },
  })
}
