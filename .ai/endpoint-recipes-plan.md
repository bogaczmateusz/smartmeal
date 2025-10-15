# API Endpoint Implementation Plan: Recipe Management

## 1. Endpoint Overview

The Recipe Management API provides a complete CRUD interface for managing user recipes with AI-powered generation capabilities. The system consists of six endpoints that enable users to:

1. **Generate recipes using AI** based on available ingredients (preview only, not saved)
2. **Create and save recipes** manually or from AI-generated previews
3. **Retrieve recipes** with pagination, filtering, and sorting capabilities
4. **Update existing recipes** with partial modifications
5. **Delete recipes** permanently from the system

**Key Workflow:**
```
User provides ingredients → AI generates recipe → User previews → User saves → User can update/delete
```

All endpoints require authentication and ensure users can only access their own recipes. The AI generation feature includes intelligent warnings when ingredients conflict with the user's "ingredients to avoid" profile settings.

## 2. Request Details

### 2.1 Generate AI Recipe

- **HTTP Method:** POST
- **URL Structure:** `/api/recipes/generate`
- **Authentication:** Required (JWT token via Supabase auth)
- **Parameters:**
  - **Required:**
    - `ingredients` (array of strings, minimum 3 items)
  - **Optional:** None
- **Request Body:**
  ```json
  {
    "ingredients": ["chicken", "rice", "broccoli", "garlic"]
  }
  ```

### 2.2 Create Recipe

- **HTTP Method:** POST
- **URL Structure:** `/api/recipes`
- **Authentication:** Required (JWT token via Supabase auth)
- **Parameters:**
  - **Required:**
    - `title` (string, max 255 characters)
    - `ingredients` (array of strings, minimum 1 item)
    - `preparation_steps` (array of strings, minimum 1 item)
    - `source` (enum: 'ai' | 'manual')
  - **Optional:** None
- **Request Body:**
  ```json
  {
    "title": "My Special Pasta",
    "ingredients": ["500g pasta", "2 cups tomato sauce"],
    "preparation_steps": ["Boil pasta", "Add sauce"],
    "source": "manual"
  }
  ```

### 2.3 Get All Recipes

- **HTTP Method:** GET
- **URL Structure:** `/api/recipes`
- **Authentication:** Required (JWT token via Supabase auth)
- **Parameters:**
  - **Required:** None
  - **Optional:**
    - `page` (number, default: 1, minimum: 1)
    - `limit` (number, default: 20, maximum: 100)
    - `sort` (string, default: 'created_at')
    - `order` (enum: 'asc' | 'desc', default: 'desc')
    - `source` (enum: 'ai' | 'manual')
- **Example:** `/api/recipes?page=1&limit=20&sort=created_at&order=desc&source=ai`

### 2.4 Get Single Recipe

- **HTTP Method:** GET
- **URL Structure:** `/api/recipes/:id`
- **Authentication:** Required (JWT token via Supabase auth)
- **Parameters:**
  - **Required:**
    - `id` (URL parameter, UUID format)
  - **Optional:** None
- **Example:** `/api/recipes/123e4567-e89b-12d3-a456-426614174000`

### 2.5 Update Recipe

- **HTTP Method:** PATCH
- **URL Structure:** `/api/recipes/:id`
- **Authentication:** Required (JWT token via Supabase auth)
- **Parameters:**
  - **Required:**
    - `id` (URL parameter, UUID format)
    - At least one of: `title`, `ingredients`, or `preparation_steps`
  - **Optional:**
    - `title` (string, max 255 characters)
    - `ingredients` (array of strings, minimum 1 item)
    - `preparation_steps` (array of strings, minimum 1 item)
- **Request Body:**
  ```json
  {
    "title": "Updated Pasta Recipe",
    "ingredients": ["600g pasta", "2 cups sauce"]
  }
  ```

### 2.6 Delete Recipe

- **HTTP Method:** DELETE
- **URL Structure:** `/api/recipes/:id`
- **Authentication:** Required (JWT token via Supabase auth)
- **Parameters:**
  - **Required:**
    - `id` (URL parameter, UUID format)
  - **Optional:** None

