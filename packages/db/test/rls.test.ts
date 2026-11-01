import { beforeAll, describe, expect, it } from "vitest"

import { createTestDb, failure, type TestDb } from "./test-db"

let db: TestDb
beforeAll(async () => {
  db = await createTestDb()
}, 60_000)

const count = async (q: { query: TestDb["pg"]["query"] }, sql: string, params: unknown[] = []) =>
  Number((await q.query<{ n: number }>(`select count(*)::int as n from (${sql}) s`, params)).rows[0].n)

describe("visitors", () => {
  it("read published posts through the feed view but never the base tables", async () => {
    const author = await db.createUser()
    const postId = await db.post(author)
    await db.as(null, async (q) => {
      expect(await count(q, "select * from public.feed_posts where id = $1", [postId])).toBe(1)
      expect(await failure(q, "select * from public.posts")).toMatch(/permission denied/)
      expect(await failure(q, "select * from public.profiles")).toMatch(/permission denied/)
    })
  })

  it("cannot post, react or report", async () => {
    const author = await db.createUser()
    const postId = await db.post(author)
    await db.as(null, async (q) => {
      expect(await failure(q, "insert into public.reactions (target_type, target_id, user_id, kind) values ('post', $1, $2, 'hug')", [postId, author])).toMatch(/permission denied/)
      expect(await failure(q, "insert into public.reports (target_type, target_id, reporter_id, reason) values ('post', $1, $2, 'other')", [postId, author])).toMatch(/permission denied/)
    })
  })

  it("do not see age gated spaces or their posts", async () => {
    const adult = await db.createUser({ birthYear: 1990 })
    const postId = await db.post(adult, { space: "sexual-health", title: "Which contraception has the fewest side effects?" })
    await db.as(null, async (q) => {
      expect(await count(q, "select * from public.spaces where slug = 'sexual-health'")).toBe(0)
      expect(await count(q, "select * from public.feed_posts where id = $1", [postId])).toBe(0)
      expect(await count(q, "select * from public.spaces")).toBe(9)
    })
  })

  it("see crisis resources but no other settings", async () => {
    await db.as(null, async (q) => {
      const { rows } = await q.query<{ key: string }>("select key from public.settings")
      expect(rows.map((r) => r.key)).toEqual(["crisis_resources"])
    })
  })
})

describe("age gates", () => {
  const thisYear = new Date().getFullYear()

  it("hide 18+ spaces from 16 and 17 year olds and show them at 18", async () => {
    const seventeen = await db.createUser({ birthYear: thisYear - 17 })
    const eighteen = await db.createUser({ birthYear: thisYear - 18 })
    const sql = "select * from public.spaces where slug = 'sexual-health'"
    expect(await db.as(seventeen, (q) => count(q, sql))).toBe(0)
    expect(await db.as(eighteen, (q) => count(q, sql))).toBe(1)
  })

  it("stop under 18s posting into 18+ spaces", async () => {
    const seventeen = await db.createUser({ birthYear: thisYear - 17 })
    await expect(db.post(seventeen, { space: "sexual-health" })).rejects.toThrow(/row-level security/)
  })
})

