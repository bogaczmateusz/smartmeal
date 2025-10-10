# REST API Plan - SmartMeal

## 1. Resources

The API exposes the following main resources based on the database schema:

| Resource | Database Table | Description |
|----------|---------------|-------------|
| **Profiles** | `profiles` | User profile and preferences (ingredients to avoid) |
| **Recipes** | `recipes` | User-saved recipes (both AI-generated and manual) |
| **Users** | `auth.users` | User account management (handled primarily by Supabase Auth) |

**Note:** The `auth.users` table is managed by Supabase Auth. Authentication operations (register, login, logout) are handled by Supabase Auth SDK on the client-side. The API only provides endpoints for account deletion.

## 2. Endpoints

### 2.1 Authentication & User Management

#### Delete User Account
Permanently deletes the authenticated user's account and all associated data.

- **HTTP Method:** `DELETE`
- **URL Path:** `/api/users/me`
- **Description:** Deletes the current user's account, profile, and all recipes (cascading delete)
- **Authentication:** Required (JWT token)
- **Request Payload:** None
- **Response Payload:**
  ```json
  {
    "success": true,
    "message": "Account deleted successfully"
  }
  ```
- **Success Codes:**
  - `200 OK` - Account successfully deleted
- **Error Codes:**
  - `401 Unauthorized` - User not authenticated
  - `500 Internal Server Error` - Server error during deletion

---

### 2.2 Profile Management

#### Get Current User's Profile
Retrieves the authenticated user's profile with preferences.

- **HTTP Method:** `GET`
- **URL Path:** `/api/profiles/me`
- **Description:** Fetches the current user's profile including ingredients to avoid
- **Authentication:** Required (JWT token)
- **Request Payload:** None
- **Response Payload:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "ingredients_to_avoid": ["peanuts", "shellfish"],
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:22:00Z"
  }
  ```
- **Success Codes:**
  - `200 OK` - Profile retrieved successfully
  - `404 Not Found` - Profile does not exist (should trigger profile creation)
- **Error Codes:**
  - `401 Unauthorized` - User not authenticated
  - `500 Internal Server Error` - Server error

#### Create User Profile
Creates a profile for the authenticated user (typically called after registration).

- **HTTP Method:** `POST`
- **URL Path:** `/api/profiles`
- **Description:** Creates a new profile for the authenticated user
- **Authentication:** Required (JWT token)
- **Request Payload:**
  ```json
  {
    "ingredients_to_avoid": ["peanuts", "shellfish"]
  }
  ```
  - `ingredients_to_avoid` (optional): Array of ingredient strings, defaults to empty array
- **Response Payload:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "ingredients_to_avoid": ["peanuts", "shellfish"],
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
  ```
- **Success Codes:**
  - `201 Created` - Profile created successfully
- **Error Codes:**
  - `401 Unauthorized` - User not authenticated
  - `409 Conflict` - Profile already exists for this user
  - `500 Internal Server Error` - Server error

#### Update User Profile
Updates the authenticated user's profile (currently only ingredients to avoid).

- **HTTP Method:** `PATCH`
- **URL Path:** `/api/profiles/me`
- **Description:** Updates the current user's profile preferences
- **Authentication:** Required (JWT token)
- **Request Payload:**
  ```json
  {
    "ingredients_to_avoid": ["peanuts", "shellfish", "dairy"]
  }
  ```
  - `ingredients_to_avoid` (required): Complete array of ingredient strings to avoid
