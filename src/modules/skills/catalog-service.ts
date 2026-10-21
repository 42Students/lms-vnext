import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import { canReadSkillCatalog } from "./catalog-access";
import { getDb } from "@/db/client";
import {
  db10Skills,
  db10SkillSynonyms,
  db10SkillUsage,
} from "@/db/schema/db10-skills-catalog.draft";
export { canReadSkillCatalog } from "./catalog-access";
import {
  normalizeSkillSearchQuery,
  type SkillCatalogQuery,
} from "./catalog-validation";

/** Legacy SkillsCache shortcuts, always available even before synonym seeds.
 * Persisted tenant-approved synonyms still participate in ranking. */
const LEGACY_SKILL_ALIASES: Readonly<Record<string,string>> = {
 js:"javascript",ts:"typescript",py:"python",rb:"ruby",cpp:"c++",
 csharp:"c#",golang:"go",rn:"react native",ng:"angular",node:"node.js",
 k8s:"kubernetes",aws:"amazon web services",gcp:"google cloud",az:"azure",
 ml:"machine learning",ai:"artificial intelligence",dl:"deep learning",
 nlp:"natural language processing",ds:"data science",db:"database",
 fe:"frontend",be:"backend",ui:"user interface",ux:"user experience",
 qa:"quality assurance",pm:"project management",
 html5:"html",css3:"css",scss:"sass",sass:"scss",jsx:"react",tsx:"typescript",
 reactjs:"react",reactnative:"react native",nextjs:"next.js",next:"next.js",
 vuejs:"vue.js",angularjs:"angular",nodejs:"node.js",expressjs:"express",
 nestjs:"nestjs",postgres:"postgresql",pgsql:"postgresql",pg:"postgresql",
 mysql:"mysql",mongo:"mongodb",nosql:"nosql",redisdb:"redis",oracle:"oracle database",
 dotnet:".net",aspnet:"asp.net",cplus:"c++",cplusplus:"c++",csharpnet:"c#",
 springboot:"spring boot",spring:"spring framework",hibernate:"hibernate",
 microservices:"microservices",restapi:"rest api",graphql:"graphql",grpc:"grpc",
 devops:"devops",cicd:"ci/cd",terraform:"terraform",tf:"tensorflow",
 pytorch:"pytorch",sklearn:"scikit-learn",opencv:"opencv",pandas:"pandas",
 numpy:"numpy",llm:"large language models",genai:"generative ai",
 nlu:"natural language understanding",cv:"computer vision",
 oops:"object oriented programming",oop:"object oriented programming",
 dsa:"data structures and algorithms",algo:"algorithms",
 uxui:"user experience",figma:"figma",agile:"agile",scrum:"scrum",
 powerbi:"power bi",excel:"microsoft excel",gdocs:"google docs",

};

/** Bounded Levenshtein fallback: return 3 when the distance exceeds 2.
 * Never allocate a dynamic-programming grid for unbounded DB strings. */
function editDistanceAtMostTwo(first:string,second:string):number {
 const a=first.toLocaleLowerCase("en"), b=second.toLocaleLowerCase("en");
 if(a.length>128||b.length>128||Math.abs(a.length-b.length)>2)return 3;
 let previous=Array.from({length:b.length+1},(_,index)=>index);
 for(let i=1;i<=a.length;i++){
  const current=Array<number>(b.length+1).fill(0);
  current[0]=i;
  let rowMin=current[0];
  for(let j=1;j<=b.length;j++){
   current[j]=Math.min(previous[j]+1,current[j-1]+1,
    previous[j-1]+(a[i-1]===b[j-1]?0:1));
   rowMin=Math.min(rowMin,current[j]);
  }
  if(rowMin>2)return 3;
  previous=current;
 }
 return Math.min(3,previous[b.length]??3);
}

/** A missing synonym relation during partial DB10 rollout is recoverable;
 * ordinary database errors must still propagate to the caller. */
