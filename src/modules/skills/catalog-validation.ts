import { z } from "zod";

export const skillCatalogQuerySchema = z.object({
  mode: z.enum(["search", "popular", "categories", "category"]).default("search"),
  query: z.string().trim().max(80).default(""),
  category: z.string().trim().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.mode === "category" && !value.category) {
    ctx.addIssue({ code: "custom", path: ["category"], message: "Category is required" });
  }
}).transform(value=>({
  ...value,
  // Legacy search=15, popular=10, category=50. Explicit callers retain
  // any validated 1..50 limit; no silent truncation of invalid inputs.
  limit: value.limit ?? (value.mode==="popular"?10:value.mode==="category"?50:15),
}));

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

/** Resolve a legacy /search, /popular, /categories, /category/{name}
 * URL without allowing an arbitrary route or actor/college input through
 * the query parser. The request handler still must enforce authentication. */
export function parseLegacySkillCatalogQuery(pathname:string,params:URLSearchParams):SkillCatalogQuery {
  const segments=pathname.split("/").filter(Boolean);
  const categoryIndex=segments.lastIndexOf("category");
  const last=segments[segments.length-1];
  const mode=categoryIndex>=0&&categoryIndex===segments.length-2?"category":
    last==="search"?"search":last==="popular"?"popular":
    last==="categories"?"categories":null;
  if(!mode)throw new Error("UNKNOWN_SKILL_CATALOG_ROUTE");
  const target=new URLSearchParams();
  target.set("mode",mode);
  if(mode==="category"){
    let category:string;
    try{category=decodeURIComponent(segments[segments.length-1]!);}
    catch{throw new Error("INVALID_SKILL_CATEGORY");}
    target.set("category",category);
  }
  if(params.has("query"))target.set("query",params.get("query")??"");
  if(params.has("limit"))target.set("limit",params.get("limit")??"");
  return parseSkillCatalogQuery(target);
}

/** Literal Unicode-safe substring matching, never untrusted SQL LIKE globs.
 * NFKC folding brings common full-width spellings and combined glyphs closer
 * to the historical JVM case-insensitive search; db lower() remains canonical. */
export function normalizeSkillSearchQuery(query: string) {
  return query.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}