describe("member privacy", () => {
  it("members read their own profile row and nobody else's", async () => {
    const a = await db.createUser()
    const b = await db.createUser()
    await db.as(a, async (q) => {
      expect(await count(q, "select * from public.profiles where user_id = $1", [a])).toBe(1)
      expect(await count(q, "select * from public.profiles where user_id = $1", [b])).toBe(0)
      const { rows } = await q.query<Record<string, unknown>>("select * from public.public_profiles where user_id = $1", [b])
      expect(Object.keys(rows[0]).sort()).toEqual(["display_name", "hide_activity", "is_expert", "joined_month", "user_id"])
    })
  })

  it("fully anonymous posts never reveal the author to other members", async () => {
    const author = await db.createUser()
    const reader = await db.createUser()
    const postId = await db.post(author, { fullyAnonymous: true })
    const sql = "select author_name, author_user_id, is_mine from public.feed_posts where id = $1"
    const seen = await db.as(reader, (q) => q.query<{ author_name: string; author_user_id: string | null; is_mine: boolean }>(sql, [postId]))
    expect(seen.rows[0]).toEqual({ author_name: "Anonymous member", author_user_id: null, is_mine: false })
    const own = await db.as(author, (q) => q.query<{ is_mine: boolean }>(sql, [postId]))
    expect(own.rows[0].is_mine).toBe(true)
  })

  it("moderators still see who wrote an anonymous post", async () => {
    const author = await db.createUser()
    const mod = await db.createUser({ role: "moderator" })
    const postId = await db.post(author, { fullyAnonymous: true })
    const { rows } = await db.as(mod, (q) => q.query<{ author_id: string }>("select author_id from public.posts where id = $1", [postId]))
    expect(rows[0].author_id).toBe(author)
  })

  it("members cannot read other members' saves, reactions, reports or notifications", async () => {
    const a = await db.createUser()
    const b = await db.createUser()
    const postId = await db.post(a)
    await db.as(b, async (q) => {
      await q.query("insert into public.saves (user_id, target_type, target_id) values ($1, 'post', $2)", [b, postId])
      await q.query("insert into public.reactions (user_id, target_type, target_id, kind) values ($1, 'post', $2, 'hug')", [b, postId])
      await q.query("insert into public.reports (reporter_id, target_type, target_id, reason) values ($1, 'post', $2, 'other')", [b, postId])
    })
    await db.pg.query("insert into public.notifications (user_id, kind) values ($1, 'reply')", [b])
    await db.as(a, async (q) => {
      for (const table of ["saves", "reactions", "reports", "notifications"]) {
        expect(await count(q, `select * from public.${table} where ${table === "reports" ? "reporter_id" : "user_id"} = $1`, [b])).toBe(0)
      }
    })
  })

  it("expert legal names and licence numbers are private", async () => {
    const expert = await db.createUser({ role: "expert" })
    await db.pg.query(
      `insert into public.expert_profiles (user_id, handle, public_name, legal_name, title, category, licensing_body, licence_number, country, verified_at, renewal_due)
       values ($1, 'dr-amaka', 'Dr Amaka Obi', 'Amaka Chidinma Obi', 'Consultant gynaecologist', 'gynaecologist', 'MDCN', 'MDCN-12345', 'Nigeria', now(), now() + interval '1 year')`,
      [expert]
    )
    const member = await db.createUser()
    await db.as(member, async (q) => {
      expect(await count(q, "select * from public.expert_profiles")).toBe(0)
      const { rows } = await q.query<Record<string, unknown>>("select * from public.public_experts where handle = 'dr-amaka'")
      expect(rows[0].public_name).toBe("Dr Amaka Obi")
      expect(rows[0]).not.toHaveProperty("legal_name")
      expect(rows[0]).not.toHaveProperty("licence_number")
    })
  })
})

describe("admin only data", () => {
  it("members, experts and moderators cannot read the audit log or PII access log", async () => {
    for (const role of ["member", "expert", "moderator"] as const) {
      const user = await db.createUser({ role })
      await db.as(user, async (q) => {
        expect(await count(q, "select * from public.audit_log")).toBe(0)
        expect(await count(q, "select * from public.pii_access_log")).toBe(0)
        expect(await count(q, "select * from public.expert_invites")).toBe(0)
      })
    }
  })

  it("members cannot read moderation flags; moderators can", async () => {
    const newcomer = await db.createUser({ ageHours: 1 })
    await db.post(newcomer)
    const member = await db.createUser()
    const mod = await db.createUser({ role: "moderator" })
    const sql = "select * from public.moderation_flags where source = 'new_account'"
    expect(await db.as(member, (q) => count(q, sql))).toBe(0)
    expect(await db.as(mod, (q) => count(q, sql))).toBeGreaterThan(0)
  })

  it("admins read the audit log, including space edits", async () => {
    const admin = await db.createUser({ role: "admin" })
    await db.as(admin, (q) => q.query("update public.spaces set description = 'Hair, skin and more.' where slug = 'body'"))
    const { rows } = await db.as(admin, (q) =>
      q.query<{ action: string; actor_id: string }>("select action, actor_id from public.audit_log where action = 'update spaces'")
    )
    expect(rows).toEqual([{ action: "update spaces", actor_id: admin }])
  })

  it("only admins edit spaces and settings", async () => {
    const mod = await db.createUser({ role: "moderator" })
    await db.as(mod, async (q) => {
      const res = await q.query("update public.spaces set name = 'Changed' where slug = 'body'")
      expect(res.affectedRows).toBe(0)
      expect(await count(q, "select * from public.settings where key = 'blocked_words'")).toBe(0)
    })
  })
})