## 3. Used Types

### 3.1 Request Types (Command Models)

```typescript
// From types.ts
type GenerateRecipeCommand = {
  ingredients: string[];
}

type CreateRecipeCommand = Pick<RecipeBase, "title" | "ingredients" | "preparation_steps" | "source">;

type UpdateRecipeCommand = Partial<Pick<RecipeBase, "title" | "ingredients" | "preparation_steps">>;

type RecipeQueryParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  source?: Enums<"recipe_source">;
}
```

### 3.2 Response Types (DTOs)

```typescript
// From types.ts
type GeneratedRecipeDTO = Pick<RecipeBase, "title" | "ingredients" | "preparation_steps">;

type IngredientWarning = {
  type: "ingredient_to_avoid";
  message: string;
  ingredient: string;
}

type GenerateRecipeResponseDTO = {
  recipe: GeneratedRecipeDTO;
  warnings: IngredientWarning[];
}

type RecipeDTO = RecipeBase;  // Includes all fields with id, user_id, timestamps

type PaginationDTO = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

type RecipeListResponseDTO = {
  recipes: RecipeDTO[];
  pagination: PaginationDTO;
}

type SuccessResponseDTO = {
  success: true;
  message: string;
}

type ErrorResponseDTO = {
  error: string;
  message: string;
  details?: string | Record<string, string>;
}
```

### 3.3 Validation Schemas (Zod)

Create in `src/lib/validation/recipe.validation.ts`:

```typescript
import { z } from 'zod';

export const generateRecipeSchema = z.object({
  ingredients: z
    .array(z.string().trim().min(1, "Ingredient cannot be empty"))
    .min(3, "At least 3 ingredients are required to generate a recipe"),
});

export const createRecipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  ingredients: z
    .array(z.string().trim().min(1, "Ingredient cannot be empty"))
    .min(1, "At least one ingredient is required"),
  preparation_steps: z
    .array(z.string().trim().min(1, "Preparation step cannot be empty"))
    .min(1, "At least one preparation step is required"),
  source: z.enum(['ai', 'manual'], {
    errorMap: () => ({ message: "Source must be either 'ai' or 'manual'" }),
  }),
});

export const updateRecipeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(255, "Title must not exceed 255 characters")
      .optional(),
    ingredients: z
      .array(z.string().trim().min(1, "Ingredient cannot be empty"))
      .min(1, "At least one ingredient is required")
      .optional(),
    preparation_steps: z
      .array(z.string().trim().min(1, "Preparation step cannot be empty"))
      .min(1, "At least one preparation step is required")
      .optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.ingredients !== undefined || data.preparation_steps !== undefined,
    { message: "At least one field (title, ingredients, or preparation_steps) must be provided" }
  );

export const recipeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  source: z.enum(['ai', 'manual']).optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid recipe ID format"),
});
```

## 4. Response Details

### 4.1 Generate AI Recipe (POST /api/recipes/generate)

**Success Response (200 OK):**
```json
{
  "recipe": {
    "title": "Garlic Chicken with Broccoli Rice",
    "ingredients": [
      "2 chicken breasts, diced",
      "2 cups cooked rice",
      "1 cup broccoli florets",
      "3 cloves garlic, minced"
    ],
    "preparation_steps": [
      "Heat oil in a large pan over medium heat",
      "Add garlic and cook until fragrant",
      "Add chicken and cook until golden brown",
      "Add broccoli and cook for 5 minutes",
      "Mix in rice and stir well",
      "Season to taste and serve hot"
    ]
  },
  "warnings": [
    {
      "type": "ingredient_to_avoid",
      "message": "This recipe contains 'garlic' which is in your ingredients to avoid list",
      "ingredient": "garlic"
    }
  ]
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "error": "Validation failed",
    "message": "At least 3 ingredients are required to generate a recipe"
  }
  ```
