-- migration: create users table
-- purpose: store user accounts with role-based access
-- affected: new table (users)
-- special considerations: passwords will be hashed with bcrypt, force_password_change for first login

-- create users table
-- stores both regular users and agents with role differentiation
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null, -- bcrypt hashed password
  name text not null,
  role role not null default 'USER',
  force_password_change boolean not null default false, -- true for first login
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create index on email for faster authentication lookups
create index idx_users_email on users(email);

-- create index on role for filtering users by role
create index idx_users_role on users(role);

-- enable row level security
alter table users enable row level security;

-- rls policy: authenticated users can select their own user record
create policy "users_select_own_authenticated"
  on users
  for select
  to authenticated
  using (auth.uid() = id);

-- rls policy: anon users cannot select any users
create policy "users_select_none_anon"
  on users
  for select
  to anon
  using (false);

-- rls policy: authenticated users can update their own record (e.g., password change)
create policy "users_update_own_authenticated"
  on users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- rls policy: anon users cannot update any users
create policy "users_update_none_anon"
  on users
  for update
  to anon
  using (false);

-- rls policy: authenticated users cannot insert new users
-- user creation is handled by admin through separate mechanism
create policy "users_insert_none_authenticated"
  on users
  for insert
  to authenticated
  with check (false);

-- rls policy: anon users cannot insert new users
create policy "users_insert_none_anon"
  on users
  for insert
  to anon
  with check (false);

-- rls policy: authenticated users cannot delete users
create policy "users_delete_none_authenticated"
  on users
  for delete
  to authenticated
  using (false);

-- rls policy: anon users cannot delete users
create policy "users_delete_none_anon"
  on users
  for delete
  to anon
  using (false);

