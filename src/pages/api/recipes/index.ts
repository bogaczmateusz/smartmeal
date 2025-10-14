import type { APIContext } from "astro";
import { supabaseClient, DEFAULT_USER_ID } from "../../../db/supabase.client";
import { RecipeService } from "../../../lib/services/recipe.service";
import { createRecipeSchema, recipeQuerySchema } from "../../../lib/validation/recipe.validation";
import { createErrorResponse } from "../../../lib/utils";
import type { RecipeDTO, RecipeListResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/recipes
 * Creates a new recipe (manual or saving AI-generated)
 */
export async function POST(context: APIContext) {
  try {
    // TODO: Authentication check when Supabase auth is ready
    // For now, use DEFAULT_USER_ID
    const userId = DEFAULT_USER_ID;

    // Parse request body
    const body = await context.request.json().catch(() => null);

    if (!body) {
      return createErrorResponse(400, "Bad request", "Invalid JSON in request body");
    }

    // Validate request body
    const validation = createRecipeSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return createErrorResponse(400, "Validation failed", "Invalid request data", errors);
    }

    // Call service to create recipe
    const recipeService = new RecipeService();
    const recipe: RecipeDTO = await recipeService.createRecipe(validation.data, userId, supabaseClient);

    // Return success response with 201 Created
    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      // Log error for debugging
      console.error("[POST /api/recipes] Error:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Generic server error
    return createErrorResponse(500, "Internal server error", "An unexpected error occurred");
  }
}

/**
 * GET /api/recipes
 * Retrieves paginated list of recipes with optional filters
 */
export async function GET(context: APIContext) {
  try {
    // TODO: Authentication check when Supabase auth is ready
    // For now, use DEFAULT_USER_ID
    const userId = DEFAULT_USER_ID;

    // Parse query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page") ?? 1,
      limit: url.searchParams.get("limit") ?? 20,
      sort: url.searchParams.get("sort") ?? "created_at",
      order: url.searchParams.get("order") ?? "desc",
      source: url.searchParams.get("source") ?? undefined,
    };

    // Validate query parameters
    const validation = recipeQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const errors = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return createErrorResponse(400, "Validation failed", "Invalid query parameters", errors);
    }

    // Call service to get recipes
    const recipeService = new RecipeService();
    const result: RecipeListResponseDTO = await recipeService.getRecipes(userId, validation.data, supabaseClient);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      // Log error for debugging
      console.error("[GET /api/recipes] Error:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Generic server error
    return createErrorResponse(500, "Internal server error", "An unexpected error occurred");
  }
}
