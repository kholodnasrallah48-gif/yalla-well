-- Yalla Well accounts: run once in Supabase → SQL Editor → New query → Run.
-- One saved copy of the app's data per account; each person can only read and change their own.
create table if not exists public.backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.backups enable row level security;

drop policy if exists "own backup: read" on public.backups;
drop policy if exists "own backup: add" on public.backups;
drop policy if exists "own backup: change" on public.backups;
drop policy if exists "own backup: delete" on public.backups;
create policy "own backup: read" on public.backups for select to authenticated using ((select auth.uid()) = user_id);
create policy "own backup: add" on public.backups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own backup: change" on public.backups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own backup: delete" on public.backups for delete to authenticated using ((select auth.uid()) = user_id);

-- "Delete account" in the app: removes the signed-in person's account (and, through the cascade, their saved copy).
create or replace function public.delete_me()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
