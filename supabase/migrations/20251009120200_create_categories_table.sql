Supabase Studio-- migration: create categories table
-- purpose: define main ticket categories
-- affected: new table (categories)
-- special considerations: categories cannot be deleted if they have subcategories (enforced by restrict)

-- create categories table
-- stores top-level categorization for tickets
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create index on name for faster lookups
create index idx_categories_name on categories(name);

-- enable row level security
alter table categories enable row level security;

-- rls policy: authenticated users can select all categories
create policy "categories_select_all_authenticated"
  on categories
  for select
  to authenticated
  using (true);

-- rls policy: anon users cannot select categories
create policy "categories_select_none_anon"
  on categories
  for select
  to anon
  using (false);

-- rls policy: authenticated users cannot insert categories
-- category management is handled by admin
create policy "categories_insert_none_authenticated"
  on categories
  for insert
  to authenticated
  with check (false);

-- rls policy: anon users cannot insert categories
create policy "categories_insert_none_anon"
  on categories
  for insert
  to anon
  with check (false);

-- rls policy: authenticated users cannot update categories
create policy "categories_update_none_authenticated"
  on categories
  for update
  to authenticated
  using (false);

-- rls policy: anon users cannot update categories
create policy "categories_update_none_anon"
  on categories
  for update
  to anon
  using (false);

-- rls policy: authenticated users cannot delete categories
create policy "categories_delete_none_authenticated"
  on categories
  for delete
  to authenticated
  using (false);

-- rls policy: anon users cannot delete categories
create policy "categories_delete_none_anon"
  on categories
  for delete
  to anon
  using (false);

