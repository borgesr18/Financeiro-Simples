-- Sample categories
insert into public.categories (id, user_id, name, kind, is_fixed)
select gen_random_uuid(), auth.uid(), n, k, f
from (values
  ('Salário','income', false),
  ('Alimentação','expense', false),
  ('Transporte','expense', false),
  ('Moradia','expense', true),
  ('Lazer','expense', false),
  ('Saúde','expense', false)
) as v(n,k,f);

-- Sample account
insert into public.accounts (user_id, name, type, initial_balance)
values (auth.uid(), 'Carteira', 'wallet', 0);

-- Sample budget envelopes for current month
with me as (
  select extract(year from now())::int as y, extract(month from now())::int as m
)
insert into public.budgets (user_id, category_id, year, month, planned_amount)
select auth.uid(), c.id, me.y, me.m, v.planned
from me, public.categories c
join (values
  ('Alimentação', 1200.00),
  ('Transporte', 400.00),
  ('Moradia', 1500.00)
) as v(name, planned) on v.name = c.name;