describe("audit log", () => {
  it("cannot be changed or deleted, even by the database owner", async () => {
    await db.pg.query("insert into public.audit_log (action) values ('test entry')")
    await expect(db.pg.query("update public.audit_log set action = 'edited'")).rejects.toThrow(/append only/)
    await expect(db.pg.query("delete from public.audit_log")).rejects.toThrow(/append only/)
    await expect(db.pg.query("truncate public.audit_log")).rejects.toThrow(/append only/)
  })

  it("records role changes", async () => {
    const user = await db.createUser()
    await db.pg.query("update public.profiles set role = 'moderator' where user_id = $1", [user])
    const { rows } = await db.pg.query<{ after: { role: string } }>(
      "select after from public.audit_log where action = 'change member access' and target_id = $1 order by at desc limit 1",
      [user]
    )
    expect(rows[0].after.role).toBe("moderator")
  })
})

describe("posting rules", () => {
  it("members cannot set moderation fields or change their own role", async () => {
    const member = await db.createUser()
    const spaceId = await db.spaceId("periods")
    await db.as(member, async (q) => {
      expect(await failure(q, "insert into public.posts (author_id, space_id, title, status, pinned) values ($1, $2, 'Pinned by myself somehow', 'published', true)", [member, spaceId])).toMatch(/permission denied/)
      expect(await failure(q, "update public.profiles set role = 'admin' where user_id = $1", [member])).toMatch(/permission denied/)
      expect(await failure(q, "update public.posts set reply_count = 100")).toMatch(/permission denied/)
    })
  })

  it("members cannot post as someone else or as the team", async () => {
    const a = await db.createUser()
    const b = await db.createUser()
    const spaceId = await db.spaceId("periods")
    await db.as(a, async (q) => {
      expect(await failure(q, "insert into public.posts (author_id, space_id, title) values ($1, $2, 'Posting as another member')", [b, spaceId])).toMatch(/row-level security/)
    })
    await expect(db.post(a, { asTeam: true })).rejects.toThrow(/row-level security/)
    const admin = await db.createUser({ role: "admin" })
    const teamPost = await db.post(admin, { asTeam: true })
    const { rows } = await db.as(a, (q) => q.query<{ author_name: string; author_user_id: string | null }>(
      "select author_name, author_user_id from public.feed_posts where id = $1", [teamPost]
    ))
    expect(rows[0]).toEqual({ author_name: "MeridianHer Team", author_user_id: null })
  })

  it("members who have not finished onboarding, muted members and banned members cannot post", async () => {
    for (const user of [
      await db.createUser({ onboarded: false }),
      await db.createUser({ status: "muted" }),
      await db.createUser({ status: "banned" }),
    ]) {
      await expect(db.post(user)).rejects.toThrow(/row-level security/)
    }
  })

  it("holds the first 2 posts or replies from accounts under 24 hours old", async () => {
    const regular = await db.createUser()
    const newcomer = await db.createUser({ ageHours: 2 })
    const existing = await db.post(regular)
    const first = await db.post(newcomer)
    const second = await db.reply(newcomer, existing)
    const third = await db.post(newcomer)
    const { rows } = await db.pg.query<{ id: string; status: string }>(
      "select id, status from public.posts where id = any($1) union all select id, status from public.replies where id = $2",
      [[first, third], second]
    )
    const status = Object.fromEntries(rows.map((r) => [r.id, r.status]))
    expect([status[first], status[second], status[third]]).toEqual(["held", "held", "published"])
    expect(await db.as(null, (q) => count(q, "select * from public.feed_posts where id = $1", [first]))).toBe(0)
  })

  it("rate limits posts to 5 an hour", async () => {
    const member = await db.createUser()
    for (let i = 0; i < 5; i++) await db.post(member)
    await expect(db.post(member)).rejects.toThrow(/rate_limited/)
  })

  it("allows edits for 24 hours and marks them edited", async () => {
    const member = await db.createUser()
    const postId = await db.post(member)
    await db.as(member, (q) => q.query("update public.posts set title = 'Is it normal for my period to be this late?' where id = $1", [postId]))
    const { rows } = await db.pg.query<{ edited_at: string | null }>("select edited_at from public.posts where id = $1", [postId])
    expect(rows[0].edited_at).not.toBeNull()

    await db.pg.query("update public.posts set created_at = now() - interval '25 hours' where id = $1", [postId])
    await expect(
      db.as(member, (q) => q.query("update public.posts set title = 'Trying to edit this a day later' where id = $1", [postId]))
    ).rejects.toThrow(/edit_window_closed/)
  })

  it("members cannot edit other members' posts", async () => {
    const a = await db.createUser()
    const b = await db.createUser()
    const postId = await db.post(a)
    const res = await db.as(b, (q) => q.query("update public.posts set title = 'Someone else changed this' where id = $1", [postId]))
    expect(res.affectedRows).toBe(0)
  })
})