- **Response Payload:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "ingredients_to_avoid": ["peanuts", "shellfish", "dairy"],
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:22:00Z"
  }
  ```
- **Success Codes:**
  - `200 OK` - Profile updated successfully
- **Error Codes:**
  - `401 Unauthorized` - User not authenticated
  - `404 Not Found` - Profile does not exist
  - `500 Internal Server Error` - Server error

---

### 2.3 Recipe Management

#### Generate AI Recipe
Generates a recipe using AI based on provided ingredients.

- **HTTP Method:** `POST`
- **URL Path:** `/api/recipes/generate`
- **Description:** Generates a recipe using AI service (OpenRouter). Recipe is NOT saved to database and is returned to the client for preview. The client holds the recipe in state where it cannot be edited until the user explicitly saves it via `POST /api/recipes`.
- **Authentication:** Required (JWT token)
- **Request Payload:**
  ```json
  {
    "ingredients": ["chicken", "rice", "broccoli", "garlic"]
  }
  ```
  - `ingredients` (required): Array of at least 3 ingredient strings
- **Response Payload:**
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
- **Success Codes:**
  - `200 OK` - Recipe generated successfully
- **Error Codes:**
  - `400 Bad Request` - Validation errors (e.g., fewer than 3 ingredients)
    ```json
    {
      "error": "Validation failed",
      "details": "At least 3 ingredients are required to generate a recipe"
    }
    ```
  - `401 Unauthorized` - User not authenticated
  - `503 Service Unavailable` - AI service is down or unavailable
    ```json
    {
      "error": "Service temporarily unavailable",
      "message": "The recipe generation service is currently unavailable. Please try again later."
    }
    ```
  - `500 Internal Server Error` - Server error

#### Create Recipe (Manual or Save AI-Generated)
Creates a new recipe (either manual or saves an AI-generated one).

- **HTTP Method:** `POST`
- **URL Path:** `/api/recipes`
- **Description:** Creates a new recipe for the authenticated user
- **Authentication:** Required (JWT token)
- **Request Payload:**
  ```json
  {
    "title": "My Special Pasta",
    "ingredients": [
      "500g pasta",
      "2 cups tomato sauce",
      "1 onion, diced"
    ],
    "preparation_steps": [
      "Boil pasta according to package instructions",
      "Sauté onion until translucent",
      "Add tomato sauce and simmer",
      "Combine with pasta and serve"
    ],
    "source": "manual"
  }
  ```
  - `title` (required): String, max 255 characters
  - `ingredients` (required): Array of strings, at least 1 item
  - `preparation_steps` (required): Array of strings, at least 1 item
  - `source` (required): Enum - either `"ai"` or `"manual"`
- **Response Payload:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "My Special Pasta",
    "ingredients": [
      "500g pasta",
      "2 cups tomato sauce",
      "1 onion, diced"
    ],
    "preparation_steps": [
      "Boil pasta according to package instructions",
      "Sauté onion until translucent",
      "Add tomato sauce and simmer",
      "Combine with pasta and serve"
    ],
    "source": "manual",
    "created_at": "2025-01-20T15:30:00Z",
    "updated_at": "2025-01-20T15:30:00Z"
  }
  ```
- **Success Codes:**
  - `201 Created` - Recipe created successfully
- **Error Codes:**
  - `400 Bad Request` - Validation errors
    ```json
    {
      "error": "Validation failed",
      "details": {
        "title": "Title is required and must not exceed 255 characters",
        "ingredients": "At least one ingredient is required",
        "preparation_steps": "At least one preparation step is required",
        "source": "Source must be either 'ai' or 'manual'"
      }
    }
    ```
  - `401 Unauthorized` - User not authenticated
  - `500 Internal Server Error` - Server error

#### Get All Recipes
Retrieves all recipes for the authenticated user with pagination and sorting.

- **HTTP Method:** `GET`
- **URL Path:** `/api/recipes`
- **Description:** Fetches a paginated list of the user's recipes
- **Authentication:** Required (JWT token)
- **Query Parameters:**
  - `page` (optional): Page number, default `1`
  - `limit` (optional): Items per page, default `20`, max `100`
  - `sort` (optional): Sort field, default `created_at`
  - `order` (optional): Sort order - `asc` or `desc`, default `desc`
  - `source` (optional): Filter by source - `ai` or `manual`
- **Example:** `/api/recipes?page=1&limit=20&sort=created_at&order=desc`
- **Request Payload:** None
- **Response Payload:**
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
- **Success Codes:**
  - `200 OK` - Recipes retrieved successfully
- **Error Codes:**
  - `400 Bad Request` - Invalid query parameters
  - `401 Unauthorized` - User not authenticated
  - `500 Internal Server Error` - Server error

#### Get Single Recipe
Retrieves a specific recipe by ID.

- **HTTP Method:** `GET`
- **URL Path:** `/api/recipes/:id`
- **Description:** Fetches detailed information for a specific recipe
- **Authentication:** Required (JWT token)
- **URL Parameters:**
  - `id` (required): Recipe UUID
