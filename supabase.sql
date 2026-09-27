-- Geography in the News: run once in Supabase (SQL Editor -> New query -> Run)
-- Stores which stories a teacher has hidden. Anyone can read the list (so the
-- globe can skip those stories); only signed-in teachers can change it.

create table if not exists public.hidden_stories (
  id text primary key,          -- the story id from data/news/<date>.json
  date text,
  title text,
  hidden_at timestamptz not null default now()
);

alter table public.hidden_stories enable row level security;

create policy "Anyone can see which stories are hidden"
  on public.hidden_stories for select
  using (true);

create policy "Signed-in teachers can hide stories"
  on public.hidden_stories for insert
  to authenticated
  with check (true);

create policy "Signed-in teachers can unhide stories"
  on public.hidden_stories for delete
  to authenticated
  using (true);
