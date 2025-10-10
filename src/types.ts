import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ============================================================================
// Profile DTOs and Command Models
// ============================================================================

/**
 * Profile Data Transfer Object
 * Used for GET /api/profiles/me response
 * Directly maps to the profiles table
 */
export type ProfileDTO = Tables<"profiles">;

/**
 * Command model for creating a new profile
 * Used for POST /api/profiles request
 * user_id is automatically set from authentication context
 */
export type CreateProfileCommand = Pick<TablesInsert<"profiles">, "ingredients_to_avoid">;

/**
 * Command model for updating user profile
 * Used for PATCH /api/profiles/me request
 * ingredients_to_avoid is required in the update request
 */
export type UpdateProfileCommand = Required<Pick<TablesUpdate<"profiles">, "ingredients_to_avoid">>;

// ============================================================================
// Recipe DTOs and Command Models
// ============================================================================

/**
 * Base recipe type with properly typed ingredient and preparation_steps arrays
 * Transforms Json types from database to string[] for better type safety
 */
type RecipeBase = Omit<Tables<"recipes">, "ingredients" | "preparation_steps"> & {
  ingredients: string[];
  preparation_steps: string[];
};

/**
 * Recipe Data Transfer Object
 * Used for GET /api/recipes/:id and GET /api/recipes responses
 */
export type RecipeDTO = RecipeBase;

/**
 * Command model for generating AI recipe
 * Used for POST /api/recipes/generate request
 * Requires minimum 3 ingredients (validated at runtime)
 */
export interface GenerateRecipeCommand {
  ingredients: string[];
}

/**
 * Generated recipe structure (not yet saved to database)
 * Used in POST /api/recipes/generate response
 * Contains only the recipe data without database metadata
 */
export type GeneratedRecipeDTO = Pick<RecipeBase, "title" | "ingredients" | "preparation_steps">;

/**
 * Warning structure for ingredients to avoid
 * Included in recipe generation response when conflicts detected
 */
export interface IngredientWarning {
  type: "ingredient_to_avoid";
  message: string;
  ingredient: string;
}

/**
 * Complete response for recipe generation
 * Used for POST /api/recipes/generate response
 */
export interface GenerateRecipeResponseDTO {
  recipe: GeneratedRecipeDTO;
  warnings: IngredientWarning[];
}

/**
 * Command model for creating a recipe (manual or saving AI-generated)
 * Used for POST /api/recipes request
 * Excludes auto-generated fields (id, user_id, timestamps)
 */
export type CreateRecipeCommand = Pick<RecipeBase, "title" | "ingredients" | "preparation_steps" | "source">;

/**
 * Command model for updating an existing recipe
 * Used for PATCH /api/recipes/:id request
 * All fields are optional (at least one must be provided, validated at runtime)
 * Both AI-generated and manual recipes can be updated once saved
 */
export type UpdateRecipeCommand = Partial<Pick<RecipeBase, "title" | "ingredients" | "preparation_steps">>;

/**
 * Pagination metadata structure
 * Used in paginated list responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Recipe list response with pagination
 * Used for GET /api/recipes response
 */
export interface RecipeListResponseDTO {
  recipes: RecipeDTO[];
  pagination: PaginationDTO;
}

/**
 * Query parameters for recipe list endpoint
 * Used for GET /api/recipes query string parsing
 */
export interface RecipeQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  source?: Enums<"recipe_source">;
}

// ============================================================================
// Common Response DTOs
// ============================================================================

/**
 * Standard success response structure
 * Used for DELETE operations and other success confirmations
 */
export interface SuccessResponseDTO {
  success: true;
  message: string;
}

/**
 * Standard error response structure
 * Used for all error responses across the API
 * Details can be a string or object with field-specific errors
 */
export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: string | Record<string, string>;
}
