import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  db10Skills,
  db10SkillSynonyms,
  db10SkillUsage,
} from "@/db/schema/db10-skills-catalog.draft";
import {
  hasActiveMembership,
  hasActiveRecruiter,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import {
  normalizeSkillSearchQuery,
  type SkillCatalogQuery,
} from "./catalog-validation";

/** The shared catalog may serve authenticated active college and recruiter users. */
export function canReadSkillCatalog(context: RequestContext) {
  return context.user.platformStatus === "ACTIVE" &&
    (hasActiveMembership(context) ||
      hasActiveRecruiter(context) ||
      isSuperAdmin(context));
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
 * v2's full fuzzy Levenshtein search and ephemeral recent-skills cache are
 * separate, explicitly unresolved consumer parity; no false 100% claim.
 */
export async function readSkillCatalog(input: SkillCatalogQuery) {
  const db = getDb();
  const base = eq(db10Skills.isActive, true);
  if (input.mode === "categories") {
    const categories = await db.selectDistinct({ category: db10Skills.category })
      .from(db10Skills)
      .where(and(base, sql`${db10Skills.category} is not null`))
      .orderBy(asc(db10Skills.category));
    return { categories: categories.flatMap(row => row.category ? [row.category] : []) };
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
    return { items };
  }

  const normalized = sql`lower(${db10Skills.name})`;
  const display = sql`lower(${db10Skills.displayName})`;
  const namePrefix = sql<boolean>`left(${normalized}, length(${q})) = ${q}`;
  const displayPrefix = sql<boolean>`left(${display}, length(${q})) = ${q}`;
  const nameContains = sql<boolean>`position(${q} in ${normalized}) > 0`;
  const displayContains = sql<boolean>`position(${q} in ${display}) > 0`;
  const synonymPrefix = sql<boolean>`exists (
    select 1 from ${db10SkillSynonyms} synonym
    where synonym.skill_id = ${db10Skills.id}
      and left(lower(synonym.synonym), length(${q})) = ${q}
  )`;
  const synonymContains = sql<boolean>`exists (
    select 1 from ${db10SkillSynonyms} synonym
    where synonym.skill_id = ${db10Skills.id}
      and position(${q} in lower(synonym.synonym)) > 0
  )`;
  const score = sql<number>`(
    case
      when ${normalized} = ${q} then 100
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
  return { items };
}
