import type { NextRequest } from "next/server"
import { handleAuthCallback } from "@meridianher/db/auth"

export function GET(request: NextRequest) {
  return handleAuthCallback(request)
}
