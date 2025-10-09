-- migration: create tickets table
-- purpose: store ticket/issue submissions from users
-- affected: new table (tickets)
-- special considerations: 
--   - user deletion sets created_by_id and assigned_to_id to null (preserve ticket history)
--   - composite index on status and assigned_to_id for agent query optimization

-- create tickets table
-- main entity of the application, stores all ticket submissions
create table tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status ticket_status not null default 'OPEN',
  subcategory_id uuid not null references subcategories(id) on delete restrict, -- prevent deletion of subcategories with tickets
  created_by_id uuid references users(id) on delete set null, -- preserve ticket if user is deleted
  assigned_to_id uuid references users(id) on delete set null, -- preserve ticket if agent is deleted
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- composite index on status and assigned_to_id for optimizing agent queries
-- agents frequently query tickets by status and assignment
create index idx_tickets_status_assigned on tickets(status, assigned_to_id);

-- create index on subcategory_id for joins and filtering
create index idx_subcategories_subcategory_id on tickets(subcategory_id);

-- create index on created_by_id for user's own tickets lookup
create index idx_tickets_created_by_id on tickets(created_by_id);

-- create index on created_at for sorting by date
create index idx_tickets_created_at on tickets(created_at desc);

-- enable row level security
-- note: rls policies are created in a separate migration after agent_categories table exists
alter table tickets enable row level security;

