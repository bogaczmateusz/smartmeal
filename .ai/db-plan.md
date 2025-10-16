# SmartMeal Database Schema

## 1. Custom Types

### recipe_source ENUM
```sql
CREATE TYPE recipe_source AS ENUM ('ai', 'manual');
```

## 2. Tables

### auth.users
**⚠️ THIS TABLE IS MANAGED BY SUPABASE AUTH.**

This table is part of Supabase's authentication system and is automatically managed by Supabase Auth. It stores user authentication credentials and is located in the `auth` schema, separate from the `public` schema where application tables reside.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique identifier for the user |
| email | varchar(255) | NOT NULL, UNIQUE | User's email address |
| encrypted_password | varchar | NOT NULL | Encrypted password (managed by Supabase Auth) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Timestamp when the user account was created |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Timestamp when the user account was last updated |

**Important Notes:**
- This table is automatically created and managed by Supabase Auth
- Never create, modify, or delete records in this table directly via migrations
- Use Supabase Auth API/SDK for all user authentication operations
- When a user is deleted from `auth.users`, all related records in `profiles` and `recipes` tables are automatically deleted via `ON DELETE CASCADE`

### profiles
Stores user-specific preferences and profile data, maintaining a one-to-one relationship with Supabase's auth.users table.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique identifier for the profile |
| user_id | uuid | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | Foreign key linking to Supabase auth.users |
| ingredients_to_avoid | text[] | DEFAULT '{}' | Array of ingredient names the user wants to avoid |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Timestamp when the profile was created |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Timestamp when the profile was last updated |

**Constraints:**
- PRIMARY KEY: id
- UNIQUE: user_id
- FOREIGN KEY: user_id REFERENCES auth.users(id) ON DELETE CASCADE

### recipes
Stores all user-saved recipes, both AI-generated and manually created.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the recipe |
| user_id | uuid | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Foreign key linking to the recipe owner |
| title | varchar(255) | NOT NULL | Recipe title, limited to 255 characters |
| ingredients | jsonb | NOT NULL | Structured list of ingredients stored as JSON |
| preparation_steps | jsonb | NOT NULL | Structured list of preparation steps stored as JSON |
| source | recipe_source | NOT NULL | Origin of the recipe: 'ai' or 'manual' |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Timestamp when the recipe was created |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Timestamp when the recipe was last updated |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES auth.users(id) ON DELETE CASCADE

**JSONB Structure Examples:**

ingredients:
```json
[
  "2 cups flour",
  "1 cup sugar",
  "3 eggs"
]
```

preparation_steps:
```json
[
  "Preheat oven to 350°F",
  "Mix dry ingredients",
  "Add wet ingredients and stir until combined"
]
```

## 3. Relationships

### Entity Relationship Overview
The `auth.users` table serves as the central entity that anchors user-specific data. All application tables reference this table to associate data with authenticated users.

### auth.users ↔ profiles (One-to-One)
- Each user can have at most one profile
- Each profile belongs to exactly one user
- Foreign key: profiles.user_id → auth.users.id
- Cascade: ON DELETE CASCADE (deleting a user automatically removes their profile)

### auth.users ↔ recipes (One-to-Many)
- Each user can have multiple recipes
- Each recipe belongs to exactly one user
- Foreign key: recipes.user_id → auth.users.id
- Cascade: ON DELETE CASCADE (deleting a user automatically removes all their recipes)

## 4. Indexes

### idx_profiles_user_id
```sql
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```
**Purpose:** Optimize lookups of profile data by user ID.

### idx_recipes_user_id
```sql
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
```
**Purpose:** Optimize retrieval of all recipes belonging to a specific user.

### idx_recipes_created_at
```sql
CREATE INDEX idx_recipes_created_at ON recipes(user_id, created_at DESC);
```
**Purpose:** Optimize queries that fetch user's recipes ordered by creation date (most recent first).

## 5. Triggers and Functions

### update_updated_at_column()
Function to automatically update the updated_at timestamp when a record is modified.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### profiles_updated_at_trigger
```sql
CREATE TRIGGER profiles_updated_at_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### recipes_updated_at_trigger
```sql
CREATE TRIGGER recipes_updated_at_trigger
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 6. Row-Level Security (RLS) Policies

### profiles Table

**Enable RLS:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Policy: profiles_select_policy**
```sql
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT
    USING (auth.uid() = user_id);
```
Users can only view their own profile.

**Policy: profiles_insert_policy**
```sql
CREATE POLICY profiles_insert_policy ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```
Users can only create their own profile.

**Policy: profiles_update_policy**
```sql
CREATE POLICY profiles_update_policy ON profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```
Users can only update their own profile.

**Policy: profiles_delete_policy**
```sql
CREATE POLICY profiles_delete_policy ON profiles
    FOR DELETE
    USING (auth.uid() = user_id);
```
Users can only delete their own profile.

### recipes Table

**Enable RLS:**
```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
```

**Policy: recipes_select_policy**
```sql
CREATE POLICY recipes_select_policy ON recipes
    FOR SELECT
    USING (auth.uid() = user_id);
```
Users can only view their own recipes.

