import { beforeAll, describe, expect, it } from "vitest"

import { createTestDb, failure, type TestDb } from "./test-db"

let db: TestDb
beforeAll(async () => {
  db = await createTestDb()
}, 60_000)

const doc = (text: string) => JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] })

async function postWith(author: string, text: string, title = "A question about my cycle this month") {
  const spaceId = await db.spaceId("periods")
  return db.as(author, async (q) => {
    const { rows } = await q.query<{ id: string; status: string }>(
      "insert into public.posts (author_id, space_id, title, body) values ($1, $2, $3, $4) returning id, status",
      [author, spaceId, title, doc(text)]
    )
    return rows[0]
  })
}

const flags = async (target: string) =>
  (await db.pg.query<{ source: string; priority: string }>("select source, priority from public.moderation_flags where target_id = $1", [target])).rows

describe("automated checks", () => {
  it("blocks blocked words", async () => {
    await db.pg.query(`update public.settings set value = '["scamword"]' where key = 'blocked_words'`)
    const a = await db.createUser()
    await expect(postWith(a, "buy this scamword now")).rejects.toThrow(/blocked_words/)
    await db.pg.query(`update public.settings set value = '[]' where key = 'blocked_words'`)
  })

  it("holds phone numbers, emails and handles for review", async () => {
    const a = await db.createUser()
    for (const text of ["call me on +234 803 123 4567", "email me at amaka@example.com", "dm me on whatsapp"]) {
      const p = await postWith(a, text)
      expect(p.status).toBe("held")
    }
  })

  it("allows approved links and holds others", async () => {
    const a = await db.createUser()
    expect((await postWith(a, "see https://www.nhs.uk/conditions/periods/")).status).toBe("published")
    const held = await postWith(a, "see https://miracle-cures.example/buy")
    expect(held.status).toBe("held")
    expect((await flags(held.id)).map((f) => f.source)).toContain("link")
  })

  it("publishes posts with crisis words but raises an urgent flag", async () => {
    const a = await db.createUser()
    const p = await postWith(a, "some days I want to die")
    expect(p.status).toBe("published")
    expect((await flags(p.id)).some((f) => f.priority === "urgent")).toBe(true)
    const { rows } = await db.as(a, (q) => q.query<{ r: boolean }>("select public.mentions_crisis('I want to die') as r"))
    expect(rows[0].r).toBe(true)
  })
})

describe("notifications", () => {
  it("tells the author about replies, the parent author about replies to them, and followers about both", async () => {
    const author = await db.createUser()
    const replier = await db.createUser()
    const follower = await db.createUser()
    const { id: postId } = await postWith(author, "first period at 13, is this normal")
    await db.as(follower, (q) => q.query("insert into public.post_follows (post_id, user_id) values ($1, $2)", [postId, follower]))
    const top = await db.reply(replier, postId)
    await db.reply(author, postId, top)

    const kinds = async (user: string) =>
      (await db.pg.query<{ kind: string }>("select kind from public.notifications where user_id = $1 order by created_at", [user])).rows.map((r) => r.kind)
    expect(await kinds(author)).toEqual(["reply_to_post"])
    expect(await kinds(replier)).toEqual(["reply_to_reply"])
    expect(await kinds(follower)).toEqual(["followed_post_reply", "followed_post_reply"])
  })

  it("members read and clear only their own notifications", async () => {
    const a = await db.createUser()
    const b = await db.createUser()
    await db.pg.query("insert into public.notifications (user_id, kind) values ($1, 'reply_to_post'), ($2, 'reply_to_post')", [a, b])
    await db.as(a, (q) => q.query("select public.mark_notifications_read()"))
    const { rows } = await db.pg.query<{ user_id: string; read: boolean }>(
      "select user_id, read_at is not null as read from public.notifications where user_id = any($1)", [[a, b]]
    )
    expect(rows.find((r) => r.user_id === a)?.read).toBe(true)
    expect(rows.find((r) => r.user_id === b)?.read).toBe(false)
  })
})