- **401 Unauthorized:** Standard auth error
- **503 Service Unavailable:**
  ```json
  {
    "error": "Service temporarily unavailable",
    "message": "The recipe generation service is currently unavailable. Please try again later."
  }
  ```
- **500 Internal Server Error:** Standard server error

### 4.2 Create Recipe (POST /api/recipes)

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "My Special Pasta",
  "ingredients": ["500g pasta", "2 cups tomato sauce"],
  "preparation_steps": ["Boil pasta", "Add sauce"],
  "source": "manual",
  "created_at": "2025-01-20T15:30:00Z",
  "updated_at": "2025-01-20T15:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "error": "Validation failed",
    "message": "Invalid request data",
    "details": {
      "title": "Title is required and must not exceed 255 characters",
      "ingredients": "At least one ingredient is required"
    }
  }
  ```
- **401 Unauthorized:** Standard auth error
- **500 Internal Server Error:** Standard server error

### 4.3 Get All Recipes (GET /api/recipes)

**Success Response (200 OK):**
```json
{
  "recipes": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Garlic Chicken with Rice",
      "ingredients": ["chicken", "rice", "garlic"],
      "preparation_steps": ["Step 1", "Step 2"],
      "source": "ai",
      "created_at": "2025-01-20T15:30:00Z",
      "updated_at": "2025-01-20T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 45,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid query parameters
- **401 Unauthorized:** Standard auth error
- **500 Internal Server Error:** Standard server error

### 4.4 Get Single Recipe (GET /api/recipes/:id)

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Garlic Chicken with Rice",
  "ingredients": ["2 chicken breasts", "2 cups rice"],
  "preparation_steps": ["Cook rice", "Season chicken"],
  "source": "ai",
  "created_at": "2025-01-20T15:30:00Z",
  "updated_at": "2025-01-20T15:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request:** Invalid UUID format
- **401 Unauthorized:** Standard auth error
- **404 Not Found:** Recipe does not exist or user doesn't have access
- **500 Internal Server Error:** Standard server error

### 4.5 Update Recipe (PATCH /api/recipes/:id)

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Updated Pasta Recipe",
  "ingredients": ["600g pasta", "2 cups sauce"],
  "preparation_steps": ["Boil pasta", "Add sauce"],
  "source": "manual",
  "created_at": "2025-01-20T15:30:00Z",
  "updated_at": "2025-01-21T10:15:00Z"
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "error": "Validation failed",
    "message": "Invalid request data",
    "details": {
      "title": "Title must not exceed 255 characters"
    }
  }
  ```
- **401 Unauthorized:** Standard auth error
- **404 Not Found:** Recipe does not exist or user doesn't have access
- **500 Internal Server Error:** Standard server error

### 4.6 Delete Recipe (DELETE /api/recipes/:id)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request:** Invalid UUID format
- **401 Unauthorized:** Standard auth error
- **404 Not Found:** Recipe does not exist or user doesn't have access
- **500 Internal Server Error:** Standard server error

## 5. Data Flow

### 5.1 Generate AI Recipe Flow

```
1. Client sends POST /api/recipes/generate with ingredients
2. Middleware validates JWT token and attaches user to context
3. API route validates request body using Zod schema
4. Route calls RecipeService.generateRecipe(ingredients, userProfile)
5. RecipeService calls AIService.generateRecipe(ingredients)
6. AIService sends request to OpenRouter API with formatted prompt
7. AIService receives and parses AI response into GeneratedRecipeDTO
8. RecipeService calls RecipeService.checkIngredientsAgainstProfile()
9. RecipeService returns GenerateRecipeResponseDTO with recipe and warnings
10. API route returns 200 OK with response body
```

**External Dependencies:**
- OpenRouter.ai API for AI recipe generation
- User profile data from Supabase (ingredients_to_avoid)

### 5.2 Create Recipe Flow

```
1. Client sends POST /api/recipes with recipe data
2. Middleware validates JWT token and attaches user to context
3. API route validates request body using Zod schema
4. Route calls RecipeService.createRecipe(command, userId)
5. RecipeService inserts recipe into recipes table via Supabase
6. Supabase auto-generates id, timestamps
7. RecipeService returns created RecipeDTO
8. API route returns 201 Created with recipe
```

**Database Operations:**
- INSERT into recipes table with user_id, title, ingredients (JSONB), preparation_steps (JSONB), source

### 5.3 Get All Recipes Flow

```
1. Client sends GET /api/recipes with query parameters
2. Middleware validates JWT token and attaches user to context
3. API route validates query parameters using Zod schema
4. Route calls RecipeService.getRecipes(userId, params)
5. RecipeService builds Supabase query with filters, sorting, pagination
6. RecipeService executes count query for total_items
7. RecipeService executes data query with offset and limit
8. RecipeService calculates pagination metadata
9. RecipeService returns RecipeListResponseDTO
10. API route returns 200 OK with recipes and pagination
```

**Database Operations:**
- COUNT query on recipes table (filtered by user_id and optional source)
- SELECT query with WHERE, ORDER BY, LIMIT, OFFSET

### 5.4 Get Single Recipe Flow

```
1. Client sends GET /api/recipes/:id
2. Middleware validates JWT token and attaches user to context
3. API route validates UUID parameter using Zod schema
4. Route calls RecipeService.getRecipeById(id, userId)
5. RecipeService queries recipes table with id AND user_id filter
6. RecipeService returns RecipeDTO or null
7. API route returns 200 OK if found, 404 Not Found if null
```

**Database Operations:**
- SELECT single row from recipes WHERE id = ? AND user_id = ?

### 5.5 Update Recipe Flow

```
1. Client sends PATCH /api/recipes/:id with partial data
2. Middleware validates JWT token and attaches user to context
3. API route validates UUID parameter and request body using Zod schemas
4. Route calls RecipeService.updateRecipe(id, userId, command)
5. RecipeService updates recipe in recipes table with id AND user_id filter
6. Supabase auto-updates updated_at timestamp
7. RecipeService returns updated RecipeDTO or null
8. API route returns 200 OK if found, 404 Not Found if null
```

**Database Operations:**
- UPDATE recipes SET ... WHERE id = ? AND user_id = ?
- Returns updated row

### 5.6 Delete Recipe Flow

```
1. Client sends DELETE /api/recipes/:id
2. Middleware validates JWT token and attaches user to context
3. API route validates UUID parameter using Zod schema
4. Route calls RecipeService.deleteRecipe(id, userId)
5. RecipeService deletes recipe from recipes table with id AND user_id filter
6. RecipeService returns true if deleted, false if not found
7. API route returns 200 OK if deleted, 404 Not Found if not
```

**Database Operations:**
- DELETE FROM recipes WHERE id = ? AND user_id = ?
- Returns affected row count

## 6. Security Considerations

### 6.1 Authentication

- **All endpoints require JWT authentication** via Supabase auth
- Middleware must validate token and extract user ID before processing requests
- Use `context.locals.supabase` from Astro middleware (not direct import)
- Invalid or expired tokens return 401 Unauthorized
- Implementation in `src/middleware/index.ts`:
  ```typescript
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  context.locals.user = user;
  ```

### 6.2 Authorization

- **Row-level authorization**: All database queries must filter by `user_id`
- Users can only access, modify, or delete their own recipes
- Never trust client-provided user_id; always use authenticated user from JWT
- Implement in service layer:
  ```typescript
  // Always include user_id in WHERE clause
  .eq('user_id', userId)
  ```

### 6.3 Input Validation & Sanitization

- **Validate all inputs using Zod schemas** before processing
- Trim whitespace from string inputs
- Validate UUID format for recipe IDs
- Ensure arrays are not empty when required
- Protect against XSS by validating input (React handles output escaping)
- **AI Prompt Injection Prevention:**
  - Sanitize ingredients before sending to AI
  - Remove special characters that could manipulate prompts
  - Limit ingredient string length (e.g., max 100 chars per ingredient)
  - Use structured prompts with clear delimiters

### 6.4 Rate Limiting

- **AI Generation endpoint should be rate-limited** to prevent abuse
- Suggested limits:
  - 10 requests per minute per user
  - 100 requests per day per user
- Consider implementing using middleware or external service (e.g., Upstash)
- Return 429 Too Many Requests when limit exceeded

### 6.5 Data Protection

- **Never expose sensitive data:**
  - Don't include other users' data in responses
  - Don't expose internal error details to clients
  - Log errors server-side but return generic messages
- **Validate data types:**
  - Ensure JSONB fields (ingredients, preparation_steps) are arrays
  - Validate enum values (source, order)

### 6.6 SQL Injection Prevention

- Use Supabase's parameterized queries (automatic protection)
- Never concatenate user input into SQL strings
- Use Supabase query builder methods (.eq(), .select(), etc.)

### 6.7 API Key Security

- Store OpenRouter API key in environment variables (never in code)
- Use `import.meta.env.OPENROUTER_API_KEY` in Astro
- Never expose API keys in client-side code
- Rotate keys periodically

## 7. Error Handling

### 7.1 Error Handling Strategy

Follow the coding practice guidelines:
1. Handle errors and edge cases at the beginning of functions
2. Use early returns for error conditions
3. Place happy path last in the function
4. Avoid unnecessary else statements

### 7.2 Error Scenarios by Endpoint

#### POST /api/recipes/generate

| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Missing or invalid JWT | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Fewer than 3 ingredients | 400 | `{ "error": "Validation failed", "message": "At least 3 ingredients are required to generate a recipe" }` |
| Invalid ingredients format | 400 | `{ "error": "Validation failed", "message": "Invalid request data", "details": { "ingredients": "..." } }` |
| AI service timeout | 503 | `{ "error": "Service temporarily unavailable", "message": "The recipe generation service is currently unavailable. Please try again later." }` |
| AI service error | 503 | Same as above |
| Rate limit exceeded | 429 | `{ "error": "Too many requests", "message": "You have exceeded the rate limit. Please try again later." }` |
| Database error fetching profile | 500 | `{ "error": "Internal server error", "message": "An unexpected error occurred" }` |

#### POST /api/recipes

| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Missing or invalid JWT | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Missing required fields | 400 | `{ "error": "Validation failed", "message": "Invalid request data", "details": { "field": "error message" } }` |
| Title exceeds 255 chars | 400 | Field error in details |
| Empty ingredients array | 400 | Field error in details |
| Empty preparation_steps array | 400 | Field error in details |
| Invalid source value | 400 | Field error in details |
| Database insert error | 500 | `{ "error": "Internal server error", "message": "An unexpected error occurred" }` |

#### GET /api/recipes

| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Missing or invalid JWT | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Invalid page number | 400 | `{ "error": "Validation failed", "message": "Invalid request data", "details": { "page": "..." } }` |
| Limit exceeds 100 | 400 | Field error in details |
| Invalid sort field | 400 | Field error in details |
| Invalid order value | 400 | Field error in details |
| Invalid source value | 400 | Field error in details |
| Database query error | 500 | `{ "error": "Internal server error", "message": "An unexpected error occurred" }` |

#### GET /api/recipes/:id

| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Missing or invalid JWT | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Invalid UUID format | 400 | `{ "error": "Validation failed", "message": "Invalid recipe ID format" }` |
| Recipe not found | 404 | `{ "error": "Not found", "message": "Recipe not found" }` |
| Recipe belongs to another user | 404 | Same as above (don't reveal existence) |
| Database query error | 500 | `{ "error": "Internal server error", "message": "An unexpected error occurred" }` |

#### PATCH /api/recipes/:id

| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Missing or invalid JWT | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Invalid UUID format | 400 | `{ "error": "Validation failed", "message": "Invalid recipe ID format" }` |
| No fields provided | 400 | `{ "error": "Validation failed", "message": "At least one field (title, ingredients, or preparation_steps) must be provided" }` |
| Title exceeds 255 chars | 400 | Field error in details |
| Empty ingredients array | 400 | Field error in details |
| Empty preparation_steps array | 400 | Field error in details |
| Recipe not found | 404 | `{ "error": "Not found", "message": "Recipe not found" }` |
| Recipe belongs to another user | 404 | Same as above (don't reveal existence) |
| Database update error | 500 | `{ "error": "Internal server error", "message": "An unexpected error occurred" }` |

#### DELETE /api/recipes/:id

| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Missing or invalid JWT | 401 | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| Invalid UUID format | 400 | `{ "error": "Validation failed", "message": "Invalid recipe ID format" }` |
| Recipe not found | 404 | `{ "error": "Not found", "message": "Recipe not found" }` |
| Recipe belongs to another user | 404 | Same as above (don't reveal existence) |
| Database delete error | 500 | `{ "error": "Internal server error", "message": "An unexpected error occurred" }` |

### 7.3 Error Logging

- Log all errors to console with context:
  ```typescript
  console.error('[RecipeService.generateRecipe]', {
    userId: user.id,
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack
  });
  ```
- Never log sensitive information (auth tokens, full user profiles)
- Consider structured logging format for future analysis

### 7.4 Error Response Helper

Create helper function in `src/lib/utils.ts`:

```typescript
export function createErrorResponse(
  status: number,
  error: string,
  message: string,
  details?: string | Record<string, string>
): Response {
  const body: ErrorResponseDTO = { error, message };
  if (details) {
    body.details = details;
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
```

## 8. Performance Considerations

### 8.1 Database Optimization

- **Indexing:**
  - Primary key on `id` (automatic)
  - Index on `user_id` for faster filtering (should already exist due to foreign key)
  - Composite index on `(user_id, created_at)` for sorted queries
  - Consider index on `(user_id, source)` if source filtering is common
  
  ```sql
  CREATE INDEX idx_recipes_user_created ON recipes(user_id, created_at DESC);
  CREATE INDEX idx_recipes_user_source ON recipes(user_id, source);
  ```

- **Pagination:**
  - Use LIMIT and OFFSET for pagination
  - Calculate total_items with separate COUNT query
  - Consider cursor-based pagination for large datasets (future optimization)

- **JSONB Performance:**
  - JSONB fields (ingredients, preparation_steps) are efficient for storage and retrieval
  - Avoid complex JSONB queries if possible
  - For simple array storage, JSONB is optimal

### 8.3 Client-Side Considerations

- **Loading States:**
  - Provide clear loading indicators for AI generation (can take 5-15 seconds)
  - Show progress or estimated time

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/validation/recipe.validation.ts`

1. Create new file for recipe validation schemas
2. Import Zod
3. Define all validation schemas:
   - `generateRecipeSchema`
   - `createRecipeSchema`
   - `updateRecipeSchema`
   - `recipeQuerySchema`
   - `uuidParamSchema`
4. Export all schemas
5. Add JSDoc comments for each schema

### Step 2: Create AI Service

**File:** `src/lib/services/ai.service.ts`

1. Create new file for AI service
2. Define service class or module
3. Implement `generateRecipe(ingredients: string[])` method:
   - Build prompt with ingredient list
   - Call OpenRouter API with appropriate model (e.g., GPT-4, Claude)
   - Parse JSON response into `GeneratedRecipeDTO`
   - Handle errors and timeouts
   - Return generated recipe
4. Add error handling for:
   - Network errors
   - API errors
   - Invalid responses
   - Timeouts
5. Add logging for debugging
6. Export service

**Prompt Template:**
```
You are a professional chef. Generate a recipe using ONLY the following ingredients: {ingredients}.

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe name",
  "ingredients": ["measured ingredient 1", "measured ingredient 2", ...],
  "preparation_steps": ["step 1", "step 2", ...]
}

Requirements:
- Use ALL provided ingredients
- Include measurements and quantities
- Provide clear, numbered preparation steps
- Make the recipe practical and delicious
- Return ONLY the JSON object, no additional text
```

### Step 3: Create Recipe Service

**File:** `src/lib/services/recipe.service.ts`

1. Create new file for recipe service
2. Import necessary types from `src/types.ts`
3. Import Supabase client type
4. Import AI service
5. Implement service methods:

   **a. `generateRecipe(ingredients: string[], userId: string, supabase: SupabaseClient)`**
   - Call AIService.generateRecipe()
   - Fetch user profile to get ingredients_to_avoid
   - Call checkIngredientsAgainstProfile()
   - Return GenerateRecipeResponseDTO
   
   **b. `checkIngredientsAgainstProfile(ingredients: string[], profile: ProfileDTO)`**
   - Compare recipe ingredients against user's ingredients_to_avoid
   - Use case-insensitive matching
   - Return array of IngredientWarning objects
   
   **c. `createRecipe(command: CreateRecipeCommand, userId: string, supabase: SupabaseClient)`**
   - Insert recipe into database with user_id
   - Return created RecipeDTO
   - Handle database errors
   
   **d. `getRecipes(userId: string, params: RecipeQueryParams, supabase: SupabaseClient)`**
   - Build query with filters (source)
   - Add sorting (order, sort field)
   - Add pagination (limit, offset)
   - Execute count query for total items
   - Execute data query
   - Calculate pagination metadata
   - Return RecipeListResponseDTO
   
   **e. `getRecipeById(id: string, userId: string, supabase: SupabaseClient)`**
   - Query single recipe with id AND user_id filter
   - Return RecipeDTO or null
   
   **f. `updateRecipe(id: string, userId: string, command: UpdateRecipeCommand, supabase: SupabaseClient)`**
   - Update recipe with id AND user_id filter
   - Return updated RecipeDTO or null
   
   **g. `deleteRecipe(id: string, userId: string, supabase: SupabaseClient)`**
   - Delete recipe with id AND user_id filter
   - Return boolean (success)

6. Add error handling for all methods
7. Add logging for debugging
8. Export service

### Step 4: Create Error Response Helper

**File:** `src/lib/utils.ts` (add to existing file)

1. Import ErrorResponseDTO type
2. Implement `createErrorResponse()` helper function
3. Add JSDoc comments
4. Export function

### Step 5: Implement POST /api/recipes/generate

**File:** `src/pages/api/recipes/generate.ts`

1. Create new file
2. Set `export const prerender = false`
3. Import necessary types, validation schemas, services
4. Implement POST handler:
   - Check authentication from context.locals
   - Parse and validate request body using Zod
   - Call RecipeService.generateRecipe()
   - Handle errors (validation, auth, AI service, database)
   - Return appropriate responses
5. Export POST function
6. Test endpoint manually

**Code Structure:**
```typescript
export const prerender = false;

export async function POST(context: APIContext) {
  // 1. Authentication check (early return if not authenticated)
  // 2. Parse request body
  // 3. Validate using Zod schema (early return if invalid)
  // 4. Call service
  // 5. Handle errors (try-catch)
  // 6. Return success response
}
```

### Step 6: Implement POST /api/recipes

**File:** `src/pages/api/recipes/index.ts`

1. Create new file
2. Set `export const prerender = false`
3. Import necessary types, validation schemas, services
4. Implement POST handler:
   - Check authentication
   - Parse and validate request body
   - Call RecipeService.createRecipe()
   - Handle errors
   - Return 201 Created with recipe
5. Export POST function
6. Test endpoint

### Step 7: Implement GET /api/recipes

**File:** `src/pages/api/recipes/index.ts` (same file as Step 6)

1. Implement GET handler:
   - Check authentication
   - Parse and validate query parameters
   - Call RecipeService.getRecipes()
   - Handle errors
   - Return 200 OK with paginated list
2. Export GET function
3. Test endpoint with various query parameters

### Step 8: Implement GET /api/recipes/:id

**File:** `src/pages/api/recipes/[id].ts`

1. Create new file for dynamic route
2. Set `export const prerender = false`
3. Import necessary types, validation schemas, services
4. Implement GET handler:
   - Check authentication
   - Validate UUID parameter
   - Call RecipeService.getRecipeById()
   - Return 404 if not found
   - Return 200 OK with recipe
5. Export GET function
6. Test endpoint

### Step 9: Implement PATCH /api/recipes/:id

**File:** `src/pages/api/recipes/[id].ts` (same file as Step 8)

1. Implement PATCH handler:
   - Check authentication
   - Validate UUID parameter
   - Parse and validate request body
   - Call RecipeService.updateRecipe()
   - Return 404 if not found
   - Return 200 OK with updated recipe
2. Export PATCH function
3. Test endpoint

### Step 10: Implement DELETE /api/recipes/:id

**File:** `src/pages/api/recipes/[id].ts` (same file as Step 8)

1. Implement DELETE handler:
   - Check authentication
   - Validate UUID parameter
   - Call RecipeService.deleteRecipe()
   - Return 404 if not found
   - Return 200 OK with success message
2. Export DELETE function
3. Test endpoint

### Step 11: Add Database Indexes

**File:** `supabase/migrations/[timestamp]_add_recipe_indexes.sql`

1. Create new migration file
2. Add indexes for performance:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_recipes_user_created 
     ON recipes(user_id, created_at DESC);
   
   CREATE INDEX IF NOT EXISTS idx_recipes_user_source 
     ON recipes(user_id, source);
   ```
3. Run migration locally
4. Test query performance

### Step 12: Testing

1. **Unit Tests:**
   - Test validation schemas with valid/invalid inputs
   - Test service methods with mocked dependencies
   - Test error handling paths

2. **Integration Tests:**
   - Test each endpoint with Postman or similar tool
   - Test authentication scenarios
   - Test authorization (users can only access their own recipes)
   - Test error cases (400, 401, 404, 500)
   - Test pagination
   - Test AI generation with various ingredients
   - Test ingredient warnings

3. **Manual Testing:**
   - Create recipes manually
   - Generate AI recipes
   - Update recipes
   - Delete recipes

### Step 13: Documentation

1. Update API documentation with:
   - Endpoint descriptions
   - Request/response examples
   - Error codes and messages
   - Authentication requirements

2. Add code comments:
   - JSDoc for all public functions
   - Inline comments for complex logic

3. Update README with:
   - Setup instructions for OpenRouter API key
   - Environment variable requirements

### Step 14: Code Review & Refinement

1. Review code for:
   - Consistency with coding guidelines
   - Error handling completeness
   - Security vulnerabilities
   - Performance issues

2. Run linter and fix issues
3. Optimize imports
4. Remove console.logs (except error logging)
5. Test final implementation

---

## Dependencies

- OpenRouter API account and API key
- Supabase project setup with recipes table
- Environment variable: `OPENROUTER_API_KEY`

## Environment Variables

Add to `.env`:
```
OPENROUTER_API_KEY=your_api_key_here
```

## Testing Checklist

- [ ] POST /api/recipes/generate with valid ingredients
- [ ] POST /api/recipes/generate with < 3 ingredients (should fail)
- [ ] POST /api/recipes/generate returns warnings for ingredients to avoid
- [ ] POST /api/recipes creates recipe successfully
- [ ] POST /api/recipes validates all required fields
- [ ] GET /api/recipes returns paginated list
- [ ] GET /api/recipes filters by source
- [ ] GET /api/recipes sorts correctly
- [ ] GET /api/recipes/:id returns single recipe
- [ ] GET /api/recipes/:id returns 404 for non-existent recipe
- [ ] GET /api/recipes/:id returns 404 for other user's recipe
- [ ] PATCH /api/recipes/:id updates recipe
- [ ] PATCH /api/recipes/:id validates partial updates
- [ ] PATCH /api/recipes/:id returns 404 for non-existent recipe
- [ ] DELETE /api/recipes/:id deletes recipe
- [ ] DELETE /api/recipes/:id returns 404 for non-existent recipe
- [ ] All endpoints require authentication
- [ ] All endpoints return proper error responses