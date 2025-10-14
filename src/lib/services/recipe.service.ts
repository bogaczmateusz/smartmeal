import { DEFAULT_USER_ID, type SupabaseClient } from "../../db/supabase.client";
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

  // Mock data for development - will be removed when Supabase is enabled
  private static readonly MOCK_RECIPES: RecipeDTO[] = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      user_id: DEFAULT_USER_ID,
      title: "Classic Spaghetti Carbonara",
      ingredients: [
        "400g spaghetti",
        "200g pancetta or guanciale",
        "4 large eggs",
        "100g Pecorino Romano cheese, grated",
        "Black pepper to taste",
        "Salt for pasta water",
      ],
      preparation_steps: [
        "Bring a large pot of salted water to boil and cook spaghetti according to package directions",
        "While pasta cooks, cut pancetta into small cubes and fry in a large pan until crispy",
        "In a bowl, whisk together eggs and grated Pecorino Romano cheese",
        "Reserve 1 cup of pasta water, then drain the spaghetti",
        "Remove pan from heat and add hot pasta to the pancetta",
        "Quickly mix in the egg mixture, adding pasta water as needed to create a creamy sauce",
        "Season generously with black pepper and serve immediately",
      ],
      source: "ai",
      created_at: "2024-10-01T10:00:00Z",
      updated_at: "2024-10-01T10:00:00Z",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      user_id: DEFAULT_USER_ID,
      title: "Grilled Chicken Salad",
      ingredients: [
        "2 chicken breasts",
        "Mixed salad greens (200g)",
        "1 cucumber, sliced",
        "2 tomatoes, diced",
        "1/4 red onion, thinly sliced",
        "Olive oil",
        "Lemon juice",
        "Salt and pepper",
      ],
      preparation_steps: [
        "Season chicken breasts with salt, pepper, and olive oil",
        "Grill chicken for 6-7 minutes per side until fully cooked",
        "Let chicken rest for 5 minutes, then slice into strips",
        "In a large bowl, combine salad greens, cucumber, tomatoes, and red onion",
        "Top with sliced chicken",
        "Drizzle with olive oil and lemon juice",
        "Toss gently and serve immediately",
      ],
      source: "manual",
      created_at: "2024-10-05T14:30:00Z",
      updated_at: "2024-10-05T14:30:00Z",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      user_id: DEFAULT_USER_ID,
      title: "Vegetable Stir Fry",
      ingredients: [
        "2 cups broccoli florets",
        "1 red bell pepper, sliced",
        "1 yellow bell pepper, sliced",
        "1 cup snap peas",
        "2 carrots, julienned",
        "3 tablespoons soy sauce",
        "2 tablespoons sesame oil",
        "2 cloves garlic, minced",
        "1 tablespoon ginger, minced",
        "Sesame seeds for garnish",
      ],
      preparation_steps: [
        "Heat sesame oil in a large wok or skillet over high heat",
        "Add garlic and ginger, stir fry for 30 seconds until fragrant",
        "Add carrots and broccoli, stir fry for 3 minutes",
        "Add bell peppers and snap peas, continue stir frying for 2-3 minutes",
        "Pour in soy sauce and toss everything together",
        "Cook for another minute until vegetables are tender-crisp",
        "Garnish with sesame seeds and serve hot over rice",
      ],
      source: "ai",
      created_at: "2024-10-08T09:15:00Z",
      updated_at: "2024-10-08T09:15:00Z",
    },
  ];

  private static mockRecipeCounter = 4; // For generating new IDs

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supabase: SupabaseClient
  ): Promise<GenerateRecipeResponseDTO> {
    try {
      // Sanitize ingredients before sending to AI
      const sanitizedIngredients = this.aiService.sanitizeIngredients(ingredients);

      // Generate recipe using AI service
      const recipe = await this.aiService.generateRecipe(sanitizedIngredients);

      // ========== MOCK DATA - Comment out when Supabase is ready ==========
      // For now, return no warnings since we don't have profile data
      const warnings: IngredientWarning[] = [];

      return {
        recipe,
        warnings,
      };
      // ========== END MOCK DATA ==========

      /* ========== SUPABASE IMPLEMENTATION (Commented out for now) ==========
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
      ========== END SUPABASE IMPLEMENTATION ========== */
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
  async createRecipe(
    command: CreateRecipeCommand,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supabase: SupabaseClient
  ): Promise<RecipeDTO> {
    try {
      // ========== MOCK DATA - Comment out when Supabase is ready ==========
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newRecipe: RecipeDTO = {
        id: `550e8400-e29b-41d4-a716-44665544000${RecipeService.mockRecipeCounter}`,
        user_id: userId,
        title: command.title,
        ingredients: command.ingredients,
        preparation_steps: command.preparation_steps,
        source: command.source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      RecipeService.MOCK_RECIPES.push(newRecipe);
      RecipeService.mockRecipeCounter++;

      return newRecipe;
      // ========== END MOCK DATA ==========

      /* ========== SUPABASE IMPLEMENTATION (Commented out for now) ==========
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
      ========== END SUPABASE IMPLEMENTATION ========== */
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supabase: SupabaseClient
  ): Promise<RecipeListResponseDTO> {
    try {
      // ========== MOCK DATA - Comment out when Supabase is ready ==========
      const { page = 1, limit = 20, sort = "created_at", order = "desc", source } = params;

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Filter by user and source
      let filteredRecipes = RecipeService.MOCK_RECIPES.filter((recipe) => recipe.user_id === userId);

      if (source) {
        filteredRecipes = filteredRecipes.filter((recipe) => recipe.source === source);
      }

      // Sort recipes
      filteredRecipes.sort((a, b) => {
        const aValue = a[sort as keyof RecipeDTO];
        const bValue = b[sort as keyof RecipeDTO];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });

      // Paginate
      const offset = (page - 1) * limit;
      const paginatedRecipes = filteredRecipes.slice(offset, offset + limit);

      const totalItems = filteredRecipes.length;
      const totalPages = Math.ceil(totalItems / limit);

      const pagination: PaginationDTO = {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      };

      return {
        recipes: paginatedRecipes,
        pagination,
      };
      // ========== END MOCK DATA ==========

      /* ========== SUPABASE IMPLEMENTATION (Commented out for now) ==========
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
      ========== END SUPABASE IMPLEMENTATION ========== */
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
  async getRecipeById(
    id: string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supabase: SupabaseClient
  ): Promise<RecipeDTO | null> {
    try {
      // ========== MOCK DATA - Comment out when Supabase is ready ==========
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recipe = RecipeService.MOCK_RECIPES.find((r) => r.id === id && r.user_id === userId);

      return recipe || null;
      // ========== END MOCK DATA ==========

      /* ========== SUPABASE IMPLEMENTATION (Commented out for now) ==========
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
      ========== END SUPABASE IMPLEMENTATION ========== */
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supabase: SupabaseClient
  ): Promise<RecipeDTO | null> {
    try {
      // ========== MOCK DATA - Comment out when Supabase is ready ==========
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      const recipeIndex = RecipeService.MOCK_RECIPES.findIndex((r) => r.id === id && r.user_id === userId);

      if (recipeIndex === -1) {
        return null;
      }

      // Update the recipe with provided fields
      const updatedRecipe = {
        ...RecipeService.MOCK_RECIPES[recipeIndex],
        ...(command.title !== undefined && { title: command.title }),
        ...(command.ingredients !== undefined && { ingredients: command.ingredients }),
        ...(command.preparation_steps !== undefined && { preparation_steps: command.preparation_steps }),
        updated_at: new Date().toISOString(),
      };

      RecipeService.MOCK_RECIPES[recipeIndex] = updatedRecipe;

      return updatedRecipe;
      // ========== END MOCK DATA ==========

      /* ========== SUPABASE IMPLEMENTATION (Commented out for now) ==========
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
      ========== END SUPABASE IMPLEMENTATION ========== */
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
  async deleteRecipe(
    id: string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supabase: SupabaseClient
  ): Promise<boolean> {
    try {
      // ========== MOCK DATA - Comment out when Supabase is ready ==========
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recipeIndex = RecipeService.MOCK_RECIPES.findIndex((r) => r.id === id && r.user_id === userId);

      if (recipeIndex === -1) {
        return false;
      }

      RecipeService.MOCK_RECIPES.splice(recipeIndex, 1);
      return true;
      // ========== END MOCK DATA ==========

      /* ========== SUPABASE IMPLEMENTATION (Commented out for now) ==========
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
      ========== END SUPABASE IMPLEMENTATION ========== */
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