describe("author actions", () => {
  it("only the asker marks Helped me, one reply at a time", async () => {
    const asker = await db.createUser()
    const r1author = await db.createUser()
    const { id: postId } = await postWith(asker, "how long does spotting last")
    const r1 = await db.reply(r1author, postId)
    const r2 = await db.reply(r1author, postId)
    expect(await db.as(r1author, (q) => failure(q, "select public.mark_helped_me($1, true)", [r1]))).toMatch(/not_yours/)
    await db.as(asker, (q) => q.query("select public.mark_helped_me($1, true)", [r1]))
    await db.as(asker, (q) => q.query("select public.mark_helped_me($1, true)", [r2]))
    const { rows } = await db.pg.query<{ id: string }>("select id from public.replies where post_id = $1 and is_helped_me", [postId])
    expect(rows.map((r) => r.id)).toEqual([r2])
  })

  it("only active experts mark their own replies as expert answers", async () => {
    const asker = await db.createUser()
    const member = await db.createUser()
    const { id: postId } = await postWith(asker, "is this pcos")
    const r = await db.reply(member, postId)
    expect(await db.as(member, (q) => failure(q, "select public.mark_expert_answer($1, true)", [r]))).toMatch(/not_expert/)
  })

  it("authors delete their own posts and nobody else's", async () => {
    const a = await db.createUser()
    const b = await db.createUser()
    const { id } = await postWith(a, "delete me later")
    expect(await db.as(b, (q) => failure(q, "select public.delete_my_content('post', $1)", [id]))).toMatch(/not_yours/)
    await db.as(a, (q) => q.query("select public.delete_my_content('post', $1)", [id]))
    expect(await db.as(null, async (q) => (await q.query("select 1 from public.feed_posts where id = $1", [id])).rows.length)).toBe(0)
  })

  it("display names change at most once every 30 days", async () => {
    const a = await db.createUser()
    await db.pg.query("update public.profiles set display_name_changed_at = now() - interval '40 days' where user_id = $1", [a])
    await db.as(a, (q) => q.query("select public.change_display_name('Silver Heron')"))
    expect(await db.as(a, (q) => failure(q, "select public.change_display_name('Golden Heron')"))).toMatch(/too_soon/)
  })

  it("exports her own data", async () => {
    const a = await db.createUser()
    await postWith(a, "export this")
    const { rows } = await db.as(a, (q) => q.query<{ d: { posts: unknown[]; profile: { user_id: string } } }>("select public.export_my_data() as d"))
    expect(rows[0].d.posts).toHaveLength(1)
    expect(rows[0].d.profile.user_id).toBe(a)
  })
})

describe("search", () => {
  it("finds posts by their words and replies, only where the reader may look", async () => {
    const a = await db.createUser()
    const { id } = await postWith(a, "my discharge changed colour after antibiotics", "Changes after a course of medicine")
    const r = await db.reply(a, id)
    void r
    const hidden = await db.createUser()
    await db.post(hidden, { space: "sexual-health", title: "Antibiotics and contraception questions" })

    const { rows } = await db.as(null, (q) => q.query<{ id: string; snippet: string }>("select id, snippet from public.search_posts('antibiotics')"))
    expect(rows.map((x) => x.id)).toContain(id)
    expect(rows.find((x) => x.id === id)?.snippet).toContain("<<antibiotics>>")
    expect(rows).toHaveLength(1)
    const logged = await db.pg.query<{ term: string }>("select term from public.search_log where term = 'antibiotics'")
    expect(logged.rows).toHaveLength(1)
  })
})

