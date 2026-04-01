-- Ruzafa App - Initial schema
-- Execute this in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  date date not null,
  category text,
  note text,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  date date not null,
  category text,
  note text,
  created_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.financial_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  fixed_amount_to_keep numeric(12, 2) not null check (fixed_amount_to_keep >= 0),
  withdrawal_percentage numeric(5, 2) not null check (withdrawal_percentage >= 0 and withdrawal_percentage <= 100),
  savings_percentage numeric(5, 2) not null check (savings_percentage >= 0 and savings_percentage <= 100),
  start_date date not null,
  created_at timestamptz not null default now()
);

create index sales_user_id_date_idx on public.sales (user_id, date desc);
create index costs_user_id_date_idx on public.costs (user_id, date desc);
create index expenses_user_id_date_idx on public.expenses (user_id, date desc);
create index withdrawals_user_id_date_idx on public.withdrawals (user_id, date desc);
create index financial_settings_user_id_start_date_idx on public.financial_settings (user_id, start_date desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.sales enable row level security;
alter table public.costs enable row level security;
alter table public.expenses enable row level security;
alter table public.withdrawals enable row level security;
alter table public.financial_settings enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "sales_crud_own" on public.sales
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "costs_crud_own" on public.costs
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "expenses_crud_own" on public.expenses
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "withdrawals_crud_own" on public.withdrawals
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "financial_settings_crud_own" on public.financial_settings
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
