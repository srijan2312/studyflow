-- ============================================================
-- StudyFlow — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled on new projects)
-- create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extends Supabase's auth.users with extra fields
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  username    text unique,
  avatar_url  text,
  email       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
create table if not exists public.study_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  topic       text not null,
  subject     text,
  start_time  timestamptz not null,
  end_time    timestamptz,
  duration    integer,            -- minutes
  difficulty  smallint check (difficulty between 1 and 5),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists study_sessions_user_id_idx on public.study_sessions(user_id);
create index if not exists study_sessions_start_time_idx on public.study_sessions(start_time desc);

-- ============================================================
-- GOALS
-- ============================================================
create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  priority     text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  progress     integer default 0 check (progress between 0 and 100),
  completed    boolean default false,
  target_date  date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);

-- ============================================================
-- SKILLS
-- ============================================================
create table if not exists public.skills (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  category            text,
  proficiency         integer default 0 check (proficiency between 0 and 100),
  target_proficiency  integer default 100 check (target_proficiency between 0 and 100),
  color               text,            -- tailwind color name e.g. 'indigo'
  hours_spent         numeric(8,2) default 0,
  difficulty          smallint check (difficulty between 1 and 5),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists skills_user_id_idx on public.skills(user_id);

-- ============================================================
-- NOTES
-- ============================================================
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text,
  tags        text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists notes_user_id_idx on public.notes(user_id);

-- ============================================================
-- RESOURCES
-- ============================================================
create table if not exists public.resources (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  url          text,
  category     text check (category in ('Video','Article','Course','Book','PDF','Tool','Other')) default 'Article',
  description  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists resources_user_id_idx on public.resources(user_id);

-- ============================================================
-- HABITS
-- ============================================================
create table if not exists public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  description    text,
  frequency      text not null check (frequency in ('daily', 'weekly')) default 'daily',
  start_date     date not null,
  reminder_time  time,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habits_start_date_idx on public.habits(start_date desc);

create table if not exists public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  status      text not null check (status in ('pending', 'completed', 'skipped')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (habit_id, date)
);

create index if not exists habit_logs_user_id_idx on public.habit_logs(user_id);
create index if not exists habit_logs_habit_id_idx on public.habit_logs(habit_id);
create index if not exists habit_logs_date_idx on public.habit_logs(date desc);

-- ============================================================
-- TOPIC MASTERY
-- ============================================================
create table if not exists public.topic_mastery (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject     text not null,
  status      text not null check (status in ('not_started', 'practicing', 'completed')) default 'not_started',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, subject)
);

create index if not exists topic_mastery_user_id_idx on public.topic_mastery(user_id);

-- ============================================================
-- USER ACHIEVEMENTS
-- ============================================================
create table if not exists public.user_achievements (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  code              text not null,
  title             text not null,
  description       text,
  icon              text,
  category          text,
  unlock_condition  text,
  unlocked_at       timestamptz default now(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique (user_id, code)
);

create index if not exists user_achievements_user_id_idx on public.user_achievements(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.study_sessions enable row level security;
alter table public.goals          enable row level security;
alter table public.skills         enable row level security;
alter table public.notes          enable row level security;
alter table public.resources      enable row level security;
alter table public.habits         enable row level security;
alter table public.habit_logs     enable row level security;
alter table public.topic_mastery  enable row level security;
alter table public.user_achievements enable row level security;

-- Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Study sessions
drop policy if exists "Users can manage own sessions" on public.study_sessions;
create policy "Users can manage own sessions" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Goals
drop policy if exists "Users can manage own goals" on public.goals;
create policy "Users can manage own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Skills
drop policy if exists "Users can manage own skills" on public.skills;
create policy "Users can manage own skills" on public.skills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notes
drop policy if exists "Users can manage own notes" on public.notes;
create policy "Users can manage own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Resources
drop policy if exists "Users can manage own resources" on public.resources;
create policy "Users can manage own resources" on public.resources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Habits
drop policy if exists "Users can manage own habits" on public.habits;
create policy "Users can manage own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own habit logs" on public.habit_logs;
create policy "Users can manage own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Topic mastery
drop policy if exists "Users can manage own topic mastery" on public.topic_mastery;
create policy "Users can manage own topic mastery" on public.topic_mastery
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User achievements
drop policy if exists "Users can manage own achievements" on public.user_achievements;
create policy "Users can manage own achievements" on public.user_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT auto-update trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles        for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.study_sessions;
create trigger set_updated_at before update on public.study_sessions  for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.goals;
create trigger set_updated_at before update on public.goals           for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.skills;
create trigger set_updated_at before update on public.skills          for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.notes;
create trigger set_updated_at before update on public.notes           for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.resources;
create trigger set_updated_at before update on public.resources       for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.habits;
create trigger set_updated_at before update on public.habits          for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.habit_logs;
create trigger set_updated_at before update on public.habit_logs      for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.topic_mastery;
create trigger set_updated_at before update on public.topic_mastery   for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.user_achievements;
create trigger set_updated_at before update on public.user_achievements for each row execute procedure public.set_updated_at();

-- ============================================================
-- STORAGE (Avatars)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "Authenticated users can update own avatars" on storage.objects;
create policy "Authenticated users can update own avatars"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid())
with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "Authenticated users can delete own avatars" on storage.objects;
create policy "Authenticated users can delete own avatars"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid());
