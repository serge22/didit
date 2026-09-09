# Didit

A personal event log. Jot down short entries ("washed my car") with a
timestamp, grouped under an editable **event type** — rename a type once and
every event of that kind picks up the new name. Real multi-user auth: each
person creates their own account and only ever sees their own data.

Deliberately small: one event list, an add-event form, and light event-type
management (create/rename/filter by type). Not a general task manager.

## Stack

| Layer | Choice |
|---|---|
| Build tool | [Vite](https://vite.dev) |
| Framework | React 19 + [React Compiler](https://react.dev/learn/react-compiler) (auto-memoizes — don't hand-write `useMemo`/`useCallback`/`memo`) |
| Language | TypeScript, typed against Supabase's schema |
| Backend | [Supabase](https://supabase.com) (Postgres + Auth). Row Level Security enforces per-user data isolation in the database, not in application code |
| Data fetching | [TanStack Query](https://tanstack.com/query) — all Supabase reads/writes go through it |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) (`base-nova` style, built on [Base UI](https://base-ui.com)) — component source lives in `src/components/ui`, edit it directly |
| Routing | React Router |
| Linting | [Oxlint](https://oxc.rs) |

No Redux/Zustand — TanStack Query owns server state, `useState`/`useContext`
cover the little UI state that exists.

## Getting started

### 1. Install dependencies

```sh
pnpm install
```

### 2. Set up a Supabase project

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** and run the migration in
   [`supabase/migrations`](./supabase/migrations) — it creates the
   `event_types`/`events` tables and their Row Level Security policies.
3. Go to **Settings → API**, copy the **Project URL** and the **anon/public**
   key (not `service_role`).
4. Copy `.env.example` to `.env.local` and fill both in:

   ```sh
   cp .env.example .env.local
   ```

### 3. Run it

```sh
pnpm dev
```

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Type-check (`tsc -b`) and build for production |
| `pnpm lint` | Run Oxlint |
| `pnpm preview` | Preview the production build locally |

## Data model

```
auth.users            -- managed by Supabase Auth

event_types
  id           uuid primary key
  user_id      uuid references auth.users, not null
  label        text not null, unique per user

events
  id             uuid primary key
  user_id        uuid references auth.users, not null
  event_type_id  uuid references event_types, not null
  occurred_at    timestamptz not null
```

Both tables have RLS enabled with `user_id = auth.uid()`: the app never
filters by user itself, the database does it on every query. Any new table
holding user data must follow the same pattern. See
[`supabase/migrations`](./supabase/migrations) for the exact schema and
policies, and [`src/lib/database.types.ts`](./src/lib/database.types.ts) for
the matching TypeScript types (kept in sync by hand — small enough schema
that it's not worth CLI codegen yet).

## Project structure

```
src/
  lib/
    supabase.ts        typed Supabase client
    session.ts          auth session as a TanStack Query cache entry
    event-types.ts       event-type queries/mutations
    events.ts             event queries/mutations
  components/
    ui/                  shadcn/ui components — edit directly
    require-auth.tsx     redirects to /login without a session
    event-type-list.tsx  create/rename event types
    event-log.tsx        add-event form + filterable event list
  pages/
    login-page.tsx        sign in / sign up
    dashboard-page.tsx     the app
supabase/
  migrations/            schema + RLS, applied via the SQL Editor (or the
                          Supabase CLI once linked to a project)
```

## Local Supabase (optional)

The Supabase CLI is included as a dev dependency for running the stack
locally instead of against a hosted project:

```sh
pnpm exec supabase start   # requires Docker running
```

This spins up a local Postgres/Auth/Studio stack from the migrations in
`supabase/migrations`. Not required for day-to-day development against a
hosted free-tier project.

## Deploying (planned)

- Frontend: static build (`pnpm build`) on Vercel, Netlify, or Cloudflare
  Pages.
- Backend: the Supabase free tier. Free projects auto-pause after 7 days
  with no API traffic — a scheduled GitHub Action pinging the project keeps
  it alive if that becomes a problem.
