import { sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

/** Exact, case-insensitive equality. Never uses LIKE, so '_' and '%' are literal. */
export function equalsIgnoreCase(column: AnyColumn, value: string): SQL {
  return sql`lower(${column}) = lower(${value})`;
}

/** Escape LIKE/ILIKE metacharacters (backslash, percent, underscore) in user input. */
export function escapeLikeLiteral(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Contains-style ILIKE pattern with user input treated literally. */
export function containsLikePattern(value: string): string {
  return `%${escapeLikeLiteral(value)}%`;
}
