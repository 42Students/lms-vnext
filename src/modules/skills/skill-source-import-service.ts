import "server-only";
import {eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10Skills} from "@/db/schema/db10-skills-catalog.draft";
import {type RequestContext,isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {skillsCatalogSchemaReady} from "./catalog-readiness";
import {parseLegacySkillSource,skillImportRequestSchema} from "./skill-source-import-model";

/** Explicit admin action only. A successful import is not proof of DB10
 * full catalog replay and never flips runtime feature readiness by itself. */
export async function reconcileLegacySkillCatalog(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||
   context.adminScope?.organizationId)throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 if(!skillsCatalogSchemaReady())throw new Error("DB10_SCHEMA_REPLAY_NOT_VERIFIED");
 const input=skillImportRequestSchema.parse(raw);
 const parsed=parseLegacySkillSource(input.format,input.source);
 return getDb().transaction(async tx=>{
  const previous=await tx.select({name:db10Skills.name}).from(db10Skills).limit(50001);
  if(previous.length>=50001)throw new Error("Skill catalog requires paged import review");
  const current=new Set(previous.map(item=>item.name.toLocaleLowerCase("en-US")));
  const provided=new Set(parsed.rows.map(item=>item.name));
  const missing=parsed.rows.filter(item=>!current.has(item.name));
  const extra=previous.filter(item=>!provided.has(item.name.toLocaleLowerCase("en-US")));
  let added=0;
  if(!input.dryRun){
   for(let start=0;start<missing.length;start+=500){
    const batch=missing.slice(start,start+500);
    const inserted=await tx.insert(db10Skills).values(batch.map(item=>({
      name:item.name,displayName:item.displayName,category:item.category,
      isActive:true,usageCount:0,searchPriority:0,
    }))).onConflictDoNothing().returning({id:db10Skills.id});
    added+=inserted.length;
   }
  }
  return {
   dryRun:input.dryRun,sourceFormat:input.format,sourceCount:parsed.rows.length,
   existingCount:previous.length,invalid:parsed.invalid,
   invalidShown:parsed.invalid.length,duplicateSource:parsed.duplicates,
   missingCount:missing.length,extraCount:extra.length,
   missingPreview:missing.slice(0,100).map(item=>item.displayName),
   extraPreview:extra.slice(0,100).map(item=>item.name),
   added,requiresVerification:true,
   message:input.dryRun?"Skill import preview complete":
     "Skills imported. Verify seed counts and synonyms before enabling catalog.",
  };
 });
}
