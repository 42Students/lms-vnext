import { z } from "zod";

/**
 * Shared building blocks for request validation, so an id, a page number or an email means the same thing in every route.
 * Add a primitive here before writing a second inline copy of it.
 */

/** A canonical UUID (any version), as every table id in the database is stored. */
export const zUuid = z.string().uuid();
