import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { db10Skills, db10SkillSynonyms } from "@/db/schema/db10-skills-catalog.draft";
import { type RequestContext, isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { importSkillSynonyms } from "@/modules/skills/legacy-skill-import-model";
import { skillsCatalogSchemaReady } from "@/modules/skills/catalog-readiness";

/** Source: legacy SynonymDataLoader, @Order(2), run AFTER canonical Skill seed.
 * Each source row is reconciled per canonical skill (not globally unique).
 * Never seed on server startup, since migration or RTF import may be absent. */
export const curatedSkillSynonyms: Readonly<Record<string, readonly string[]>> = {
  javascript:["js","ecmascript","es6","es2015"],
  typescript:["ts"],
  python:["py","python3","python2"],
  "c++":["cpp","cplusplus"],
  "c#":["csharp","c sharp","dotnet"],
  ruby:["rb","ruby on rails"],
  go:["golang","go lang"],
  kotlin:["kt"],
  swift:["ios swift"],
  react:["reactjs","react.js"],
  "react native":["rn","reactnative"],
  angular:["ng","angularjs","angular.js"],
  "vue.js":["vue","vuejs"],
  "node.js":["node","nodejs"],
  "express.js":["express","expressjs"],
  "spring boot":["spring","springboot"],
  django:["python django"],
  flask:["python flask"],
  "next.js":["next","nextjs"],
  kubernetes:["k8s","kube"],
  docker:["containerization","containers"],
  "amazon web services":["aws"],
  "google cloud platform":["gcp","google cloud"],
  "microsoft azure":["azure","az"],
  "continuous integration":["ci"],
  "continuous deployment":["cd"],
  jenkins:["ci/cd","cicd"],
  terraform:["tf","iac"],
  "machine learning":["ml"],
  "artificial intelligence":["ai"],
  "deep learning":["dl","neural networks"],
  "natural language processing":["nlp"],
  "computer vision":["cv","image recognition"],
  "data science":["ds"],
  "data analysis":["analytics","data analytics"],
  "data engineering":["de","etl"],
  postgresql:["postgres","psql"],
  mongodb:["mongo"],
  mysql:["sql"],
  elasticsearch:["elastic","es"],
  redis:["cache","in-memory db"],
  "rest api":["api","restful","rest"],
  graphql:["gql"],
  git:["github","gitlab","version control"],
  linux:["unix","bash","shell"],
  microservices:["micro services","msa"],
  "project management":["pm","pmp"],
  "quality assurance":["qa","testing"],
  "user experience":["ux","uxd"],
  "user interface":["ui","uid"],
  agile:["scrum","kanban","agile methodology"],
};

export type CuratedSeedReport = {
  sourceSkills: number;
  sourceSynonyms: number;
  matchedSkills: number;
  unmatchedSkills: string[];
  addedSynonyms: number;
  existingSynonyms: number;
  duplicateSourceSynonyms: number;
  dryRun: boolean;
};

/** Server-only authorized, idempotent explicit seed/replay.
 * Transaction either applies the full deterministic matched set or none.
 * Unmatched parents are reported (max 100) rather than silently guessed. */
export async function reconcileCuratedSkillSynonyms(
  context: RequestContext,
  dryRun: boolean,
): Promise<CuratedSeedReport> {
  if (!isSuperAdmin(context)) throw new AuthorizationError("admin-scope.select");
  requirePermission(context, "admin-scope.select");
  if (!skillsCatalogSchemaReady()) throw new Error("DB10_SCHEMA_REPLAY_NOT_VERIFIED");

  return getDb().transaction(async tx => {
    let matchedSkills = 0, addedSynonyms = 0, existingSynonyms = 0;
    let duplicateSourceSynonyms = 0, sourceSynonyms = 0;
    const unmatchedSkills:string[] = [];

    for (const [canonical, rawAliases] of Object.entries(curatedSkillSynonyms)) {
      sourceSynonyms += rawAliases.length;
      const normalized = importSkillSynonyms("", rawAliases).map(row=>row.synonym);
      duplicateSourceSynonyms += rawAliases.length - normalized.length;
      // No fuzzy parent selection: the import must never attach an alias to a
      // merely similar unrelated skill in the shared global catalog.
      const [parent] = await tx.select({id:db10Skills.id}).from(db10Skills)
        .where(and(eq(db10Skills.isActive,true),
          sql`lower(${db10Skills.name}) = ${canonical}`)).limit(1);
      if (!parent) {
        if(unmatchedSkills.length<100)unmatchedSkills.push(canonical);
        continue;
      }
      matchedSkills++;
      for (const {synonym} of importSkillSynonyms(parent.id, rawAliases)) {
        const [exists] = await tx.select({id:db10SkillSynonyms.id})
          .from(db10SkillSynonyms).where(and(
            eq(db10SkillSynonyms.skillId,parent.id),
            sql`lower(${db10SkillSynonyms.synonym}) = ${synonym}`,
          )).limit(1);
        if(exists){existingSynonyms++;continue;}
        if (dryRun) { addedSynonyms++; continue; }
        const inserted=await tx.insert(db10SkillSynonyms)
          .values({skillId:parent.id,synonym})
          .onConflictDoNothing().returning({id:db10SkillSynonyms.id});
        if(inserted.length)addedSynonyms++;else existingSynonyms++;
      }
    }

    return {sourceSkills:Object.keys(curatedSkillSynonyms).length,sourceSynonyms,
      matchedSkills,unmatchedSkills,addedSynonyms,existingSynonyms,
      duplicateSourceSynonyms,dryRun};
  });
}