- **Request Payload:** None
- **Response Payload:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Garlic Chicken with Rice",
    "ingredients": [
      "2 chicken breasts",
      "2 cups rice",
      "3 cloves garlic"
    ],
    "preparation_steps": [
      "Cook rice according to package instructions",
      "Season chicken with salt and pepper",
      "Sauté garlic until fragrant",
      "Cook chicken until done",
      "Serve together"
    ],
    "source": "ai",
    "created_at": "2025-01-20T15:30:00Z",
    "updated_at": "2025-01-20T15:30:00Z"
  }
  ```
- **Success Codes:**
  - `200 OK` - Recipe retrieved successfully
- **Error Codes:**
  - `401 Unauthorized` - User not authenticated
  - `404 Not Found` - Recipe does not exist or user doesn't have access
  - `500 Internal Server Error` - Server error

#### Update Recipe
Updates an existing saved recipe (both AI-generated and manually created).

- **HTTP Method:** `PATCH`
- **URL Path:** `/api/recipes/:id`
- **Description:** Updates any saved recipe belonging to the authenticated user
- **Authentication:** Required (JWT token)
- **URL Parameters:**
  - `id` (required): Recipe UUID
- **Request Payload:**
  ```json
  {
    "title": "Updated Pasta Recipe",
    "ingredients": [
      "600g pasta",
      "2 cups tomato sauce",
      "1 onion, diced",
      "2 cloves garlic"
    ],
    "preparation_steps": [
      "Boil pasta",
      "Sauté onion and garlic",
      "Add sauce",
      "Combine and serve"
    ]
  }
  ```
  - `title` (optional): String, max 255 characters
  - `ingredients` (optional): Array of strings, at least 1 item
  - `preparation_steps` (optional): Array of strings, at least 1 item
  - Note: At least one field must be provided
- **Response Payload:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Updated Pasta Recipe",
    "ingredients": [
      "600g pasta",
      "2 cups tomato sauce",
      "1 onion, diced",
      "2 cloves garlic"
    ],
    "preparation_steps": [
      "Boil pasta",
      "Sauté onion and garlic",
      "Add sauce",
      "Combine and serve"
    ],
    "source": "manual",
    "created_at": "2025-01-20T15:30:00Z",
    "updated_at": "2025-01-21T10:15:00Z"
  }
  ```
- **Success Codes:**
  - `200 OK` - Recipe updated successfully
- **Error Codes:**
  - `400 Bad Request` - Validation errors
    ```json
    {
      "error": "Validation failed",
      "details": {
        "title": "Title must not exceed 255 characters",
        "ingredients": "At least one ingredient is required",
        "preparation_steps": "At least one preparation step is required"
      }
    }
    ```
  - `401 Unauthorized` - User not authenticated
  - `404 Not Found` - Recipe does not exist or user doesn't have access
  - `500 Internal Server Error` - Server error

#### Delete Recipe
Deletes a recipe (both AI-generated and manual recipes can be deleted).

- **HTTP Method:** `DELETE`
- **URL Path:** `/api/recipes/:id`
- **Description:** Permanently deletes a recipe
- **Authentication:** Required (JWT token)
- **URL Parameters:**
  - `id` (required): Recipe UUID
- **Request Payload:** None
- **Response Payload:**
  ```json
  {
    "success": true,
    "message": "Recipe deleted successfully"
  }
  ```
- **Success Codes:**
  - `200 OK` - Recipe deleted successfully
- **Error Codes:**
  - `401 Unauthorized` - User not authenticated
  - `404 Not Found` - Recipe does not exist or user doesn't have access
  - `500 Internal Server Error` - Server error

---

## 3. Authentication and Authorization

### Authentication Mechanism

The SmartMeal API uses **Supabase Auth** with **JWT (JSON Web Tokens)** for authentication.

#### Implementation Details

1. **Client-Side Authentication:**
   - User registration, login, and logout are handled by the Supabase Auth SDK on the client-side
   - The SDK automatically manages JWT tokens (access token and refresh token)
   - Tokens are stored securely in localStorage or sessionStorage by the Supabase client

2. **API Authentication:**
   - All API endpoints (except public endpoints, if any) require authentication
   - Clients must include the JWT access token in the `Authorization` header:
     ```
     Authorization: Bearer <access_token>
     ```
   - The API validates the JWT token using Supabase Auth's built-in verification

3. **Token Validation Flow:**
   ```
   Client Request → API Endpoint → Astro Middleware → Verify JWT → Extract user_id → Process Request
   ```

4. **Middleware Implementation (Astro):**
   - A global middleware (`src/middleware/index.ts`) intercepts all API requests
   - Validates the JWT token using Supabase client
   - Extracts the authenticated user's ID (`auth.uid()`)
   - Attaches user context to the request
   - Returns `401 Unauthorized` if token is invalid or missing

5. **Row-Level Security (RLS):**
   - Supabase RLS policies ensure database-level security
   - Even if API logic has bugs, RLS prevents unauthorized data access
   - All queries to `profiles` and `recipes` tables automatically filter by `auth.uid()`

