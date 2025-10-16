-- migration: add admin role
-- purpose: add ADMIN role to role enum
-- affected: role enum, users table
-- date: 2025-10-16

-- Alter the existing role enum to include ADMIN
-- Note: ALTER TYPE ... ADD VALUE is the Postgres way to add to enums
-- We add ADMIN after AGENT to maintain order: USER -> AGENT -> ADMIN
ALTER TYPE role ADD VALUE 'ADMIN' AFTER 'AGENT'; 