-- Create/repair public.profiles used by onboarding and auth gating.
-- The frontend historically used profiles.user_id, but the canonical FK is profiles.id -> auth.users.id.
-- We keep both and enforce they match for backwards compatibility.

begin;

-- Ensure table exists
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Required (as requested)
  name text,
  grade text,
  school text,
  language text,
  interests text[] default '{}'::text[],
  olympiad_interest boolean default false,
  study_time text,
  role text not null default 'user' check (role in ('user', 'center', 'admin')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Existing app fields (kept for compatibility)
  display_name text,
  avatar_url text,
  phone text,
  gender text,
  city text,
  studies_at_center boolean,
  center_name text,
  purpose text,
  bio text,
  preferred_language text,
  weak_subjects text[],
  goals text,
  study_time_per_day_minutes integer,
  preparing_for_olympiads boolean,
  onboarding_completed boolean default false,
  blocked_at timestamptz,
  last_activity_at timestamptz
);

-- Add missing columns safely (in case the table exists but schema drifted)
alter table public.profiles add column if not exists user_id uuid;
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists grade text;
alter table public.profiles add column if not exists school text;
alter table public.profiles add column if not exists language text;
alter table public.profiles add column if not exists interests text[];
alter table public.profiles add column if not exists olympiad_interest boolean;
alter table public.profiles add column if not exists study_time text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists studies_at_center boolean;
alter table public.profiles add column if not exists center_name text;
alter table public.profiles add column if not exists purpose text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists preferred_language text;
alter table public.profiles add column if not exists weak_subjects text[];
alter table public.profiles add column if not exists goals text;
alter table public.profiles add column if not exists study_time_per_day_minutes integer;
alter table public.profiles add column if not exists preparing_for_olympiads boolean;
alter table public.profiles add column if not exists onboarding_completed boolean;
alter table public.profiles add column if not exists blocked_at timestamptz;
alter table public.profiles add column if not exists last_activity_at timestamptz;

-- Ensure defaults/constraints exist (idempotent as much as possible)
alter table public.profiles
  alter column created_at set default now(),
  alter column updated_at set default now();

-- Enforce allowed roles (re-create constraint if needed)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'center', 'admin'));
  end if;
end $$;

-- Ensure id and user_id match
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_matches_user_id'
  ) then
    alter table public.profiles
      add constraint profiles_id_matches_user_id check (id = user_id);
  end if;
end $$;

-- Ensure FK/uniqueness on user_id exists even if table existed already
do $$
begin
  -- user_id should be NOT NULL
  begin
    alter table public.profiles alter column user_id set not null;
  exception when others then
    -- ignore (e.g. column already NOT NULL)
  end;

  -- unique(user_id)
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_user_id_key'
  ) then
    alter table public.profiles add constraint profiles_user_id_key unique (user_id);
  end if;
exception when others then
  -- ignore drift errors (will be surfaced when applying migration)
end $$;

-- Trigger to keep id/user_id and convenience columns in sync + maintain updated_at
create or replace function public.sync_profiles_ids_and_timestamps()
returns trigger
language plpgsql
as $$
begin
  -- Allow inserts using either id or user_id (or neither if using auth.uid())
  if new.id is null and new.user_id is not null then
    new.id := new.user_id;
  end if;
  if new.user_id is null and new.id is not null then
    new.user_id := new.id;
  end if;
  if new.id is null and new.user_id is null then
    new.id := auth.uid();
    new.user_id := new.id;
  end if;

  if new.id is distinct from new.user_id then
    raise exception 'profiles.id and profiles.user_id must match';
  end if;

  -- Keep requested columns consistent with existing app fields
  if new.name is null and new.display_name is not null then
    new.name := new.display_name;
  end if;
  if new.display_name is null and new.name is not null then
    new.display_name := new.name;
  end if;

  if new.language is null and new.preferred_language is not null then
    new.language := new.preferred_language;
  end if;
  if new.preferred_language is null and new.language is not null then
    new.preferred_language := new.language;
  end if;

  if new.olympiad_interest is null and new.preparing_for_olympiads is not null then
    new.olympiad_interest := new.preparing_for_olympiads;
  end if;
  if new.preparing_for_olympiads is null and new.olympiad_interest is not null then
    new.preparing_for_olympiads := new.olympiad_interest;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_sync_ids_and_timestamps on public.profiles;
create trigger profiles_sync_ids_and_timestamps
before insert or update on public.profiles
for each row
execute function public.sync_profiles_ids_and_timestamps();

-- RLS: users can select/insert/update their own profile row
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

commit;