describe("replies", () => {
  it("are two levels deep at most", async () => {
    const a = await db.createUser()
    const postId = await db.post(a)
    const top = await db.reply(a, postId)
    const child = await db.reply(a, postId, top)
    await expect(db.reply(a, postId, child)).rejects.toThrow(/reply_too_deep/)
  })

  it("are closed on locked posts", async () => {
    const a = await db.createUser()
    const postId = await db.post(a)
    await db.pg.query("update public.posts set locked = true where id = $1", [postId])
    await expect(db.reply(a, postId)).rejects.toThrow(/post_closed/)
  })

  it("keep reply counts and expert answers in sync", async () => {
    const a = await db.createUser()
    const postId = await db.post(a)
    const r1 = await db.reply(a, postId)
    await db.reply(a, postId, r1)
    await db.pg.query("update public.replies set is_expert_answer = true where id = $1", [r1])
    let { rows } = await db.pg.query<{ reply_count: number; has_expert_answer: boolean }>(
      "select reply_count, has_expert_answer from public.posts where id = $1", [postId]
    )
    expect(rows[0]).toEqual({ reply_count: 2, has_expert_answer: true })

    await db.pg.query("update public.replies set status = 'hidden' where id = $1", [r1])
    ;({ rows } = await db.pg.query<{ reply_count: number; has_expert_answer: boolean }>("select reply_count, has_expert_answer from public.posts where id = $1", [postId]))
    expect(rows[0]).toEqual({ reply_count: 1, has_expert_answer: false })
  })

  it("show removed replies as placeholders with no body or author", async () => {
    const a = await db.createUser()
    const postId = await db.post(a)
    const r = await db.reply(a, postId)
    await db.pg.query("update public.replies set status = 'hidden' where id = $1", [r])
    const { rows } = await db.as(null, (q) => q.query("select removed, body, author_name from public.thread_replies where id = $1", [r]))
    expect(rows[0]).toEqual({ removed: true, body: null, author_name: null })
  })
})

