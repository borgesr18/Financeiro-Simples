-- EXTENSIONS
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

-- USERS (mirror auth.users via trigger if prefer)
create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- ACCOUNTS
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text check (type in ('wallet','checking','savings','credit')) not null,
  initial_balance numeric(14,2) default 0,
  created_at timestamptz default now()
);

-- CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  kind text check (kind in ('income','expense')) not null,
  is_fixed boolean default false,
  created_at timestamptz default now()
);

-- TRANSACTIONS
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  date date not null,
  description text,
  amount numeric(14,2) not null, -- expense negative / income positive
  created_at timestamptz default now()
);

-- BUDGETS
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  planned_amount numeric(14,2) not null,
  unique(user_id, category_id, year, month)
);

-- RECURRING
create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  description text,
  amount numeric(14,2) not null,
  frequency text check (frequency in ('monthly','weekly','yearly')) not null,
  next_date date not null,
  auto_post boolean default true,
  created_at timestamptz default now()
);

-- AGGREGATION FUNCTIONS
create or replace function public.month_totals(from_date date, to_date date)
returns table (income numeric, expense numeric)
language sql stable as $$
  select coalesce(sum(case when amount > 0 then amount else 0 end),0) as income,
         coalesce(sum(case when amount < 0 then amount else 0 end),0) as expense
  from transactions
  where date between from_date and to_date
    and user_id = auth.uid();
$$;

create or replace function public.month_expense_by_category(from_date date, to_date date)
returns table (name text, spent numeric)
language sql stable as $$
  select c.name, abs(sum(t.amount)) as spent
  from transactions t
  join categories c on c.id = t.category_id
  where t.date between from_date and to_date
    and t.amount < 0
    and t.user_id = auth.uid()
  group by c.name
  order by spent desc;
$$;

create or replace function public.budget_summary_current_month()
returns table (category text, planned numeric, realized numeric, variance numeric)
language sql stable as $$
  with m as (
    select date_trunc('month', now())::date as from_date,
           (date_trunc('month', now()) + interval '1 month - 1 day')::date as to_date
  )
  select c.name as category,
         b.planned_amount as planned,
         coalesce(sum(t.amount),0) as realized,
         coalesce(sum(t.amount),0) - b.planned_amount as variance
  from budgets b
  join categories c on c.id = b.category_id
  cross join m
  left join transactions t on t.category_id = b.category_id
    and t.user_id = b.user_id
    and t.date between m.from_date and m.to_date
  where b.user_id = auth.uid()
  group by c.name, b.planned_amount
  order by c.name;
$$;
