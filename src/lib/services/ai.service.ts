import type { GeneratedRecipeDTO } from "../../types";

/**
 * AI Service for recipe generation
 * Currently returns mock data for development
 * Will be integrated with OpenRouter API in production
 */
export class AIService {
  // Mock data for development
  private static readonly MOCK_RECIPES: Record<string, GeneratedRecipeDTO> = {
    default: {
      title: "Delicious Mixed Recipe",
      ingredients: [
        "2 cups main ingredient",
        "1 cup secondary ingredient",
        "3 tablespoons seasoning",
        "Salt and pepper to taste",
      ],
      preparation_steps: [
        "Prepare all ingredients by washing and chopping as needed",
        "Heat a large pan over medium heat",
        "Add the main ingredients and cook for 5-7 minutes",
        "Add secondary ingredients and seasonings",
        "Cook until everything is well combined and heated through",
        "Season with salt and pepper to taste",
        "Serve hot and enjoy!",
      ],
    },
    chicken_rice: {
      title: "Garlic Chicken with Broccoli Rice",
      ingredients: [
        "2 chicken breasts, diced",
        "2 cups cooked rice",
        "1 cup broccoli florets",
        "3 cloves garlic, minced",
        "2 tablespoons olive oil",
        "Salt and pepper to taste",
      ],
      preparation_steps: [
        "Heat olive oil in a large pan over medium heat",
        "Add minced garlic and cook until fragrant (about 1 minute)",
        "Add diced chicken and cook until golden brown (8-10 minutes)",
        "Add broccoli florets and cook for 5 minutes until tender",
        "Mix in cooked rice and stir well to combine",
        "Season with salt and pepper to taste",
        "Serve hot and garnish with fresh herbs if desired",
      ],
    },
    pasta: {
      title: "Creamy Tomato Pasta",
      ingredients: [
        "500g pasta of choice",
        "2 cups tomato sauce",
        "1 cup heavy cream",
        "3 cloves garlic, minced",
        "Fresh basil leaves",
        "Parmesan cheese for serving",
      ],
      preparation_steps: [
        "Boil pasta according to package instructions until al dente",
        "While pasta cooks, sauté garlic in a large pan",
        "Add tomato sauce and simmer for 5 minutes",
        "Stir in heavy cream and cook for 2-3 minutes",
        "Drain pasta and add to the sauce",
        "Toss everything together until well coated",
        "Serve with fresh basil and parmesan cheese",
      ],
    },
  };

  /**
   * Generates a recipe using AI based on provided ingredients
   *
   * @param ingredients - Array of ingredients to use in the recipe
   * @returns Generated recipe with title, ingredients, and preparation steps
   *
   * @example
   * const aiService = new AIService();
   * const recipe = await aiService.generateRecipe(['chicken', 'rice', 'broccoli']);
   */
  async generateRecipe(ingredients: string[]): Promise<GeneratedRecipeDTO> {
    // TODO: Integrate with OpenRouter API
    // For now, return mock data based on ingredients

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Select mock recipe based on ingredients
      const ingredientString = ingredients.join(" ").toLowerCase();

      if (ingredientString.includes("chicken") && ingredientString.includes("rice")) {
        return AIService.MOCK_RECIPES.chicken_rice;
      } else if (ingredientString.includes("pasta")) {
        return AIService.MOCK_RECIPES.pasta;
      }

      // Return default mock recipe with dynamic title
      return {
        ...AIService.MOCK_RECIPES.default,
        title: `Delicious ${ingredients[0]} Recipe`,
      };

      /*
      // FUTURE IMPLEMENTATION with OpenRouter API:
      const apiKey = import.meta.env.OPENROUTER_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      const prompt = `You are a professional chef. Generate a recipe using ONLY the following ingredients: ${ingredients.join(', ')}.

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
- Return ONLY the JSON object, no additional text`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4',
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const recipeText = data.choices[0].message.content;
      const recipe = JSON.parse(recipeText);

      return recipe as GeneratedRecipeDTO;
      */
    } catch (error) {
      // Error logging for debugging
      // In production, consider using a proper logging service
      if (error instanceof Error) {
        // Log error for debugging in development
      }

      throw new Error("Failed to generate recipe. Please try again later.");
    }
  }

  /**
   * Sanitizes ingredients to prevent prompt injection
   * Removes special characters and limits length
   *
   * @param ingredients - Raw ingredients from user input
   * @returns Sanitized ingredients safe for AI prompts
   */
  sanitizeIngredients(ingredients: string[]): string[] {
    return ingredients.map(
      (ingredient) =>
        ingredient
          .trim()
          .slice(0, 100) // Limit to 100 characters
          .replace(/[^\w\s,.-]/g, "") // Remove special characters except basic punctuation
    );
  }
}
