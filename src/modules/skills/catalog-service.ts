import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
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

const columns = {
  id: db10Skills.id,
  name: db10Skills.name,
  displayName: db10Skills.displayName,
  category: db10Skills.category,
};

/**
 * Preserves legacy v1's exact/prefix/display/contains tier ordering and
 * popularity/priority boosts while also consulting *persisted* synonym rows.
 * Bounded typo search and legacy shortcuts are restored here. The catalog
 * import/migration, global fuzzy index, and ephemeral recent-skills cache remain
 * separately tracked; this service cannot promise unbounded full-catalog parity.
 */
export async function readSkillCatalog(input: SkillCatalogQuery) {
  const db = getDb();
  const base = eq(db10Skills.isActive, true);
  if (input.mode === "categories") {
    const categories = await db.selectDistinct({ category: db10Skills.category })
      .from(db10Skills)
      .where(and(base, sql`${db10Skills.category} is not null`))
      .orderBy(asc(db10Skills.category));
    return { categories: categories.flatMap(row => row.category ? [row.category] : []),
      message: "Categories retrieved successfully" };
  }

  if (input.mode === "category") {
    const items = await db.select(columns).from(db10Skills)
      .where(and(base, eq(db10Skills.category, input.category!)))
      .orderBy(asc(db10Skills.displayName), asc(db10Skills.id))
      .limit(input.limit);
    return { items };
  }

  const q = normalizeSkillSearchQuery(input.query);
  if (input.mode === "popular" || !q) {
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
        asc(db10Skills.displayName),
        asc(db10Skills.id),
      )
      .limit(input.limit);
    return { items, message:"Popular skills retrieved successfully" };
  }

  const searchTerm=LEGACY_SKILL_ALIASES[q]??q;
  const normalized = sql`lower(${db10Skills.name})`;
  const display = sql`lower(${db10Skills.displayName})`;
  const namePrefix = sql<boolean>`left(${normalized}, length(${searchTerm})) = ${searchTerm}`;
  const displayPrefix = sql<boolean>`left(${display}, length(${searchTerm})) = ${searchTerm}`;
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
      when ${namePrefix} then 80
      when ${displayPrefix} then 70
      when ${synonymPrefix} then 60
      when ${nameContains} then 40
      when ${displayContains} then 30
      else 20 end
    + least(floor(${db10Skills.usageCount} / 10.0), 50)
    + ${db10Skills.searchPriority}
  )`;

  const items = await db.select(columns).from(db10Skills)
    .where(and(
      base,
      sql<boolean>`(
        ${namePrefix} or ${displayPrefix} or
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
  if (q.length < 3 || items.length >= Math.min(5,input.limit)) return { items };
  // Legacy typo search happens only if fewer than five direct/prefix results.
  // Bound SQL candidates and in-memory edit distance; no unindexed table-wide
  // Levenshtein call or unrestricted scan is introduced.
  const first=q.slice(0,1);
  const candidates=await db.select(columns).from(db10Skills)
    .where(and(base,sql<boolean>`(
      left(lower(${db10Skills.name}),1)=${first} or
      left(lower(${db10Skills.displayName}),1)=${first}
    )`))
    .orderBy(desc(db10Skills.usageCount),asc(db10Skills.displayName),asc(db10Skills.id))
    .limit(250);
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
