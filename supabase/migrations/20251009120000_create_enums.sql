-- migration: create enums
-- purpose: create enum types for user roles and ticket status
-- affected: new enum types (role, ticket_status)
-- special considerations: these enums are used in MVP and may be converted to tables in the future

-- create enum for user roles
-- supports two roles for MVP: user and agent (manager and admin coming soon)
create type role as enum ('USER', 'AGENT');

-- create enum for ticket status
-- defines the lifecycle states of a ticket in the system
create type ticket_status as enum (
  'OPEN',       -- newly created ticket, not yet assigned
  'IN_PROGRESS',-- ticket is being worked on by an agent
  'RESOLVED',   -- ticket has been resolved
  'CLOSED'      -- ticket is closed and archived
);

