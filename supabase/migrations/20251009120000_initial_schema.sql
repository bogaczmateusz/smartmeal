-- =====================================================================
-- Migration: Initial Schema Setup for SmartMeal
-- =====================================================================
-- Purpose: Create the foundational database schema including:
--   - Custom ENUM types for recipe sources
--   - profiles table for user preferences
--   - recipes table for storing user recipes
--   - Indexes for performance optimization
--   - Triggers for automatic timestamp updates
--   - Row-Level Security (RLS) policies for data isolation
--
-- Affected Tables: profiles, recipes
-- Special Considerations:
--   - auth.users table is managed by Supabase Auth and not modified here
--   - All foreign keys use ON DELETE CASCADE for automatic cleanup
--   - RLS is enabled on all user-facing tables
-- =====================================================================

-- =====================================================================
-- 1. Custom Types
-- =====================================================================

-- Create ENUM type for recipe source tracking
-- Values: 'ai' for AI-generated recipes, 'manual' for user-created recipes
create type recipe_source as enum ('ai', 'manual');

-- =====================================================================
-- 2. Tables
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles table
-- ---------------------------------------------------------------------
-- Stores user-specific preferences and profile data.
-- Maintains a one-to-one relationship with Supabase's auth.users table.
-- Each user can have at most one profile, linked via user_id.
-- ---------------------------------------------------------------------
create table profiles (
    -- Primary key: unique identifier for the profile
    id uuid primary key default gen_random_uuid(),
    
    -- Foreign key: links to Supabase auth.users
    -- ON DELETE CASCADE ensures profile is deleted when user account is deleted
    -- UNIQUE constraint enforces one-to-one relationship
    user_id uuid not null unique references auth.users(id) on delete cascade,
    
    -- Array of ingredient names the user wants to avoid
    -- Default empty array ensures field is never null
    ingredients_to_avoid text[] default '{}',
    
    -- Audit timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- recipes table
-- ---------------------------------------------------------------------
-- Stores all user-saved recipes, both AI-generated and manually created.
-- Each recipe belongs to exactly one user and contains structured data
-- for ingredients and preparation steps stored as JSONB.
-- ---------------------------------------------------------------------
create table recipes (
    -- Primary key: unique identifier for the recipe
    id uuid primary key default gen_random_uuid(),
    
    -- Foreign key: links to the recipe owner in auth.users
    -- ON DELETE CASCADE ensures recipes are deleted when user account is deleted
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- Recipe title, limited to 255 characters
    -- Multiple recipes can have the same title (no unique constraint)
    title varchar(255) not null,
    
    -- Structured list of ingredients stored as JSONB
    -- Example: ["2 cups flour", "1 cup sugar", "3 eggs"]
    ingredients jsonb not null,
    
    -- Structured list of preparation steps stored as JSONB
    -- Example: ["Preheat oven to 350°F", "Mix dry ingredients", "Add wet ingredients"]
    preparation_steps jsonb not null,
    
    -- Origin of the recipe: 'ai' for AI-generated or 'manual' for user-created
    -- Uses custom ENUM type to ensure data integrity
    source recipe_source not null,
    
    -- Audit timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 3. Indexes
-- =====================================================================

-- Optimize lookups of profile data by user ID
-- Improves performance when fetching user profile information
create index idx_profiles_user_id on profiles(user_id);

-- Optimize retrieval of all recipes belonging to a specific user
-- Improves performance for queries filtering by user_id
create index idx_recipes_user_id on recipes(user_id);

-- Optimize queries that fetch user's recipes ordered by creation date
-- Composite index covering both user_id and created_at (descending)
-- Supports common query pattern: "get my recipes sorted by most recent"
create index idx_recipes_created_at on recipes(user_id, created_at desc);

-- =====================================================================
-- 4. Triggers and Functions
-- =====================================================================

-- Function to automatically update the updated_at timestamp
-- This function is called by triggers before any UPDATE operation
-- Returns the modified NEW record with updated timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger for profiles table
-- Automatically updates updated_at column whenever a profile is modified
create trigger profiles_updated_at_trigger
    before update on profiles
    for each row
    execute function update_updated_at_column();

-- Trigger for recipes table
-- Automatically updates updated_at column whenever a recipe is modified
create trigger recipes_updated_at_trigger
    before update on recipes
    for each row
    execute function update_updated_at_column();

-- =====================================================================
-- 5. Row-Level Security (RLS)
-- =====================================================================

-- Enable RLS on profiles table
-- Ensures all queries are subject to security policies
alter table profiles enable row level security;

-- Enable RLS on recipes table
-- Ensures all queries are subject to security policies
alter table recipes enable row level security;

-- ---------------------------------------------------------------------
-- RLS Policies for profiles table
-- ---------------------------------------------------------------------
-- All policies use auth.uid() to identify the authenticated user
-- and restrict access to only the user's own profile data

-- SELECT policy: Users can only view their own profile
create policy profiles_select_policy on profiles
    for select
    using (auth.uid() = user_id);

-- INSERT policy: Users can only create their own profile
-- WITH CHECK ensures the inserted user_id matches the authenticated user
create policy profiles_insert_policy on profiles
    for insert
    with check (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own profile
-- USING checks existing row ownership, WITH CHECK ensures updated row still belongs to user
create policy profiles_update_policy on profiles
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- DELETE policy: Users can only delete their own profile
create policy profiles_delete_policy on profiles
    for delete
    using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- RLS Policies for recipes table
-- ---------------------------------------------------------------------
-- All policies use auth.uid() to identify the authenticated user
-- and restrict access to only the user's own recipes

-- SELECT policy: Users can only view their own recipes
create policy recipes_select_policy on recipes
    for select
    using (auth.uid() = user_id);

-- INSERT policy: Users can only create recipes for themselves
-- WITH CHECK ensures the inserted user_id matches the authenticated user
create policy recipes_insert_policy on recipes
    for insert
    with check (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own recipes
-- USING checks existing row ownership, WITH CHECK ensures updated row still belongs to user
create policy recipes_update_policy on recipes
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- DELETE policy: Users can only delete their own recipes
create policy recipes_delete_policy on recipes
    for delete
    using (auth.uid() = user_id);

-- =====================================================================
-- End of Migration
-- =====================================================================

