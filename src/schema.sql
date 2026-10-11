-- ExamHero Pro database. Paste this whole file into Supabase > SQL Editor > Run.

create table if not exists progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  premium_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  reference text primary key,            -- Paystack reference; unique so one payment can only be used once
  user_id uuid references auth.users(id) on delete set null,   -- kept (without identity) if the student deletes their account
  plan text not null,
  amount integer not null,               -- in kobo
  created_at timestamptz not null default now()
);

create table if not exists ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table progress enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table ai_usage enable row level security;

-- Students can read and write only their OWN progress.
create policy "progress: read own" on progress for select using (auth.uid() = user_id);
create policy "progress: insert own" on progress for insert with check (auth.uid() = user_id);
create policy "progress: update own" on progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Students can only READ their subscription. Only the server (service role key) can change it.
create policy "subscriptions: read own" on subscriptions for select using (auth.uid() = user_id);

-- payments and ai_usage have no policies on purpose: only the server can touch them.
