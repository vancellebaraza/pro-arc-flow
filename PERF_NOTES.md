# Performance pass notes

Branch: `perf/speed-pass` (local only, nothing pushed, migration not applied).

## Before / after

### JS chunks (`bun run build`, uncompressed)

| Chunk | Before | After |
| --- | --- | --- |
| main entry (`index-*.js`) | 621.03 kB (gzip 182.01) | 622.76 kB (gzip 182.70) |
| `pdf-*.js` (jspdf + autotable + pdf helpers, loaded by every route that imported it) | 428.84 kB (gzip 139.98) | 12.85 kB (gzip 4.90) |
| `jspdf.es.min-*.js` | inside `pdf` | 385.98 kB, loaded on first PDF export only |
| `jspdf.plugin.autotable-*.js` | inside `pdf` | 30.93 kB, loaded on first PDF export only |
| `html2canvas.esm-*.js` | 201.04 kB | 201.04 kB (only reachable from the jsPDF chunk) |
| `index.es-*.js` (jspdf dependency) | 158.92 kB | 158.83 kB |
| `historicalProjects-*.js` | 42.89 kB | 43.28 kB |
| recharts | not in the project | not in the project |

The main entry did not shrink: it holds React, the router, supabase-js and React Query. The gain is that the
~430 kB jsPDF group is no longer pulled in by routes that rarely export, and nothing in the entry references it.

### Sequential Supabase calls before the page content can render (from reading the code)

| Entry | Before | After |
| --- | --- | --- |
| `/admin` | 9 (getUser, getUser, user_roles, layout user_roles, then projects, profiles, vendor costs, quotations, assignments) | 3 (user_roles once, then projects, profiles) |
| `/client` | 6 (3 auth/role calls, layout roles, projects, profiles) | 3 (user_roles once, projects, profiles) |
| `/engineer` | 5 | 2 (user_roles once, projects) |
| `/accountant` | 10 (3 auth/role calls, layout roles, then 6 dashboard reads in sequence) | 3 (user_roles once, then accounts -> journal_lines, with the other four reads in parallel) |
| `/mini-admin/Dashboard` | 8 (3 auth/role calls, layout roles, projects, profiles, vendor costs, quotations) | 3 (user_roles once, projects, profiles) |

`auth.getUser()` network calls on a normal navigation: from several per navigation to 0. Measured on
`/mini-admin/Dashboard` in the browser: 0 requests to `/auth/v1`, 1 `user_roles` request.
After the first visit in a session, the role lookup comes from cache (see TTL below), so `user_roles` drops out too.

## What changed and why

1. `src/lib/auth-cache.ts` (new): session user from `getSession()` (local) and roles from `user_roles`, fetched once,
   shared by concurrent callers, cleared on sign-out and on user change. `_authenticated` beforeLoad, `requireRole`,
   `useMyRoles`, the auth page and the admin pages all use it. Redirect targets and allowed-role lists are unchanged.
2. `useMyRoles` seeds from the cache, so the layout no longer waits on a second roles fetch.
3. Layout notifications load on mount and when the dropdown opens (same query, same badge, same mark-as-read),
   not on every pathname change.
4. `__root.tsx`: ignores re-emitted `SIGNED_IN` for the same user and `TOKEN_REFRESHED`. A real user change or
   sign-out clears the React Query cache so one user's cached data can never be shown to the next.
5. All other `supabase.auth.getUser()` calls in pages/components now use the cached user.
6. Parallel queries: admin, mini-admin dashboard, accountant dashboard.
7. React Query for the admin, mini-admin, client and engineer lists (see decision 2 below).
8. jsPDF / jspdf-autotable are `import()`ed inside the export handlers. `pdf.ts` only has type imports from them.
9. AIAssistant is lazy-loaded behind `Suspense`.
10. Router: `defaultPreload: "intent"`, `defaultPreloadStaleTime: 30_000`. No route has a loader and every `beforeLoad`
    is read-only, so preloading only warms code and cached auth.
11. Google Fonts load with `media="print"` and a small script switches them to `all` on load (swap behaviour kept).
    Checked in the browser: both links end up `all` and Inter is loaded.
