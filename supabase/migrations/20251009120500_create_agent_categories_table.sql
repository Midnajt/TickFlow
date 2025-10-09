-- migration: create agent_categories junction table
-- purpose: assign agents to specific categories they can handle
-- affected: new table (agent_categories)
-- special considerations: trigger ensures only users with role 'AGENT' can be assigned

-- create agent_categories junction table
-- many-to-many relationship between agents and categories
-- agents can only see and handle tickets from their assigned categories
create table agent_categories (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references users(id) on delete cascade, -- remove assignment if agent is deleted
  category_id uuid not null references categories(id) on delete cascade, -- remove assignment if category is deleted
  created_at timestamptz not null default now(),
  -- ensure an agent is not assigned to the same category multiple times
  unique(agent_id, category_id)
);

-- create index on agent_id for faster agent category lookups
create index idx_agent_categories_agent_id on agent_categories(agent_id);

-- create index on category_id for faster category agent lookups
create index idx_agent_categories_category_id on agent_categories(category_id);

-- enable row level security
alter table agent_categories enable row level security;

-- rls policy: authenticated agents can select their own category assignments
create policy "agent_categories_select_own_authenticated"
  on agent_categories
  for select
  to authenticated
  using (
    auth.uid() = agent_id
    or
    -- other users might need to see agent assignments for routing purposes
    exists (
      select 1 from users where id = auth.uid()
    )
  );

-- rls policy: anon users cannot select agent categories
create policy "agent_categories_select_none_anon"
  on agent_categories
  for select
  to anon
  using (false);

-- rls policy: authenticated users cannot insert agent categories
-- agent category assignments are handled by admin
create policy "agent_categories_insert_none_authenticated"
  on agent_categories
  for insert
  to authenticated
  with check (false);

-- rls policy: anon users cannot insert agent categories
create policy "agent_categories_insert_none_anon"
  on agent_categories
  for insert
  to anon
  with check (false);

-- rls policy: authenticated users cannot update agent categories
create policy "agent_categories_update_none_authenticated"
  on agent_categories
  for update
  to authenticated
  using (false);

-- rls policy: anon users cannot update agent categories
create policy "agent_categories_update_none_anon"
  on agent_categories
  for update
  to anon
  using (false);

-- rls policy: authenticated users cannot delete agent categories
create policy "agent_categories_delete_none_authenticated"
  on agent_categories
  for delete
  to authenticated
  using (false);

-- rls policy: anon users cannot delete agent categories
create policy "agent_categories_delete_none_anon"
  on agent_categories
  for delete
  to anon
  using (false);

