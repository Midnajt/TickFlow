-- migration: create rls policies for tickets table
-- purpose: define row level security policies for ticket access control
-- affected: tickets table (policies)
-- special considerations: 
--   - this migration must run after agent_categories table is created
--   - policies reference agent_categories table for agent access control

-- rls policy: authenticated users can select their own tickets
-- users with role 'USER' can only see tickets they created
-- users with role 'AGENT' can see tickets from their assigned categories
create policy "tickets_select_own_authenticated"
  on tickets
  for select
  to authenticated
  using (
    auth.uid() = created_by_id
    or
    -- agents can see tickets from their assigned categories (handled by agent_categories)
    exists (
      select 1
      from users u
      join agent_categories ac on ac.agent_id = u.id
      join subcategories s on s.category_id = ac.category_id
      where u.id = auth.uid()
        and u.role = 'AGENT'
        and s.id = tickets.subcategory_id
    )
  );

-- rls policy: anon users cannot select tickets
create policy "tickets_select_none_anon"
  on tickets
  for select
  to anon
  using (false);

-- rls policy: authenticated users with role 'USER' can insert tickets
create policy "tickets_insert_users_authenticated"
  on tickets
  for insert
  to authenticated
  with check (
    exists (
      select 1 from users
      where id = auth.uid()
        and role = 'USER'
    )
    and created_by_id = auth.uid()
  );

-- rls policy: anon users cannot insert tickets
create policy "tickets_insert_none_anon"
  on tickets
  for insert
  to anon
  with check (false);

-- rls policy: authenticated agents can update tickets from their assigned categories
-- users cannot update their own tickets (per requirement)
create policy "tickets_update_agents_authenticated"
  on tickets
  for update
  to authenticated
  using (
    exists (
      select 1
      from users u
      join agent_categories ac on ac.agent_id = u.id
      join subcategories s on s.category_id = ac.category_id
      where u.id = auth.uid()
        and u.role = 'AGENT'
        and s.id = tickets.subcategory_id
    )
  )
  with check (
    exists (
      select 1
      from users u
      join agent_categories ac on ac.agent_id = u.id
      join subcategories s on s.category_id = ac.category_id
      where u.id = auth.uid()
        and u.role = 'AGENT'
        and s.id = tickets.subcategory_id
    )
  );

-- rls policy: anon users cannot update tickets
create policy "tickets_update_none_anon"
  on tickets
  for update
  to anon
  using (false);

-- rls policy: authenticated users cannot delete tickets
-- ticket deletion is not allowed to preserve history
create policy "tickets_delete_none_authenticated"
  on tickets
  for delete
  to authenticated
  using (false);

-- rls policy: anon users cannot delete tickets
create policy "tickets_delete_none_anon"
  on tickets
  for delete
  to anon
  using (false);