12. Migration `docs/db/pending/20261027120000_performance_indexes_and_rls.sql` (not applied; kept outside supabase/migrations so no tool picks it up).

## getUser() calls deliberately kept

None in the browser code. Server functions already verify identity with `getClaims` in
`src/integrations/supabase/auth-middleware.ts`; that file is untouched. RLS is untouched.

## Packages installed

- `bun` 1.4.4, installed globally with npm (it was not on the machine). `bun install --frozen-lockfile` succeeded and
  `bun.lock` / `package-lock.json` are unchanged.
- No project dependencies added.

## Skipped

- `select("*")` replacements and `.limit()` additions: not done. Without `types.ts` (see below) I cannot confirm which
  columns each component reads, so I left them alone.
- Embedded joins for client/engineer names: `projects.client_id` / `engineer_id` reference `auth.users`, not
  `profiles`, so PostgREST cannot embed them. I parallelised instead; the projects -> profiles pair stays sequential.
- `papaparse`: already inside the 27 kB `bank-import` route chunk, so a dynamic import saves very little.
- React Query was not applied to the other ~60 pages (accountant sub-pages, engineer/client detail pages, etc.).
- Preloading and the cached lists could not be exercised through the write paths; I only loaded pages.

## Needs my decision

1. **Roles are cached for 5 minutes** (`ROLES_TTL_MS` in `auth-cache.ts`) and for the life of the page. If an admin
   removes someone's role, that person's UI redirects can lag by up to 5 minutes or until a reload. RLS still blocks
   the data immediately. Shorter TTL = more `user_roles` calls.
2. **Lists use "show cached, always refetch on mount"** rather than a pure 30 s staleTime. A pure staleTime would show
   data that is up to 30 s old after edits made on other pages (there are ~296 `.from()` calls and I cannot hook all
   writes). Return visits render instantly but still hit the network. If you want fewer requests, remove
   `refetchOnMount: "always"` in the four list pages and invalidate the keys (`admin-dashboard`,
   `mini-admin-dashboard`, `client-projects`, `engineer-projects`) after writes.
3. **Notification badge no longer refreshes on navigation.** It loads on layout mount and when the dropdown opens, as
   requested. A notification created while you stay in the app will show after the next dropdown open or reload.
4. **Migration uses `ALTER POLICY`, not DROP/CREATE.** Same name, command and roles; only the expressions change.
   If a policy doesn't exist live, `ALTER POLICY` errors and the whole transaction rolls back, whereas
   DROP/CREATE would have created a new policy. 40 policies are rewritten. Left out: the 6 `storage.objects` policies,
   policies that are only `using (true)`, and every table that is not in `supabase/migrations/` (the accounting tables
   etc. were created outside these files). Compare against live `pg_policies` before applying.
5. **`src/integrations/supabase/types.ts` is an empty file in git**, so every typed query is effectively untyped and
   `tsc` reports "not a module" for it. This predates my changes. Regenerate it when convenient.
6. **PDF buttons now fetch the PDF library on first click**, so the first export has a short extra delay.
7. **Existing, uncommitted `src/lib/services.ts` change** (a `"solar"` entry) makes `tsc` fail with TS2322. It is
   yours, not mine, and I did not commit it. `routeTree.gen.ts` is regenerated by the dev server and was also left out.
8. `.env` on this machine contains a service-role key and R2 keys that were pasted into this chat. They are
   gitignored and not in any commit or in this file, but consider rotating them.

## Verify checklist for by-hand testing (these write data; I did not run them)

- Sign in as each role and confirm the redirect: admin, accountant, mini_admin, engineer, project_view_admin, client.
- Sign out, sign in as a different role: lists and nav must show the new user's data only.
- Admin and mini-admin: edit a project title/service, delete a project, schedule a project, approve a quotation and a
  vendor assignment; each should update the table immediately.
- Click a notification: it disappears from the badge and navigates.
- Export every PDF (quotation, inspection, worksheet, project report, work data sheet, historical projects) and
  compare with an older export.
- Send a message / save a worksheet / save an inspection (these use the cached user id for `created_by` etc.).
