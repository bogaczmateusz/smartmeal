import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ErrorResponseDTO } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a standardized error response
 *
 * @param status - HTTP status code
 * @param error - Error type/category
 * @param message - User-friendly error message
 * @param details - Optional detailed error information
 * @returns Response object with error data
 *
 * @example
 * return createErrorResponse(400, "Validation failed", "Invalid input data", { field: "error" });
 */
export function createErrorResponse(
  status: number,
  error: string,
  message: string,
  details?: string | Record<string, string>
): Response {
  const body: ErrorResponseDTO = { error, message };
  if (details) {
    body.details = details;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