### Authorization Rules

1. **Profile Access:**
   - Users can only view, create, update, and delete their own profile
   - Enforced by RLS policies: `auth.uid() = user_id`

2. **Recipe Access:**
   - Users can only view, create, update, and delete their own recipes
   - Enforced by RLS policies: `auth.uid() = user_id`
   - Both AI-generated and manually created recipes can be edited once saved to the database
   - **Client-side rule:** AI-generated recipes cannot be edited before being saved (enforced in UI, not API)

3. **Account Deletion:**
   - Users can only delete their own account
   - Cascade deletion automatically removes all associated profiles and recipes

### Security Best Practices

1. **HTTPS Only:** All API communication must occur over HTTPS in production
2. **Token Expiration:** Access tokens expire after a set period (configured in Supabase Auth)
3. **Refresh Tokens:** Client SDK automatically refreshes expired access tokens
4. **Rate Limiting:** Consider implementing rate limiting on AI generation endpoint to prevent abuse
5. **CORS Configuration:** Configure allowed origins in Astro to prevent unauthorized access

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Profile Resource

| Field | Validation Rules |
|-------|-----------------|
| `user_id` | - Required<br>- Must be a valid UUID<br>- Must match authenticated user's ID<br>- Must be unique (one profile per user) |
| `ingredients_to_avoid` | - Optional (defaults to empty array)<br>- Must be an array of strings<br>- Each string should be trimmed and non-empty |

#### Recipe Resource

| Field | Validation Rules |
|-------|-----------------|
| `title` | - Required (for creation)<br>- Must be a string<br>- Maximum length: 255 characters<br>- Must not be empty or only whitespace |
| `ingredients` | - Required (for creation)<br>- Must be an array of strings<br>- Minimum 1 item (for manual creation)<br>- Minimum 3 items (for AI generation)<br>- Each item must be a non-empty string |
| `preparation_steps` | - Required (for creation)<br>- Must be an array of strings<br>- Minimum 1 item<br>- Each item must be a non-empty string |
| `source` | - Required (for creation)<br>- Must be enum value: `"ai"` or `"manual"`<br>- Cannot be changed after creation<br>- Does not restrict editing: both AI and manual recipes can be updated once saved |
| `user_id` | - Automatically set to authenticated user's ID<br>- Cannot be manually specified<br>- Must be a valid UUID |

### 4.2 Business Logic Implementation

#### 1. AI Recipe Generation Logic

**Endpoint:** `POST /api/recipes/generate`

**Flow:**
1. Validate that at least 3 ingredients are provided
2. Fetch user's profile to get `ingredients_to_avoid` list
3. Check for conflicts between input ingredients and `ingredients_to_avoid`
4. If conflicts found, prepare warning messages (non-blocking)
5. Construct AI prompt with:
   - Input ingredients
   - Instructions for creative and varied results
   - Structured output format (title, ingredients, steps)
6. Call OpenRouter API with the prompt
7. Parse AI response into structured format
8. Return recipe and any warnings to client
9. **Important:** Recipe is NOT saved to database at this stage

**Client-Side Workflow:**
1. Client receives generated recipe and displays it to user
2. Recipe is held in client-side state (React state/context)
3. UI prevents editing the recipe while in this preview state
4. User can either:
   - **Accept:** Call `POST /api/recipes` with `source: "ai"` to save it
   - **Reject:** Discard the client-side state and generate a new recipe
5. Once saved to database, the recipe can be edited like any other saved recipe via `PATCH /api/recipes/:id`

**Error Handling:**
- If AI service is unavailable: Return `503 Service Unavailable` with user-friendly message
- If AI returns invalid format: Return `500 Internal Server Error` with error details
- If validation fails: Return `400 Bad Request` with specific validation errors

#### 2. Ingredients to Avoid Warning

**Implemented in:** `POST /api/recipes/generate`

**Logic:**
1. Retrieve user's `ingredients_to_avoid` array from profile
2. Compare (case-insensitive) each input ingredient against the avoid list
3. For each match, create a warning object:
   ```json
   {
     "type": "ingredient_to_avoid",
     "message": "This recipe contains '{ingredient}' which is in your ingredients to avoid list",
     "ingredient": "{ingredient}"
   }
   ```
4. Include warnings array in response
5. **Non-blocking:** Generation proceeds regardless of warnings
6. Client displays warnings but allows user to save recipe if desired

#### 3. Recipe Update Logic

**Endpoint:** `PATCH /api/recipes/:id`

