import "server-only";
import {eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10Skills,db10SkillSynonyms} from "@/db/schema/db10-skills-catalog.draft";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {skillsCatalogSchemaReady} from "./catalog-readiness";
import {parseSkillCatalogImport,skillCatalogImportSchema,skillImportPreview} from "./catalog-import-model";

function requireSkillImportAdmin(context:RequestContext){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
    context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
}

/** Idempotent per-skill importer. No arbitrary remote fetch, no writing
 * either popularity counter and no auto-enabling the catalog read side.
 * Keep the schema unavailable until deployment has replay-verified 0195. */
export async function importAdminSkillCatalog(context:RequestContext,raw:unknown){
 requireSkillImportAdmin(context);
 if(!skillsCatalogSchemaReady())return {ready:false as const,
   reason:"DB10_SKILLS_SCHEMA_NOT_VERIFIED"};
 const input=skillCatalogImportSchema.parse(raw);
 const parsed=parseSkillCatalogImport(input.format,input.content);
 const sourceNames=parsed.rows.map(row=>row.normalizedName);
 const existing=await getDb().select({
   name:db10Skills.name,id:db10Skills.id,displayName:db10Skills.displayName,
 }).from(db10Skills).orderBy(db10Skills.name).limit(50_001);
 const byName=new Map(existing.map(row=>[row.name.toLocaleLowerCase("en-IN"),row]));
 const sourceSet=new Set(sourceNames);
 const missing=sourceNames.filter(name=>!byName.has(name));
 const extra=existing.filter(row=>!sourceSet.has(row.name.toLocaleLowerCase("en-IN")))
  .map(row=>row.name);
 const preview=skillImportPreview(missing,extra);
 if(input.dryRun)return {
  ready:true as const,dryRun:true,
  sourceCount:parsed.rows.length,storedCount:existing.length,
  rejected:parsed.rejected.slice(0,100),
  duplicates:parsed.duplicates.slice(0,100),
  sourceTruncated:parsed.truncated,storedTruncated:existing.length>50_000,
  ...preview,
 };
 // Never commit a partial or unreviewed source import. A large or invalid
 // catalog must be split into separately reviewed deterministic chunks.
 if(parsed.truncated||parsed.rejected.length||parsed.duplicates.length)
  return {ready:true as const,dryRun:false,committed:false,
    reason:"SOURCE_REQUIRES_REVIEW",...preview,
    rejected:parsed.rejected.slice(0,100),
    duplicates:parsed.duplicates.slice(0,100)};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  let inserted=0,synonymsInserted=0;
  for(const item of parsed.rows){
   const [newSkill]=await tx.insert(db10Skills).values({
    name:item.normalizedName,displayName:item.displayName,
    category:item.category,usageCount:0,searchPriority:0,
   }).onConflictDoNothing().returning({id:db10Skills.id});
   if(newSkill)inserted++;
   const [skill]=newSkill?[newSkill]:await tx.select({id:db10Skills.id})
    .from(db10Skills)
    .where(sql`lower(${db10Skills.name}) = ${item.normalizedName}`)
    .limit(1);
   if(!skill)throw new Error("Skill import identity conflict");
   if(!item.synonyms.length)continue;
   // A synonym may point at multiple skill IDs. Only within a single
   // skill do we deduplicate an identical spelling on rerun.
   const prior=await tx.select({synonym:db10SkillSynonyms.synonym})
    .from(db10SkillSynonyms).where(eq(db10SkillSynonyms.skillId,skill.id));
   const seen=new Set(prior.map(row=>row.synonym.toLocaleLowerCase("en-IN")));
   for(const synonym of item.synonyms){
    if(seen.has(synonym))continue;
    await tx.insert(db10SkillSynonyms).values({skillId:skill.id,synonym});
    seen.add(synonym);synonymsInserted++;
   }
  }
  return {ready:true as const,dryRun:false,committed:true,
   inserted,synonymsInserted,sourceCount:parsed.rows.length,
   catalogReadEnabled:false,
   message:"Schema-backed catalog rows saved. Read access remains gated until replay and seed verification."};
 });
}
