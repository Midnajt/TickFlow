-- migration: create trigger to enforce agent role requirement
-- purpose: ensure only users with role 'AGENT' can be assigned to agent_categories
-- affected: agent_categories table (trigger)
-- special considerations: this is a database-level integrity constraint to prevent invalid assignments

-- create function to validate agent role before insert or update
-- this function checks that the user being assigned has role 'AGENT'
create or replace function validate_agent_role()
returns trigger as $$
begin
  -- check if the user being assigned has role 'AGENT'
  if not exists (
    select 1 from users
    where id = new.agent_id
      and role = 'AGENT'
  ) then
    raise exception 'only users with role AGENT can be assigned to categories';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- create trigger to validate agent role before insert
-- ensures data integrity at the database level
create trigger validate_agent_role_before_insert
  before insert on agent_categories
  for each row
  execute function validate_agent_role();

-- create trigger to validate agent role before update
-- prevents changing agent_id to a non-agent user
create trigger validate_agent_role_before_update
  before update on agent_categories
  for each row
  when (old.agent_id is distinct from new.agent_id)
  execute function validate_agent_role();