**Logic:**
1. Fetch recipe from database by ID
2. Verify recipe belongs to authenticated user (via RLS)
3. Validate updated fields:
   - `title`: Max 255 characters if provided
   - `ingredients`: At least 1 item if provided
   - `preparation_steps`: At least 1 item if provided
4. Update recipe in database (works for both `source = 'ai'` and `source = 'manual'`)
5. Trigger automatically updates `updated_at` timestamp
6. Return updated recipe

**Important:** Once a recipe is saved to the database (regardless of source), it becomes fully editable. The restriction on editing AI-generated recipes applies only to the client-side state before the recipe is saved. This is enforced in the UI layer, not the API.

#### 4. Account Deletion Cascade

**Endpoint:** `DELETE /api/users/me`

**Flow:**
1. Verify user is authenticated
2. Get authenticated user's ID
3. Database cascade delete automatically removes:
   - User's profile (via `ON DELETE CASCADE` on `profiles.user_id`)
   - All user's recipes (via `ON DELETE CASCADE` on `recipes.user_id`)
4. Delete user from `auth.users` using Supabase Auth Admin API
5. Return success message
6. Client should clear local session and redirect to login page

**Important:** The order matters - database records are deleted first via cascading foreign keys, then the auth user is removed.

#### 5. Profile Creation After Registration

**Endpoint:** `POST /api/profiles`

**Flow:**
1. User registers via Supabase Auth SDK (client-side)
2. After successful registration, client immediately calls `POST /api/profiles`
3. API creates profile with `user_id` = authenticated user's ID
4. If profile already exists: Return `409 Conflict`
5. Profile is created with empty `ingredients_to_avoid` array by default

**Alternative Flow:** Use Supabase database triggers to automatically create profile when user registers (can be implemented in future iteration).

#### 6. Pagination Logic

**Endpoint:** `GET /api/recipes`

**Implementation:**
1. Parse query parameters: `page`, `limit`, `sort`, `order`, `source`
2. Validate parameters:
   - `page`: Must be positive integer, default `1`
   - `limit`: Must be 1-100, default `20`
   - `sort`: Must be valid column name, default `created_at`
   - `order`: Must be `asc` or `desc`, default `desc`
   - `source`: Must be `ai`, `manual`, or omitted
3. Calculate offset: `(page - 1) × limit`
4. Build SQL query with filters and sorting
5. Execute count query to get total items
6. Execute data query with limit and offset
7. Calculate pagination metadata:
   - `total_pages = Math.ceil(total_items / limit)`
   - `has_next = page < total_pages`
   - `has_previous = page > 1`
8. Return recipes array and pagination object

#### 7. Input Sanitization

**Applied to all endpoints:**
1. Trim whitespace from all string inputs
2. Validate data types match schema
3. Remove any HTML/script tags from user input (XSS prevention)
4. Limit array sizes to prevent DoS attacks
5. Validate UUID format for ID parameters

### 4.3 Error Response Standard

All error responses follow a consistent format:

```json
{
  "error": "Error category",
  "message": "User-friendly error message",
  "details": "Additional details (optional)"
}
```

**Common Error Categories:**
- `"Validation failed"` - Input validation errors
- `"Unauthorized"` - Authentication failures
- `"Forbidden"` - Authorization failures  
- `"Not found"` - Resource doesn't exist
- `"Conflict"` - Resource already exists
- `"Service unavailable"` - External service errors
- `"Internal server error"` - Unexpected server errors

### 4.4 Success Response Standard

Success responses include:
1. Appropriate HTTP status code (200, 201, etc.)
2. Data payload in JSON format
3. Consistent field naming (snake_case)
4. ISO 8601 formatted timestamps
5. Complete resource representation (no partial objects)

---

## 5. Rate Limiting (Future Consideration)

For production deployment, consider implementing rate limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/recipes/generate` | 10 requests | Per minute |
| Other endpoints | 100 requests | Per minute |

Rate limit headers to include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## 6. Monitoring and Logging

**Recommended logging for production:**
1. Log all API requests with: timestamp, endpoint, user_id, response status
2. Log all AI generation requests and responses
3. Log all errors with stack traces
4. Track AI generation success/failure rate
5. Monitor API response times
6. Track user metrics: registrations, recipe creations, AI vs manual ratio

**Metrics to track (per PRD success metrics):**
- AI recipe save rate: `(saved_ai_recipes / generated_ai_recipes) × 100%` (target: 75%)
- AI vs manual ratio: `(ai_recipes / total_recipes) × 100%` (target: 75%)