function synonymTableNotInstalled(error: unknown) {
  let current: unknown = error;
  for (let depth=0;depth<5;depth++) {
    if (!current || typeof current !== "object") break;
    if ("code" in current && current.code === "42P01") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

const columns = {
  id: db10Skills.id,
  legacySkillId: db10Skills.legacySkillId,
  name: db10Skills.name,
  displayName: db10Skills.displayName,
  category: db10Skills.category,
  usageCount: db10Skills.usageCount,
  isPopular: sql<boolean>`${db10Skills.usageCount} > 100`.mapWith(Boolean),
};

/**
 * Preserves legacy v1's exact/prefix/display/contains tier ordering and
 * popularity/priority boosts while also consulting *persisted* synonym rows.
 * Bounded typo search and legacy shortcuts are restored here. The catalog
 * import/migration remains guarded by readiness. The name-keyed last_used
 * tracking table handles recent/popularity ranking without a separate volatile
 * cache; the bounded fallback intentionally avoids extension requirements.
 */
async function readSkillCatalogUncached(input: SkillCatalogQuery) {
  const db = getDb();
  const base = eq(db10Skills.isActive, true);
  if (input.mode === "categories") {
    const categories = await db.selectDistinct({ category: db10Skills.category })
      .from(db10Skills)
      .where(and(base, sql`${db10Skills.category} is not null`))
      .orderBy(asc(db10Skills.category));
    return { categories: categories.flatMap(row => row.category ? [row.category] : [])
        .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"})),
      message: "Categories retrieved" };
  }

  if (input.mode === "category") {
    const items = await db.select(columns).from(db10Skills)
      .where(and(base, sql<boolean>`lower(${db10Skills.category})=lower(${input.category!})`))
      .orderBy(asc(db10Skills.displayName), asc(db10Skills.id))
      .limit(input.limit);
    return { items };
  }

  const q = normalizeSkillSearchQuery(input.query);
  if (input.mode === "popular" || !q) {
    const fallbackOrder = [
      "java","python","javascript","react","node.js","typescript",
      "sql","html","css","spring boot","angular","aws","docker","git",
    ];
    // Legacy SkillsCache included a fixed fallback after tracked selections,
    // then filled remaining places alphabetically. The two counters remain
    // independent and scoped to this catalog; no full-table cache is required.
    const fallbackPosition = sql<number>`case lower(${db10Skills.name})
      ${sql.join(fallbackOrder.map((name,index)=>sql`when ${name} then ${index}`),sql` `)}
      else 1000 end`;
    // Both legacy usage systems stay independent in storage; the separate
    // skill_usage table's popularity is the v2 primary signal. Catalog count
    // is a tie-breaker/fallback. Never increment one because the other moved.
    const items = await db.select(columns)
      .from(db10Skills)
      .leftJoin(
        db10SkillUsage,
        sql`${db10SkillUsage.skillName} = lower(${db10Skills.name})`,
      )
      .where(base)
      .orderBy(
        desc(sql`coalesce(${db10SkillUsage.usageCount}, 0)`),
        desc(db10Skills.usageCount),
        asc(fallbackPosition),
        asc(db10Skills.displayName),
        asc(db10Skills.id),
      )
      .limit(input.limit);
    return { items, message:"Popular skills retrieved" };
  }

  const searchTerm=LEGACY_SKILL_ALIASES[q]??q;
  const normalized = sql`lower(${db10Skills.name})`;
  const display = sql`lower(${db10Skills.displayName})`;
  const namePrefix = sql<boolean>`left(${normalized}, length(${searchTerm})) = ${searchTerm}`;
  const displayPrefix = sql<boolean>`left(${display}, length(${searchTerm})) = ${searchTerm}`;
  const nameWordPrefix = sql<boolean>`position(' ' || ${searchTerm} in ${normalized}) > 0`;
  const nameContains = sql<boolean>`position(${searchTerm} in ${normalized}) > 0`;
  const displayContains = sql<boolean>`position(${searchTerm} in ${display}) > 0`;
  const synonymPrefix = sql<boolean>`exists (
    select 1 from ${db10SkillSynonyms} synonym
    where synonym.skill_id = ${db10Skills.id}
      and left(lower(synonym.synonym), length(${searchTerm})) = ${searchTerm}
  )`;
  const synonymContains = sql<boolean>`exists (
    select 1 from ${db10SkillSynonyms} synonym
    where synonym.skill_id = ${db10Skills.id}
      and position(${searchTerm} in lower(synonym.synonym)) > 0
  )`;
  const score = sql<number>`(
    case
      when ${normalized} = ${searchTerm} then 100
      when ${display} = ${searchTerm} then 95
      when ${namePrefix} then 80
      when ${displayPrefix} then 75
      when ${nameWordPrefix} then 60
      when ${synonymPrefix} then 55
      when ${nameContains} then 40
      when ${displayContains} then 35
      when ${synonymContains} then 30
      else 20 end
    + least(floor(${db10Skills.usageCount} / 10.0), 50)
    + ${db10Skills.searchPriority}
  )`;

  async function selectDirectSkills() {
    const directScore = sql<number>`(case
      when ${normalized}=${searchTerm} then 100
      when ${display}=${searchTerm} then 95
      when ${namePrefix} then 80
      when ${displayPrefix} then 75
      when ${nameWordPrefix} then 60
      when ${nameContains} then 40
      when ${displayContains} then 35 else 0 end)
      + least(floor(${db10Skills.usageCount}/10.0),50) + ${db10Skills.searchPriority}`;
    return db.select(columns).from(db10Skills).where(and(
      base,
      sql<boolean>`(${namePrefix} or ${displayPrefix} or ${nameContains} or ${displayContains})`,
    )).orderBy(desc(directScore),asc(sql`length(${db10Skills.name})`),
      asc(db10Skills.displayName),asc(db10Skills.id)).limit(input.limit);
  }
  let items: Awaited<ReturnType<typeof selectDirectSkills>>;
  try {
    items = await db.select(columns).from(db10Skills)
    .where(and(
      base,
      sql<boolean>`(
        ${namePrefix} or ${displayPrefix} or ${nameWordPrefix} or
        ${nameContains} or ${displayContains} or
        ${synonymPrefix} or ${synonymContains}
      )`,
    ))
    .orderBy(
      desc(score),
      asc(sql`length(${db10Skills.name})`),
      asc(db10Skills.displayName),
      asc(db10Skills.id),
    )
    .limit(input.limit);

  } catch (error) {
    if (!synonymTableNotInstalled(error)) throw error;
    // Keep the primary name/display lookup available before alias backfill.
    items = await selectDirectSkills();
  }
  if (q.length < 3 || items.length >= Math.min(5,input.limit)) return { items };
  // Tolerate a misspelled FIRST character and single missing letters too:
  // requiring the same first letter made "pyhton" recoverable but not
  // "y Python" / "avascript". Keep a bounded, deterministic candidate
  // sample; the DB does not require a pg_trgm extension.
  const first=q.slice(0,1);
  const stem=q.slice(1,Math.min(4,q.length));
  const candidates=await db.select(columns).from(db10Skills)
    .where(and(base,sql<boolean>`(
      abs(length(lower(${db10Skills.name}))-${q.length})<=2 or
      abs(length(lower(${db10Skills.displayName}))-${q.length})<=2
    ) and (
      left(lower(${db10Skills.name}),1)=${first} or
      left(lower(${db10Skills.displayName}),1)=${first} or
      position(${stem} in lower(${db10Skills.name}))>0 or
      position(${stem} in lower(${db10Skills.displayName}))>0
    )`))
    .orderBy(desc(db10Skills.searchPriority),desc(db10Skills.usageCount),
      asc(db10Skills.displayName),asc(db10Skills.id))
    .limit(1200);
  const used=new Set(items.map(item=>item.id));
  const fuzzy=candidates.flatMap(row=>{
    if(used.has(row.id))return [];
    const distance=Math.min(editDistanceAtMostTwo(q,row.name),
      editDistanceAtMostTwo(q,row.displayName));
    return distance<=2?[{row,distance}]:[];
  }).sort((a,b)=>a.distance-b.distance||
    a.row.displayName.localeCompare(b.row.displayName)||
    a.row.id.localeCompare(b.row.id));
  return { items:[...items,...fuzzy.slice(0,Math.max(0,input.limit-items.length)).map(match=>match.row)] };
}

/** Twenty-second process-local query coalescing avoids repeated DB scans during
 * fast autocomplete. A bounded cache and a short TTL mean new/renamed skill
 * records do not require a privileged remote refresh to become visible.
 * Authorization remains in the request route, before reading this catalog. */
const catalogQueryCache = new Map<string, {
  expiresAt: number;
  result: ReturnType<typeof readSkillCatalogUncached>;
}>();
const MAX_CACHED_SEARCHES = 256;
const CATALOG_TTL_MS = 20_000;

export async function readSkillCatalog(input: SkillCatalogQuery) {
  const key = JSON.stringify([input.mode, input.query.toLocaleLowerCase("en-US"),
    input.category ?? "", input.limit]);
  const now = Date.now();
  const cached = catalogQueryCache.get(key);
  if (cached && cached.expiresAt > now) return cached.result;
  catalogQueryCache.delete(key);
  if (catalogQueryCache.size >= MAX_CACHED_SEARCHES) {
    for (const [key,entry] of catalogQueryCache) {
      if (entry.expiresAt < now) catalogQueryCache.delete(key);
    }
    if (catalogQueryCache.size >= MAX_CACHED_SEARCHES)
      catalogQueryCache.delete(catalogQueryCache.keys().next().value!);
  }
  const result = readSkillCatalogUncached(input);
  catalogQueryCache.set(key, {expiresAt:now+CATALOG_TTL_MS,result});
  try { return await result; }
  catch (error) { catalogQueryCache.delete(key); throw error; }
}

/** Bounded invalidation hook for a future skill catalog mutation/import route.
 * It is not an unguarded HTTP endpoint. */
export function invalidateSkillCatalogSearchCache() {
  catalogQueryCache.clear();
}

/** Alias management read, not a mutation: the importer can inspect one
 * parent skill and check an exact synonym before attempting a deduplicated
 * write. Distinct canonical IDs remain authoritative across duplicate aliases. */
function requireCatalogReader(context: RequestContext) {
  if (!canReadSkillCatalog(context)) throw new Error("FORBIDDEN_SKILL_CATALOG");
}

export async function listSkillSynonymsForParent(context: RequestContext, skillId: unknown) {
  requireCatalogReader(context);
  const id = z.string().uuid().parse(skillId);
  const [parent] = await getDb().select({ id: db10Skills.id })
    .from(db10Skills).where(and(eq(db10Skills.id,id),eq(db10Skills.isActive,true))).limit(1);
  if (!parent) return null;
  return getDb().select({
    id:db10SkillSynonyms.id,
    legacySynonymId:db10SkillSynonyms.legacySynonymId,
    synonym:db10SkillSynonyms.synonym,
    skillId:db10SkillSynonyms.skillId,
  }).from(db10SkillSynonyms).where(eq(db10SkillSynonyms.skillId,id))
    .orderBy(asc(sql`lower(${db10SkillSynonyms.synonym})`),asc(db10SkillSynonyms.id))
    .limit(200);
}

export async function searchSkillsByExactSynonym(context: RequestContext, raw: unknown) {
  requireCatalogReader(context);
  const synonym = z.string().trim().min(1).max(100).parse(raw).toLocaleLowerCase("en-US");
  return getDb().selectDistinct(columns).from(db10Skills)
    .innerJoin(db10SkillSynonyms,eq(db10SkillSynonyms.skillId,db10Skills.id))
    .where(and(eq(db10Skills.isActive,true),
      sql<boolean>`lower(${db10SkillSynonyms.synonym})=${synonym}`))
    .orderBy(desc(db10Skills.usageCount),asc(db10Skills.displayName),asc(db10Skills.id))
    .limit(200);
}

export async function skillSynonymExists(context: RequestContext, raw: unknown) {
  requireCatalogReader(context);
  const synonym = z.string().trim().min(1).max(100).parse(raw).toLocaleLowerCase("en-US");
  const [record] = await getDb().select({id:db10SkillSynonyms.id})
    .from(db10SkillSynonyms)
    .where(sql<boolean>`lower(${db10SkillSynonyms.synonym})=${synonym}`).limit(1);
  return Boolean(record);
}

/** Explicit v1/v2 usage events stay independent. The current user must have
 * catalog access; HTTP callers separately enforce same-origin mutations.
 * Synchronous awaited SQL writes avoid silently dropping events on worker exit.
 * No user identifier is stored in either legacy counter. */
export async function recordSkillSelection(
  context: RequestContext,
  raw: {name:string;source:"v1"|"v2";skillId?:string},
) {
  requireCatalogReader(context);
  const data=z.object({
    name:z.string().trim().min(1).max(200),
    source:z.enum(["v1","v2"]),
    skillId:z.string().uuid().optional(),
  }).strict().parse(raw);
  const name=data.name.toLocaleLowerCase("en-US");
  if(data.source==="v1"){
    if(!data.skillId)throw new Error("CANONICAL_SKILL_REQUIRED");
    const updated=await getDb().update(db10Skills).set({
      usageCount:sql`${db10Skills.usageCount}+1`,
    }).where(and(eq(db10Skills.id,data.skillId),eq(db10Skills.isActive,true)))
      .returning({id:db10Skills.id});
    if(!updated.length)throw new Error("SKILL_NOT_FOUND");
  }else{
    await getDb().insert(db10SkillUsage).values({
      skillName:name,usageCount:1,
    }).onConflictDoUpdate({
      target:db10SkillUsage.skillName,
      set:{usageCount:sql`${db10SkillUsage.usageCount}+1`,lastUsed:sql`now()`},
    });
  }
  invalidateSkillCatalogSearchCache();
}
