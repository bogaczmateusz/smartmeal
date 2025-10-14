import type { APIContext } from "astro";
import { supabaseClient, DEFAULT_USER_ID } from "../../../db/supabase.client";
import { RecipeService } from "../../../lib/services/recipe.service";
import { uuidParamSchema, updateRecipeSchema } from "../../../lib/validation/recipe.validation";
import { createErrorResponse } from "../../../lib/utils";
import type { RecipeDTO, SuccessResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/recipes/:id
 * Retrieves a single recipe by ID
 */
export async function GET(context: APIContext) {
  try {
    // TODO: Authentication check when Supabase auth is ready
    // For now, use DEFAULT_USER_ID
    const userId = DEFAULT_USER_ID;

    // Validate UUID parameter
    const paramValidation = uuidParamSchema.safeParse({ id: context.params.id });

    if (!paramValidation.success) {
      return createErrorResponse(400, "Validation failed", "Invalid recipe ID format");
    }

    // Call service to get recipe
    const recipeService = new RecipeService();
    const recipe: RecipeDTO | null = await recipeService.getRecipeById(paramValidation.data.id, userId, supabaseClient);

    if (!recipe) {
      return createErrorResponse(404, "Not found", "Recipe not found");
    }

    // Return success response
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      // Log error for debugging
      console.error("[GET /api/recipes/:id] Error:", {
        id: context.params.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Generic server error
    return createErrorResponse(500, "Internal server error", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/recipes/:id
 * Updates an existing recipe
 */
export async function PATCH(context: APIContext) {
  try {
    // TODO: Authentication check when Supabase auth is ready
    // For now, use DEFAULT_USER_ID
    const userId = DEFAULT_USER_ID;

    // Validate UUID parameter
    const paramValidation = uuidParamSchema.safeParse({ id: context.params.id });

    if (!paramValidation.success) {
      return createErrorResponse(400, "Validation failed", "Invalid recipe ID format");
    }

    // Parse request body
    const body = await context.request.json().catch(() => null);

    if (!body) {
      return createErrorResponse(400, "Bad request", "Invalid JSON in request body");
    }

    // Validate request body
    const validation = updateRecipeSchema.safeParse(body);

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

    // Call service to update recipe
    const recipeService = new RecipeService();
    const recipe: RecipeDTO | null = await recipeService.updateRecipe(
      paramValidation.data.id,
      userId,
      validation.data,
      supabaseClient
    );

    if (!recipe) {
      return createErrorResponse(404, "Not found", "Recipe not found");
    }

    // Return success response
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      // Log error for debugging
      console.error("[PATCH /api/recipes/:id] Error:", {
        id: context.params.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Generic server error
    return createErrorResponse(500, "Internal server error", "An unexpected error occurred");
  }
}

/**
 * DELETE /api/recipes/:id
 * Deletes a recipe permanently
 */
export async function DELETE(context: APIContext) {
  try {
    // TODO: Authentication check when Supabase auth is ready
    // For now, use DEFAULT_USER_ID
    const userId = DEFAULT_USER_ID;

    // Validate UUID parameter
    const paramValidation = uuidParamSchema.safeParse({ id: context.params.id });

    if (!paramValidation.success) {
      return createErrorResponse(400, "Validation failed", "Invalid recipe ID format");
    }

    // Call service to delete recipe
    const recipeService = new RecipeService();
    const deleted: boolean = await recipeService.deleteRecipe(paramValidation.data.id, userId, supabaseClient);

    if (!deleted) {
      return createErrorResponse(404, "Not found", "Recipe not found");
    }

    // Return success response
    const response: SuccessResponseDTO = {
      success: true,
      message: "Recipe deleted successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      // Log error for debugging
      console.error("[DELETE /api/recipes/:id] Error:", {
        id: context.params.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Generic server error
    return createErrorResponse(500, "Internal server error", "An unexpected error occurred");
  }
}
