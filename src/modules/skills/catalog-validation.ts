import { z } from "zod";

export const skillCatalogQuerySchema = z.object({
  mode: z.enum(["search", "popular", "categories", "category"]).default("search"),
  query: z.string().trim().max(80).default(""),
  category: z.string().trim().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(15),
}).strict().superRefine((value, ctx) => {
  if (value.mode === "category" && !value.category) {
    ctx.addIssue({ code: "custom", path: ["category"], message: "Category is required" });
  }
});

export type SkillCatalogQuery = z.infer<typeof skillCatalogQuerySchema>;

/** The only URL surface; unknown parameters cannot select a tenant or an actor. */
export function parseSkillCatalogQuery(params: URLSearchParams): SkillCatalogQuery {
  return skillCatalogQuerySchema.parse({
    mode: params.get("mode") ?? undefined,
    query: params.get("query") ?? undefined,
    category: params.get("category") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });
}

/** Literal case-insensitive substring matching, never untrusted SQL LIKE globs. */
export function normalizeSkillSearchQuery(query: string) {
  return query.trim().toLocaleLowerCase("en-US");
}