**Policy: recipes_insert_policy**
```sql
CREATE POLICY recipes_insert_policy ON recipes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```
Users can only create recipes for themselves.

**Policy: recipes_update_policy**
```sql
CREATE POLICY recipes_update_policy ON recipes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```
Users can only update their own recipes.

**Policy: recipes_delete_policy**
```sql
CREATE POLICY recipes_delete_policy ON recipes
    FOR DELETE
    USING (auth.uid() = user_id);
```
Users can only delete their own recipes.

## 7. Design Decisions and Notes

### 1. Supabase Auth Integration
- The `auth.users` table is managed exclusively by Supabase Auth and resides in the `auth` schema.
- This table should NEVER be modified directly through application migrations or queries.
- All user authentication operations (registration, login, password reset, account deletion) must be performed using Supabase Auth API/SDK.
- When a user is deleted via Supabase Auth, the `ON DELETE CASCADE` constraints ensure automatic cleanup of all associated data in the application tables (`profiles` and `recipes`).

### 2. Separation of Concerns
- The `profiles` table is separate from Supabase's `auth.users` table to maintain a clear separation between authentication data (managed by Supabase Auth) and application-specific user data.
- This approach provides flexibility for future expansion of user preferences without modifying the authentication schema.
- Application tables exist in the `public` schema while authentication data remains in the `auth` schema.

### 3. JSONB for Flexible Data
- `ingredients` and `preparation_steps` are stored as `jsonb` rather than in separate normalized tables.
- This design choice prioritizes simplicity for the MVP while maintaining flexibility for future enhancements.
- JSONB allows for efficient querying and indexing if needed in the future.
- The application layer is responsible for maintaining consistent structure within these JSONB fields.

### 4. recipe_source ENUM
- A custom PostgreSQL ENUM type ensures data integrity by restricting the `source` column to only valid values ('ai' or 'manual').
- This prevents invalid data entry and makes the schema self-documenting.
- The `source` field is informational and does not impose any editing restrictions at the database level — both 'ai' and 'manual' recipes can be updated via the API once saved.

### 5. Cascading Deletes
- `ON DELETE CASCADE` on all foreign keys ensures that when a user deletes their account, all associated data (profile, recipes) is automatically removed.
- This satisfies the PRD requirement (Section 3.1) for complete data erasure upon account deletion.

### 6. Row-Level Security (RLS)
- RLS is enabled on both user-facing tables to ensure data isolation at the database level.
- Policies use Supabase's `auth.uid()` helper function to identify the authenticated user.
- All CRUD operations are restricted to the data owner, providing defense-in-depth security.

### 7. Performance Optimization
- Indexes on `user_id` columns enable efficient lookups of user-specific data.
- The composite index on `recipes(user_id, created_at DESC)` optimizes the common query pattern of fetching a user's recipes sorted by creation date.

### 8. Timestamps and Audit Trail
- `created_at` and `updated_at` columns on all tables provide a basic audit trail.
- Automatic triggers ensure `updated_at` is always current without requiring application-layer management.

### 9. UUID Primary Keys
- All tables use UUID primary keys, aligning with Supabase best practices.
- UUIDs provide globally unique identifiers and better security (no sequential ID guessing).
- The `gen_random_uuid()` function automatically generates values for new records.

### 10. Title and Text Field Constraints
- The recipe title is limited to 255 characters using `VARCHAR(255)` type.
- User email addresses are limited to 255 characters using `VARCHAR(255)` type (managed by Supabase Auth).
- Encrypted passwords use `VARCHAR` without a specific length limit (managed by Supabase Auth).
- Titles are NOT required to be unique, as users may legitimately want multiple recipes with the same or similar names.

### 11. ingredients_to_avoid Storage
- Stored as PostgreSQL array (`text[]`) for simplicity and efficiency.
- Default empty array (`'{}'`) ensures the field is never null, simplifying application logic.
- Arrays are simple to query and update, suitable for the MVP's single preference list.

### 12. Scalability Considerations
- The schema avoids premature optimization while providing a solid foundation for future growth.
- JSONB fields can be easily migrated to normalized tables if complex querying becomes necessary.
- The use of indexes ensures good performance even as data volume grows.

### 13. VARCHAR vs TEXT Data Types
- `VARCHAR(n)` is used for fields with known character limits (e.g., `title`, `email`).
- `VARCHAR` without a length limit is used for variable-length strings where the exact maximum is unknown but should still be character-based (e.g., `encrypted_password`).
- `TEXT` is used for potentially longer content without practical limits (e.g., individual ingredients in JSONB arrays).
- Using `VARCHAR(255)` instead of `TEXT` with `CHECK` constraints makes the schema more self-documenting and follows PostgreSQL conventions.

### 14. Data Integrity
- NOT NULL constraints on critical fields prevent incomplete data.
- Foreign key constraints ensure referential integrity.
- Character limits enforced via `VARCHAR(n)` ensure data consistency and prevent excessively long values.

