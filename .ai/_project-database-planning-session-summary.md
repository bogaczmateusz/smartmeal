<conversation_summary>
<decisions>
1. A public.profiles table will be created to store application-specific user data, maintaining a one-to-one relationship with the auth.users table.
2. The ingredients and preparation_steps for recipes will be stored using the jsonb data type for flexibility.
3. A custom PostgreSQL ENUM type named recipe_source will be created with values ('ai', 'manual') to distinguish recipe origins.
4. The foreign key from the recipes table to the user's ID will use ON DELETE CASCADE to ensure data is erased when a user deletes their account.
5. Row-Level Security (RLS) will be enabled on the profiles and recipes tables to ensure users can only access their own data.
6. An index will be created on the user_id column in the recipes table to optimize query performance.
7. Primary keys for all new tables will be of type uuid.
8. The title column in the recipes table will be text, non-nullable, with a maximum length of 255 characters, but will not be required to be unique for the MVP.
9. The "ingredients to avoid" list in the profiles table will be stored as a text[] (array of strings).
10. All tables will include created_at and updated_at timestamp columns, with a trigger automatically managing the updated_at field.
11. All saved recipes, regardless of their source (AI or manual), will be editable by the user. The application logic will prevent editing of AI-generated recipes before they are explicitly saved.
</decisions>
<matched_recommendations>
1. User Profiles: Create a public.profiles table with a one-to-one relationship to auth.users to separate application data from authentication data.
2. Flexible Recipe Data: Use the jsonb data type for ingredients and preparation_steps to accommodate structured data without the need for additional tables in the MVP.
3. Data Integrity: Implement a custom ENUM type for the recipe source column to ensure data consistency.
4. Cascading Deletes: Use the ON DELETE CASCADE constraint to automatically handle the deletion of a user's recipes when their account is removed.
5. Row-Level Security: Enable RLS on user-specific tables (profiles, recipes) and create policies that restrict all data manipulation operations (SELECT, INSERT, UPDATE, DELETE) to the data owner.
6. Performance: Ensure an index is present on the user_id foreign key in the recipes table.
7. Primary Keys: Use uuid for primary keys, aligning with Supabase best practices.
8. Timestamps: Add created_at and updated_at columns and an automated trigger to track record modifications.
9. Data Types: Use text[] for the ingredients_to_avoid list for simplicity and efficiency.
</matched_recommendations>
<database_planning_summary>
The database plan for the SmartMeal MVP is centered around two primary entities: profiles and recipes, built on a Supabase (PostgreSQL) backend.

## Key Entities and Relationships:

- A profiles table will store user-specific preferences, starting with an ingredients_to_avoid list (stored as text[]). This table will have a one-to-one relationship with Supabase's auth.users table, linking via the user's UUID.
- A recipes table will store all user-saved recipes. It will have a many-to-one relationship with users (via a user_id foreign key that references auth.users.id). Each recipe will contain a title (text), ingredients (jsonb), preparation_steps (jsonb), source (a custom recipe_source enum: 'ai' or 'manual') and timestamps (created_at and updated_at).

## Data Integrity and Constraints:

- The recipes.user_id foreign key will be configured with ON DELETE CASCADE to automatically delete a user's recipes upon account deletion, as required by the PRD.
- The profiles.user_id foreign key will be configured with ON DELETE CASCADE to automatically delete a user's ingredients_to_avoid upon account deletion.
- Timestamps (created_at, updated_at) will be included in both tables, with a trigger to automatically update the updated_at field on modification, providing a clear audit trail.
- The recipe title is mandatory and limited to 255 characters. There will be no validation for providing an unique title.

## Security and Performance:
- Row-Level Security (RLS) is a core requirement and will be enabled on both profiles and recipes tables. Policies will be written to ensure that all operations are restricted to the record owner, using auth.uid() to identify the current user.
- To ensure efficient retrieval of recipes for a given user, an index will be placed on the recipes.user_id column.
- To ensure efficient retrieval of ingredients_to_avoid for a given user, an index will be placed on the profiles.user_id column.

## Scalability:
- The use of uuid for primary keys and jsonb for flexible data structures provides a solid foundation for future scalability. The schema is simple and avoids premature optimization, making it suitable for an MVP while allowing for future expansion.
</database_planning_summary>
</conversation_summary>