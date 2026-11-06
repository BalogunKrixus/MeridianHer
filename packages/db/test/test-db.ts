import { readdirSync, readFileSync } from "node:fs"
import { PGlite, type Transaction } from "@electric-sql/pglite"

const supabaseDir = new URL("../../../supabase/", import.meta.url)
const read = (url: URL) => readFileSync(url, "utf8")

export type Role = "member" | "expert" | "moderator" | "admin" | "super_admin"
export type Query = Pick<Transaction, "query" | "exec">

type NewUser = {
  role?: Role
  onboarded?: boolean
  birthYear?: number
  status?: "active" | "muted" | "banned"
  /** Account age; defaults to 30 days so the new account hold does not apply */
  ageHours?: number
}

/**
 * A fresh Postgres (PGlite, in process) with the Supabase shim, every migration
 * and the seed applied. Queries run as anon or authenticated, exactly as
 * PostgREST would run them, so RLS applies.
 */
export async function createTestDb() {
  const pg = new PGlite()
  await pg.exec(read(new URL("../test/supabase-shim.sql", import.meta.url)))
  for (const file of readdirSync(new URL("migrations/", supabaseDir)).sort()) {
    await pg.exec(read(new URL(`migrations/${file}`, supabaseDir)))
  }
  await pg.exec(read(new URL("seed.sql", supabaseDir)))
  return new TestDb(pg)
}

let nameCounter = 0
function nextName() {
  let n = nameCounter++
  let suffix = ""
  do {
    suffix = String.fromCharCode(97 + (n % 26)) + suffix
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return `Tester ${suffix}`
}

/** Runs one statement inside a savepoint and returns its error message, so a test can try several failing statements. */
export async function failure(q: Query, sql: string, params: unknown[] = []) {
  await q.exec("savepoint attempt")
  try {
    await q.query(sql, params)
    await q.exec("release savepoint attempt")
    return null
  } catch (error) {
    await q.exec("rollback to savepoint attempt")
    return (error as Error).message
  }
}

export class TestDb {
  readonly pg: PGlite
  constructor(pg: PGlite) {
    this.pg = pg
  }

  /** Creates an auth user; the profile comes from the signup trigger. */
  async createUser({ role = "member", onboarded = true, birthYear = 1990, status = "active", ageHours = 24 * 30 }: NewUser = {}) {
    const { rows } = await this.pg.query<{ id: string }>(
      "insert into auth.users (email) values ($1) returning id",
      [`${crypto.randomUUID()}@example.com`]
    )
    const id = rows[0].id
    await this.pg.query(
      `update public.profiles set
         display_name = case when $2 then $3 end,
         birth_year = case when $2 then $4::smallint end,
         onboarding_complete = $2,
         role = $5::public.app_role,
         status = $6::public.member_status,
         muted_until = case when $6 = 'muted' then now() + interval '1 day' end,
         created_at = now() - make_interval(hours => $7)
       where user_id = $1`,
      [id, onboarded, nextName(), birthYear, role, status, ageHours]
    )
    return id
  }

  async spaceId(slug: string) {
    const { rows } = await this.pg.query<{ id: string }>("select id from public.spaces where slug = $1", [slug])
    return rows[0].id
  }

  /** Runs `fn` as the given user (or as a visitor when `userId` is null), in a transaction. */
  as<T>(userId: string | null, fn: (q: Query) => Promise<T>) {
    return this.pg.transaction(async (tx) => {
      await tx.exec(`set local role ${userId ? "authenticated" : "anon"}`)
      if (userId) await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [userId])
      return fn(tx)
    })
  }

  /** Inserts a post as its author, through RLS. */
  async post(authorId: string, fields: { space?: string; title?: string; fullyAnonymous?: boolean; asTeam?: boolean } = {}) {
    const spaceId = await this.spaceId(fields.space ?? "periods")
    return this.as(authorId, async (q) => {
      const { rows } = await q.query<{ id: string }>(
        `insert into public.posts (author_id, space_id, title, body, fully_anonymous, as_team)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [
          authorId,
          spaceId,
          fields.title ?? "Is it normal for my period to be late?",
          JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Two weeks late this month." }] }] }),
          fields.fullyAnonymous ?? false,
          fields.asTeam ?? false,
        ]
      )
      return rows[0].id
    })
  }

  async reply(authorId: string, postId: string, parentReplyId: string | null = null) {
    return this.as(authorId, async (q) => {
      const { rows } = await q.query<{ id: string }>(
        `insert into public.replies (author_id, post_id, parent_reply_id, body) values ($1, $2, $3, $4) returning id`,
        [authorId, postId, parentReplyId, JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Same here." }] }] })]
      )
      return rows[0].id
    })
  }
}
