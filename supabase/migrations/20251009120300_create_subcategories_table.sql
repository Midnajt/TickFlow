-- migration: create subcategories table
-- purpose: define subcategories under main categories
-- affected: new table (subcategories)
-- special considerations: restrict deletion of categories that have subcategories to prevent accidental data loss

-- create subcategories table
-- stores second-level categorization for tickets
create table subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid not null references categories(id) on delete restrict, -- prevent accidental deletion of categories with subcategories
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure unique subcategory names within a category
  unique(category_id, name)
);

-- create index on category_id for faster joins and filtering
create index idx_subcategories_category_id on subcategories(category_id);

-- create index on name for faster lookups
create index idx_subcategories_name on subcategories(name);

-- enable row level security
alter table subcategories enable row level security;

-- rls policy: authenticated users can select all subcategories
create policy "subcategories_select_all_authenticated"
  on subcategories
  for select
  to authenticated
  using (true);

-- rls policy: anon users cannot select subcategories
create policy "subcategories_select_none_anon"
  on subcategories
  for select
  to anon
  using (false);

-- rls policy: authenticated users cannot insert subcategories
-- subcategory management is handled by admin
create policy "subcategories_insert_none_authenticated"
  on subcategories
  for insert
  to authenticated
  with check (false);

-- rls policy: anon users cannot insert subcategories
create policy "subcategories_insert_none_anon"
  on subcategories
  for insert
  to anon
  with check (false);

-- rls policy: authenticated users cannot update subcategories
create policy "subcategories_update_none_authenticated"
  on subcategories
  for update
  to authenticated
  using (false);

-- rls policy: anon users cannot update subcategories
create policy "subcategories_update_none_anon"
  on subcategories
  for update
  to anon
  using (false);

-- rls policy: authenticated users cannot delete subcategories
create policy "subcategories_delete_none_authenticated"
  on subcategories
  for delete
  to authenticated
  using (false);

-- rls policy: anon users cannot delete subcategories
create policy "subcategories_delete_none_anon"
  on subcategories
  for delete
  to anon
  using (false);