describe("staff tools", () => {
  it("members cannot open the queue or moderate", async () => {
    const m = await db.createUser()
    expect(await db.as(m, (q) => failure(q, "select public.staff_queue('reported')"))).toMatch(/staff_only/)
    expect(await db.as(m, (q) => failure(q, "select public.admin_overview()"))).toMatch(/staff_only/)
  })

  it("hiding needs a reason, resolves reports and tells the author", async () => {
    const author = await db.createUser()
    const reporter = await db.createUser()
    const mod = await db.createUser({ role: "moderator" })
    const { id } = await postWith(author, "buy my herbal tea")
    await db.as(reporter, (q) => q.query("insert into public.reports (reporter_id, target_type, target_id, reason) values ($1, 'post', $2, 'selling')", [reporter, id]))

    const queue = await db.as(mod, (q) => q.query<{ q: { target_id: string }[] }>("select public.staff_queue('reported') as q"))
    expect(queue.rows[0].q.map((i) => i.target_id)).toContain(id)
    expect(await db.as(mod, (q) => failure(q, "select public.moderate('post', $1, 'hide')", [id]))).toMatch(/reason_required/)
    await db.as(mod, (q) => q.query("select public.moderate('post', $1, 'hide', 'selling', 'No selling')", [id]))

    const { rows } = await db.pg.query<{ status: string; open: number; notified: number; logged: number }>(
      `select (select status from public.posts where id = $1) as status,
              (select count(*)::int from public.reports where target_id = $1 and status <> 'resolved') as open,
              (select count(*)::int from public.notifications where user_id = $2 and kind = 'moderation') as notified,
              (select count(*)::int from public.audit_log where target_id = $1 and action = 'hide post') as logged`,
      [id, author]
    )
    expect(rows[0]).toEqual({ status: "hidden", open: 0, notified: 1, logged: 1 })
  })

  it("escalating needs a note and puts the item in the urgent tab", async () => {
    const author = await db.createUser()
    const mod = await db.createUser({ role: "moderator" })
    const { id } = await postWith(author, "is this dosage safe for me")
    expect(await db.as(mod, (q) => failure(q, "select public.escalate_item('post', $1, '')", [id]))).toMatch(/reason_required/)
    await db.as(mod, (q) => q.query("select public.escalate_item('post', $1, 'Needs a clinician view')", [id]))
    const queue = await db.as(mod, (q) => q.query<{ q: { target_id: string }[] }>("select public.staff_queue('urgent') as q"))
    expect(queue.rows[0].q.map((i) => i.target_id)).toContain(id)
    expect(await flags(id)).toContainEqual({ source: "escalated", priority: "urgent" })
  })

  it("muted members cannot post until the mute ends, and moderators cannot sanction admins", async () => {
    const m = await db.createUser()
    const mod = await db.createUser({ role: "moderator" })
    const admin = await db.createUser({ role: "admin" })
    await db.as(mod, (q) => q.query("select public.sanction_member($1, 'mute', 1, 'Rule 1')", [m]))
    await expect(postWith(m, "still here")).rejects.toThrow(/row-level security/)
    expect(await db.as(mod, (q) => failure(q, "select public.sanction_member($1, 'ban', null, 'x')", [admin]))).toMatch(/cannot_sanction_staff/)
  })

  it("only super admins grant admin, and PII reveals are logged", async () => {
    const m = await db.createUser()
    const admin = await db.createUser({ role: "admin" })
    const sup = await db.createUser({ role: "super_admin" })
    expect(await db.as(admin, (q) => failure(q, "select public.set_member_role($1, 'admin')", [m]))).toMatch(/super_admin_only/)
    await db.as(admin, (q) => q.query("select public.set_member_role($1, 'moderator')", [m]))
    await db.as(sup, (q) => q.query("select public.set_member_role($1, 'admin')", [m]))

    expect(await db.as(admin, (q) => failure(q, "select public.reveal_member_pii($1, 'email', 'x')", [m]))).toMatch(/reason_required/)
    const { rows } = await db.as(admin, (q) => q.query<{ e: string }>("select public.reveal_member_pii($1, 'email', 'Ban evasion check') as e", [m]))
    expect(rows[0].e).toMatch(/@example.com$/)
    const log = await db.pg.query("select 1 from public.pii_access_log where member_id = $1 and admin_id = $2", [m, admin])
    expect(log.rows).toHaveLength(1)
  })

  it("an invited application can be approved into a verified expert", async () => {
    const admin = await db.createUser({ role: "admin" })
    const applicant = await db.createUser()
    const { rows: t } = await db.as(admin, (q) => q.query<{ token: string }>("select public.invite_expert('dr@example.com', 'Dr Test', 'gynaecologist') as token"))
    const token = t[0].token
    const details = await db.as(applicant, (q) => q.query<{ d: { name: string } }>("select public.invite_details($1) as d", [token]))
    expect(details.rows[0].d.name).toBe("Dr Test")

    const data = {
      legal_name: "Ada Test", title: "Consultant gynaecologist", category: "gynaecologist", specialties: ["PCOS"],
      licensing_body: "MDCN", licence_number: "123", country: "Nigeria", years_in_practice: 10,
      profile_url: "https://example.com/dr", bio: "Ten years in practice.",
    }
    const { rows: a } = await db.as(applicant, (q) => q.query<{ id: string }>("select public.submit_expert_application($1, $2) as id", [JSON.stringify(data), token]))
    await db.as(admin, (q) => q.query("select public.review_application($1, 'approved', null, 'dr-test', 'Dr Ada Test')", [a[0].id]))

    const { rows } = await db.pg.query<{ role: string; handle: string; source: string }>(
      `select p.role, e.handle, (select source from public.expert_applications where id = $2) as source
       from public.profiles p join public.expert_profiles e on e.user_id = p.user_id where p.user_id = $1`,
      [applicant, a[0].id]
    )
    expect(rows[0]).toEqual({ role: "expert", handle: "dr-test", source: "invited" })
    const visible = await db.as(null, (q) => q.query("select 1 from public.public_experts where handle = 'dr-test'"))
    expect(visible.rows).toHaveLength(1)
  })

  it("dashboards answer for staff and analytics only for admins", async () => {
    const mod = await db.createUser({ role: "moderator" })
    const admin = await db.createUser({ role: "admin" })
    const { rows } = await db.as(mod, (q) => q.query<{ o: { headline: { members: number } } }>("select public.admin_overview(7) as o"))
    expect(rows[0].o.headline.members).toBeGreaterThan(0)
    expect(await db.as(mod, (q) => failure(q, "select public.admin_analytics()"))).toMatch(/admin_only/)
    await db.as(admin, (q) => q.query("select public.admin_analytics()"))
  })
})
