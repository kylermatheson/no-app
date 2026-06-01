-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nzlxbnntldjjthpdmwnz/sql

-- User stats (lifetime NO count)
create table if not exists user_stats (
  user_id uuid primary key references auth.users on delete cascade,
  lifetime_no_count integer not null default 0,
  updated_at timestamptz default now()
);

-- Daily records (NO count + slip count per day)
create table if not exists daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date text not null,  -- YYYY-MM-DD local time
  no_count integer not null default 0,
  slip_count integer not null default 0,
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Slip contexts (individual slip events)
create table if not exists slip_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date text not null,
  timestamp_ms bigint not null,
  nos_before integer not null default 0,
  trigger text,
  created_at timestamptz default now()
);

-- Row Level Security: users can only read/write their own data
alter table user_stats enable row level security;
alter table daily_records enable row level security;
alter table slip_contexts enable row level security;

create policy "own user_stats" on user_stats for all using (auth.uid() = user_id);
create policy "own daily_records" on daily_records for all using (auth.uid() = user_id);
create policy "own slip_contexts" on slip_contexts for all using (auth.uid() = user_id);
