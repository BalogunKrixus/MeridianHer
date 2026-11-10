# MeridianHer Community

A community app and an admin platform on one Supabase project and one design system. The product is specified in
[PRD.md](PRD.md).

| Path | What |
| --- | --- |
| `apps/community` | Members, visitors and experts. Next 16 |
| `apps/admin` | Moderators and admins only. Next 16 |
| `packages/ui` | The design system. The only source of UI for both apps ([README](packages/ui/README.md)) |
| `packages/db` | Supabase clients, auth helpers, generated types and the RLS tests ([README](packages/db/README.md)) |
| `packages/config` | Shared TypeScript settings |
| `supabase` | Migrations, seed and project config |

## Run it locally (PowerShell)

```powershell
pnpm install
Copy-Item apps/community/.env.example apps/community/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
# fill both .env.local files with the dev project's URL and keys
pnpm --filter @meridianher/community dev   # http://localhost:3000
pnpm --filter @meridianher/admin dev       # http://localhost:3001
```

The design gallery is at `/design` in both apps. To give yourself admin access, sign in to the community app once, then in
the Supabase SQL editor run `update profiles set role = 'super_admin' where user_id = '<your auth user id>';` and sign in again.

## Checks

```powershell
pnpm -r typecheck
pnpm check:tokens
pnpm --filter @meridianher/db test
```

CI runs these on Ubuntu and Windows for every pull request, checks that `packages/db/src/database.types.ts` matches the
migrations, and builds both apps.

## Preview deploys

Each app is its own Vercel project connected to this repository, so every pull request gets a preview of both:

| Vercel project | Root directory | Production domain |
| --- | --- | --- |
| `meridianher-community` | `apps/community` | community.meridianher.com |
| `meridianher-admin` | `apps/admin` | admin.meridianher.com |

Set the variables from each app's `.env.example` in its Vercel project (Preview and Production). Preview URLs match the
`https://meridianher-*.vercel.app/auth/callback` redirect already allowed in `supabase/config.toml`.
