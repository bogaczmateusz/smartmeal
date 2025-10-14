import type { APIContext } from "astro";
import { supabaseClient, DEFAULT_USER_ID } from "../../../db/supabase.client";
import { RecipeService } from "../../../lib/services/recipe.service";
import { generateRecipeSchema } from "../../../lib/validation/recipe.validation";
import { createErrorResponse } from "../../../lib/utils";
import type { GenerateRecipeResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/recipes/generate
 * Generates a recipe using AI based on provided ingredients
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
    const validation = generateRecipeSchema.safeParse(body);

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

    // Call service to generate recipe
    const recipeService = new RecipeService();
    const result: GenerateRecipeResponseDTO = await recipeService.generateRecipeWithWarnings(
      validation.data.ingredients,
      userId,
      supabaseClient
    );

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      // Log error for debugging
      console.error("[POST /api/recipes/generate] Error:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Check for AI service errors
      if (error.message.includes("Failed to generate recipe")) {
        return createErrorResponse(
          503,
          "Service temporarily unavailable",
          "The recipe generation service is currently unavailable. Please try again later."
        );
      }
    }

    // Generic server error
    return createErrorResponse(500, "Internal server error", "An unexpected error occurred");
  }
}
