import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GenerateRecipeResponseDTO,
  IngredientWarning,
  RecipeDTO,
  CreateRecipeCommand,
  UpdateRecipeCommand,
  RecipeQueryParams,
  RecipeListResponseDTO,
  PaginationDTO,
  ProfileDTO,
} from "../../types";
import { AIService } from "./ai.service";

/**
 * Recipe Service
 * Handles all business logic for recipe management
 */
export class RecipeService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Generates a recipe using AI and checks for ingredient warnings
   *
   * @param ingredients - Array of ingredients to use
   * @param userId - ID of the user generating the recipe
   * @param supabase - Supabase client instance
   * @returns Generated recipe with warnings if any
   */
  async generateRecipeWithWarnings(
    ingredients: string[],
    userId: string,
    supabase: SupabaseClient
  ): Promise<GenerateRecipeResponseDTO> {
    try {
      // Sanitize ingredients before sending to AI
      const sanitizedIngredients = this.aiService.sanitizeIngredients(ingredients);

      // Generate recipe using AI service
      const recipe = await this.aiService.generateRecipe(sanitizedIngredients);

      // Fetch user profile to check for ingredients to avoid
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single<ProfileDTO>();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" - it's ok if profile doesn't exist yet
        console.error("[RecipeService.generateRecipeWithWarnings] Error fetching profile:", {
          userId,
          error: profileError.message,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for ingredient warnings
      const warnings = profile ? this.checkIngredientsAgainstProfile(recipe.ingredients, profile) : [];

      return {
        recipe,
        warnings,
      };
    } catch (error) {
      console.error("[RecipeService.generateRecipeWithWarnings] Error:", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Checks recipe ingredients against user's ingredients to avoid
   *
   * @param recipeIngredients - Ingredients from the generated recipe
   * @param profile - User profile with ingredients_to_avoid
   * @returns Array of warnings for conflicting ingredients
   */
  private checkIngredientsAgainstProfile(recipeIngredients: string[], profile: ProfileDTO): IngredientWarning[] {
    if (!profile.ingredients_to_avoid || profile.ingredients_to_avoid.length === 0) {
      return [];
    }

    const warnings: IngredientWarning[] = [];
    const ingredientsToAvoid = profile.ingredients_to_avoid.map((i) => i.toLowerCase());

    for (const ingredient of recipeIngredients) {
      const ingredientLower = ingredient.toLowerCase();

      for (const avoidIngredient of ingredientsToAvoid) {
        if (ingredientLower.includes(avoidIngredient)) {
          warnings.push({
            type: "ingredient_to_avoid",
            message: `This recipe contains '${avoidIngredient}' which is in your ingredients to avoid list`,
            ingredient: avoidIngredient,
          });
          break; // Only warn once per ingredient
        }
      }
    }

    return warnings;
  }

  /**
   * Creates a new recipe in the database
   *
   * @param command - Recipe data to create
   * @param userId - ID of the user creating the recipe
   * @param supabase - Supabase client instance
   * @returns Created recipe with all database fields
   */
  async createRecipe(command: CreateRecipeCommand, userId: string, supabase: SupabaseClient): Promise<RecipeDTO> {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          user_id: userId,
          title: command.title,
          ingredients: command.ingredients as unknown as never, // Cast for JSONB
          preparation_steps: command.preparation_steps as unknown as never, // Cast for JSONB
          source: command.source,
        })
        .select()
        .single();

      if (error) {
        console.error("[RecipeService.createRecipe] Database error:", {
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Failed to create recipe");
      }

      // Transform the data to match RecipeDTO type
      return {
        ...data,
        ingredients: data.ingredients as unknown as string[],
        preparation_steps: data.preparation_steps as unknown as string[],
      };
    } catch (error) {
      console.error("[RecipeService.createRecipe] Error:", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Retrieves paginated list of recipes for a user
   *
   * @param userId - ID of the user
   * @param params - Query parameters for filtering, sorting, and pagination
   * @param supabase - Supabase client instance
   * @returns Paginated list of recipes with metadata
   */
  async getRecipes(
    userId: string,
    params: RecipeQueryParams,
    supabase: SupabaseClient
  ): Promise<RecipeListResponseDTO> {
    try {
      const { page = 1, limit = 20, sort = "created_at", order = "desc", source } = params;
      const offset = (page - 1) * limit;

      // Build base query
      let query = supabase.from("recipes").select("*", { count: "exact" }).eq("user_id", userId);

      // Apply source filter if provided
      if (source) {
        query = query.eq("source", source);
      }

      // Apply sorting
      query = query.order(sort, { ascending: order === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("[RecipeService.getRecipes] Database error:", {
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Failed to fetch recipes");
      }

      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      const pagination: PaginationDTO = {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      };

      // Transform data to match RecipeDTO type
      const recipes: RecipeDTO[] = (data || []).map((recipe) => ({
        ...recipe,
        ingredients: recipe.ingredients as unknown as string[],
        preparation_steps: recipe.preparation_steps as unknown as string[],
      }));

      return {
        recipes,
        pagination,
      };
    } catch (error) {
      console.error("[RecipeService.getRecipes] Error:", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Retrieves a single recipe by ID
   *
   * @param id - Recipe ID
   * @param userId - ID of the user (for authorization)
   * @param supabase - Supabase client instance
   * @returns Recipe if found and belongs to user, null otherwise
   */
  async getRecipeById(id: string, userId: string, supabase: SupabaseClient): Promise<RecipeDTO | null> {
    try {
      const { data, error } = await supabase.from("recipes").select("*").eq("id", id).eq("user_id", userId).single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }

        console.error("[RecipeService.getRecipeById] Database error:", {
          id,
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Failed to fetch recipe");
      }

      // Transform data to match RecipeDTO type
      return {
        ...data,
        ingredients: data.ingredients as unknown as string[],
        preparation_steps: data.preparation_steps as unknown as string[],
      };
    } catch (error) {
      console.error("[RecipeService.getRecipeById] Error:", {
        id,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Updates an existing recipe
   *
   * @param id - Recipe ID
   * @param userId - ID of the user (for authorization)
   * @param command - Partial recipe data to update
   * @param supabase - Supabase client instance
   * @returns Updated recipe if found and belongs to user, null otherwise
   */
  async updateRecipe(
    id: string,
    userId: string,
    command: UpdateRecipeCommand,
    supabase: SupabaseClient
  ): Promise<RecipeDTO | null> {
    try {
      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {};

      if (command.title !== undefined) {
        updateData.title = command.title;
      }
      if (command.ingredients !== undefined) {
        updateData.ingredients = command.ingredients;
      }
      if (command.preparation_steps !== undefined) {
        updateData.preparation_steps = command.preparation_steps;
      }

      const { data, error } = await supabase
        .from("recipes")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }

        console.error("[RecipeService.updateRecipe] Database error:", {
          id,
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Failed to update recipe");
      }

      // Transform data to match RecipeDTO type
      return {
        ...data,
        ingredients: data.ingredients as unknown as string[],
        preparation_steps: data.preparation_steps as unknown as string[],
      };
    } catch (error) {
      console.error("[RecipeService.updateRecipe] Error:", {
        id,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Deletes a recipe
   *
   * @param id - Recipe ID
   * @param userId - ID of the user (for authorization)
   * @param supabase - Supabase client instance
   * @returns true if deleted, false if not found or doesn't belong to user
   */
  async deleteRecipe(id: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
    try {
      const { error, count } = await supabase
        .from("recipes")
        .delete({ count: "exact" })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("[RecipeService.deleteRecipe] Database error:", {
          id,
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Failed to delete recipe");
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error("[RecipeService.deleteRecipe] Error:", {
        id,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}
