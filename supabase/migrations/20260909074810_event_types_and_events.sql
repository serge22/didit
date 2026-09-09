-- Event types: user-defined categories events are grouped under.
-- Renaming a type updates the label for every event of that kind (no denormalized copy).
create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (char_length(trim(label)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, label)
);

-- Events: short timestamped log entries, each belonging to one event type.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type_id uuid not null references public.event_types (id) on delete restrict,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index events_user_id_occurred_at_idx on public.events (user_id, occurred_at desc);
create index events_event_type_id_idx on public.events (event_type_id);

-- Row Level Security: every row is scoped to its owner. The app never filters
-- by user_id itself — the database enforces it on every query.
alter table public.event_types enable row level security;
alter table public.events enable row level security;

create policy "event_types are owner-only" on public.event_types
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "events are owner-only" on public.events
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
