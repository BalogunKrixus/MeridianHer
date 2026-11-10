# @meridianher/db

Database types and the RLS test suite. The schema itself lives in `supabase/` at the repo root.

| Path | What |
| --- | --- |
| `supabase/migrations` | Schema, functions and triggers, grants and RLS, storage bucket |
| `supabase/seed.sql` | The ten launch spaces and default settings |
| `src/database.types.ts` | Generated types for the Supabase client. Never edit by hand |
| `test/` | RLS tests. They run every migration in PGlite (Postgres in process), so they need no Docker or Supabase project |

## How access works

- Base tables are readable only by their owner and by staff. Members write through column grants, so they can never set
  status, role, counts or flags.
- Public reads go through four views: `feed_posts`, `thread_replies`, `public_profiles` and `public_experts`. They expose
  safe columns only and show anonymous and team authors as a label.
- Admin edits to spaces, settings, moderators and announcements are written to `audit_log` by triggers, as is every role or
  status change. `audit_log` rejects update, delete and truncate, even from the database owner.

## Commands (PowerShell)

```powershell
pnpm --filter @meridianher/db test       # RLS suite
pnpm db:types                            # regenerate src/database.types.ts after changing a migration
```

Apply the schema to the hosted dev project with the Supabase CLI:

```powershell
pnpm dlx supabase link --project-ref <dev project ref>
pnpm dlx supabase db push --linked --include-seed
```

Then in the Supabase dashboard turn on the access token hook (Authentication, Hooks, Customize access token,
`public.custom_access_token_hook`) so the member's role is in the JWT.