describe("reactions and reports", () => {
  it("count reactions once per member and kind", async () => {
    const a = await db.createUser()
    const b = await db.createUser()
    const postId = await db.post(a)
    const react = (kind: string) =>
      db.as(b, (q) => q.query("insert into public.reactions (user_id, target_type, target_id, kind) values ($1, 'post', $2, $3)", [b, postId, kind]))
    await react("hug")
    await react("helpful")
    await expect(react("hug")).rejects.toThrow(/duplicate key/)
    const { rows } = await db.pg.query<{ reaction_counts: unknown }>("select reaction_counts from public.posts where id = $1", [postId])
    expect(rows[0].reaction_counts).toEqual({ hug: 1, same: 0, helpful: 1 })
  })

  it("hide content reported by 3 different members and flag it", async () => {
    const author = await db.createUser()
    const postId = await db.post(author)
    for (let i = 0; i < 3; i++) {
      const reporter = await db.createUser()
      await db.as(reporter, (q) =>
        q.query("insert into public.reports (reporter_id, target_type, target_id, reason) values ($1, 'post', $2, 'selling')", [reporter, postId])
      )
    }
    const { rows } = await db.pg.query<{ status: string }>("select status from public.posts where id = $1", [postId])
    expect(rows[0].status).toBe("hidden")
    expect(await count(db.pg, "select * from public.moderation_flags where target_id = $1 and source = 'threshold'", [postId])).toBe(1)
  })

  it("raise an urgent flag for self harm reports", async () => {
    const author = await db.createUser()
    const reporter = await db.createUser()
    const postId = await db.post(author)
    await db.as(reporter, (q) =>
      q.query("insert into public.reports (reporter_id, target_type, target_id, reason) values ($1, 'post', $2, 'self_harm')", [reporter, postId])
    )
    expect(await count(db.pg, "select * from public.moderation_flags where target_id = $1 and priority = 'urgent'", [postId])).toBe(1)
  })
})

describe("onboarding", () => {
  const thisYear = new Date().getFullYear()
  const onboard = (user: string, name: string, birthYear: number, spaces = ["periods"], accept = true) =>
    db.as(user, (q) => q.query("select public.complete_onboarding($1, $2, $3, $4)", [name, birthYear, spaces, accept]))

  it("sets the profile and follows the chosen spaces", async () => {
    const user = await db.createUser({ onboarded: false })
    await onboard(user, "Amber Fern", 1995, ["periods", "menopause"])
    const { rows } = await db.pg.query<{ display_name: string; onboarding_complete: boolean }>(
      "select display_name, onboarding_complete from public.profiles where user_id = $1", [user]
    )
    expect(rows[0]).toEqual({ display_name: "Amber Fern", onboarding_complete: true })
    expect(await count(db.pg, "select * from public.space_follows where user_id = $1", [user])).toBe(2)
  })

  it("blocks under 16s", async () => {
    const user = await db.createUser({ onboarded: false })
    await expect(onboard(user, "Quiet River", thisYear - 15)).rejects.toThrow(/under_age/)
  })

  it("requires the guidelines and a unique display name, ignoring case", async () => {
    const a = await db.createUser({ onboarded: false })
    const b = await db.createUser({ onboarded: false })
    await expect(onboard(a, "Golden Moss", 1990, ["periods"], false)).rejects.toThrow(/guidelines_not_accepted/)
    await onboard(a, "Golden Moss", 1990)
    await expect(onboard(b, "golden moss", 1990)).rejects.toThrow(/display_name_taken/)
  })

  it("does not follow age gated spaces for 16 and 17 year olds", async () => {
    const user = await db.createUser({ onboarded: false })
    await expect(onboard(user, "Morning Fig", thisYear - 16, ["sexual-health"])).rejects.toThrow(/no_spaces_chosen/)
  })

  it("adds the role to the access token", async () => {
    const mod = await db.createUser({ role: "moderator" })
    const { rows } = await db.pg.query<{ token: { claims: { user_role: string } } }>(
      "select public.custom_access_token_hook($1) as token",
      [JSON.stringify({ user_id: mod, claims: { sub: mod } })]
    )
    expect(rows[0].token.claims.user_role).toBe("moderator")
  })
})

describe("expert documents bucket", () => {
  it("lets applicants upload to their own folder only, and admins read every folder", async () => {
    const applicant = await db.createUser()
    const other = await db.createUser()
    const admin = await db.createUser({ role: "admin" })
    const upload = (user: string, folder: string) =>
      db.as(user, (q) => q.query("insert into storage.objects (bucket_id, name) values ('expert-documents', $1)", [`${folder}/licence.pdf`]))

    await upload(applicant, applicant)
    await expect(upload(applicant, other)).rejects.toThrow(/row-level security/)

    const sql = "select * from storage.objects where bucket_id = 'expert-documents' and name like $1"
    expect(await db.as(other, (q) => count(q, sql, [`${applicant}/%`]))).toBe(0)
    expect(await db.as(admin, (q) => count(q, sql, [`${applicant}/%`]))).toBe(1)
  })
})
