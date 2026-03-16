import { z } from "zod";

/**
 * Validates that a value is a well-formed UUID string.
 * Prevents raw string IDs from being passed directly to Prisma
 * without any sanitization, which could cause unexpected behavior
 * if IDs are ever non-UUID format.
 */
export function validateId(id: unknown): string {
  return z.string().uuid("Invalid resource ID format").parse(id);
}
