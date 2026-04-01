-- Ruzafa App - Product unit costs (independent from monthly finance)

create table if not exists public.collar_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  selling_price numeric(12, 2) not null check (selling_price >= 0),
  cost_type text not null check (cost_type in ('manual', 'calculated')),
  manual_cost numeric(12, 2),
  created_at timestamptz not null default now(),
  constraint collar_products_manual_cost_rule check (
    (cost_type = 'manual' and manual_cost is not null and manual_cost >= 0)
    or
    (cost_type = 'calculated' and manual_cost is null)
  )
);

create table if not exists public.collar_product_components (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.collar_products (id) on delete cascade,
  name text not null,
  unit_cost numeric(12, 2) not null check (unit_cost >= 0),
  quantity_used numeric(12, 3) not null check (quantity_used > 0),
  created_at timestamptz not null default now()
);

create index if not exists collar_products_user_id_created_at_idx
  on public.collar_products (user_id, created_at desc);

create index if not exists collar_product_components_product_id_created_at_idx
  on public.collar_product_components (product_id, created_at asc);

alter table public.collar_products enable row level security;
alter table public.collar_product_components enable row level security;

create policy "collar_products_crud_own" on public.collar_products
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "collar_product_components_crud_own" on public.collar_product_components
for all to authenticated
using (
  exists (
    select 1
    from public.collar_products p
    where p.id = collar_product_components.product_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.collar_products p
    where p.id = collar_product_components.product_id
      and p.user_id = auth.uid()
  )
);
