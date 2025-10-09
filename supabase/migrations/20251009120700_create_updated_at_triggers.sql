-- migration: create triggers to automatically update updated_at timestamps
-- purpose: maintain accurate updated_at timestamps for all tables
-- affected: users, categories, subcategories, tickets
-- special considerations: improves data consistency and audit trail

-- create function to update updated_at timestamp
-- this generic function can be reused for all tables with updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- create trigger for users table
-- automatically updates updated_at when a user record is modified
create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at_column();

-- create trigger for categories table
-- automatically updates updated_at when a category is modified
create trigger update_categories_updated_at
  before update on categories
  for each row
  execute function update_updated_at_column();

-- create trigger for subcategories table
-- automatically updates updated_at when a subcategory is modified
create trigger update_subcategories_updated_at
  before update on subcategories
  for each row
  execute function update_updated_at_column();

-- create trigger for tickets table
-- automatically updates updated_at when a ticket is modified
create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at_column();

