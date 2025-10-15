# Mock Data Testing Guide

This document describes the mock data implementation for all recipe endpoints and how to test them.

## Summary of Changes

All Supabase functionality has been commented out (but preserved) in `src/lib/services/recipe.service.ts`. Each method now uses mock data for testing. The Supabase code is wrapped in block comments and can be easily restored when ready.

## Mock Data

The service includes 3 sample recipes in `MOCK_RECIPES`:

1. **Classic Spaghetti Carbonara** (ID: `550e8400-e29b-41d4-a716-446655440001`)
   - Source: `ai`
   - 6 ingredients
   - 7 preparation steps

2. **Grilled Chicken Salad** (ID: `550e8400-e29b-41d4-a716-446655440002`)
   - Source: `manual`
   - 8 ingredients
   - 7 preparation steps

3. **Vegetable Stir Fry** (ID: `550e8400-e29b-41d4-a716-446655440003`)
   - Source: `ai`
   - 10 ingredients
   - 7 preparation steps

All recipes belong to `user_id: "default-user-id"` (matching `DEFAULT_USER_ID` from `supabase.client.ts`).

## Available Endpoints

### 1. Generate Recipe (Already Working)
**POST** `/api/recipes/generate`

```json
{
  "ingredients": ["chicken", "rice", "broccoli"]
}
```

Response includes generated recipe + warnings (warnings are empty in mock mode).

---

### 2. List All Recipes
**GET** `/api/recipes`

Query parameters (all optional):
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sort`: Field to sort by (default: "created_at")
- `order`: "asc" or "desc" (default: "desc")
- `source`: Filter by source ("ai" or "manual")

**Example:**
```
GET /api/recipes
GET /api/recipes?source=ai
GET /api/recipes?page=1&limit=10&sort=title&order=asc
```

**Response:**
```json
{
  "recipes": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 3,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

---

### 3. Get Recipe by ID
**GET** `/api/recipes/:id`

**Example:**
```
GET /api/recipes/550e8400-e29b-41d4-a716-446655440001
```

**Response:** Single recipe object or 404 if not found.

---

### 4. Create New Recipe
**POST** `/api/recipes`

```json
{
  "title": "My Custom Recipe",
  "ingredients": [
    "Ingredient 1",
    "Ingredient 2"
  ],
  "preparation_steps": [
    "Step 1",
    "Step 2"
  ],
  "source": "manual"
}
```

**Response:** Created recipe with auto-generated ID and timestamps.

---

### 5. Update Recipe
**PATCH** `/api/recipes/:id`

All fields are optional (at least one required):

```json
{
  "title": "Updated Title",
  "ingredients": ["Updated ingredient list"],
  "preparation_steps": ["Updated steps"]
}
```

**Example:**
```
PATCH /api/recipes/550e8400-e29b-41d4-a716-446655440001
```

**Response:** Updated recipe object or 404 if not found.

---

### 6. Delete Recipe
**DELETE** `/api/recipes/:id`

**Example:**
```
DELETE /api/recipes/550e8400-e29b-41d4-a716-446655440001
```

**Response:**
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

Or 404 if not found.

---

## Testing with cURL

### List all recipes
```bash
curl http://localhost:4321/api/recipes
```

### Get specific recipe
```bash
curl http://localhost:4321/api/recipes/550e8400-e29b-41d4-a716-446655440001
```

### Create new recipe
```bash
curl -X POST http://localhost:4321/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recipe",
    "ingredients": ["test ingredient"],
    "preparation_steps": ["test step"],
    "source": "manual"
  }'
```

### Update recipe
```bash
curl -X PATCH http://localhost:4321/api/recipes/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Carbonara"
  }'
```

### Delete recipe
```bash
curl -X DELETE http://localhost:4321/api/recipes/550e8400-e29b-41d4-a716-446655440001
```

### Generate recipe
```bash
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": ["chicken", "rice", "vegetables"]
  }'
```

---

## Mock Data Behavior

1. **Persistence:** Mock data persists only during the server runtime. Restarting the server resets to the original 3 recipes.

2. **Creating recipes:** New recipes get auto-incremented IDs starting from `550e8400-e29b-41d4-a716-446655440004`.

3. **Updating/Deleting:** These operations modify the in-memory `MOCK_RECIPES` array.

4. **Filtering:** Source filtering and pagination work correctly with mock data.

5. **Warnings:** Recipe generation returns empty warnings array since profile data is not available in mock mode.

---

## Restoring Supabase Functionality

When ready to switch back to Supabase:

1. In `src/lib/services/recipe.service.ts`, for each method:
   - Remove or comment out the "MOCK DATA" section
   - Uncomment the "SUPABASE IMPLEMENTATION" block
   
2. Remove the `MOCK_RECIPES` and `mockRecipeCounter` static properties

3. Test with actual Supabase database

All Supabase code has been preserved in block comments for easy restoration.

