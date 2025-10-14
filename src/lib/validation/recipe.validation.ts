import { z } from "zod";

/**
 * Validation schema for generating AI recipe
 * Requires at least 3 ingredients to generate a meaningful recipe
 */
export const generateRecipeSchema = z.object({
  ingredients: z
    .array(z.string().trim().min(1, "Ingredient cannot be empty"))
    .min(3, "At least 3 ingredients are required to generate a recipe"),
});

/**
 * Validation schema for creating a new recipe
 * Includes title, ingredients, preparation steps, and source (ai or manual)
 */
export const createRecipeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
  ingredients: z
    .array(z.string().trim().min(1, "Ingredient cannot be empty"))
    .min(1, "At least one ingredient is required"),
  preparation_steps: z
    .array(z.string().trim().min(1, "Preparation step cannot be empty"))
    .min(1, "At least one preparation step is required"),
  source: z.enum(["ai", "manual"], {
    errorMap: () => ({ message: "Source must be either 'ai' or 'manual'" }),
  }),
});

/**
 * Validation schema for updating an existing recipe
 * All fields are optional but at least one must be provided
 */
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

/**
 * Validation schema for recipe query parameters
 * Supports pagination, sorting, filtering by source
 */
export const recipeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  source: z.enum(["ai", "manual"]).optional(),
});

/**
 * Validation schema for UUID parameters
 * Ensures recipe IDs are valid UUIDs
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid recipe ID format"),
});
