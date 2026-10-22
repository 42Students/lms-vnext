import "server-only";
import {randomBytes} from "node:crypto";
import {and,eq,sql,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementPublicExternalJobLinks,placementJobs,
 placementCompanyRelationships,placementCompanies} from "@/db/schema";
import {type RequestContext,hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
const jobIdSchema=z.string().uuid();
const slugSchema=z.string().regex(/^smr-[0-9a-f]{16}$/);
function publicExternalHref(raw:string|null){
 if(!raw)return null;
 try{
  const parsed=new URL(raw);
  if(parsed.protocol!=="https:"||parsed.username||parsed.password||raw.length>2048)
   return null;
  return parsed.toString();
 }catch{return null;}
}
export async function createPublicExternalJobLink(context:RequestContext,rawId:unknown){
 const jobId=jobIdSchema.parse(rawId),member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO"))
  throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId:member.collegeId});
 const college=await requirePlacementManageScope(context,member.collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [job]=await tx.select().from(placementJobs)
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,college.id)))
   .for("update").limit(1);
  if(!job||job.status!=="PUBLISHED"||
     !["HYBRID","EXTERNAL_ONLY"].includes(job.applicationMode)||
     !publicExternalHref(job.externalApplicationUrl))
   throw new Error("PUBLIC_EXTERNAL_JOB_NOT_FOUND");
  const [existing]=await tx.select({slug:placementPublicExternalJobLinks.slug})
   .from(placementPublicExternalJobLinks)
   .where(and(eq(placementPublicExternalJobLinks.jobId,job.id),
    eq(placementPublicExternalJobLinks.collegeId,college.id),
    isNull(placementPublicExternalJobLinks.revokedAt))).limit(1);
  if(existing)return {href:"/jobs/external/"+existing.slug,replayed:true};
  const slug="smr-"+randomBytes(8).toString("hex");
  const [created]=await tx.insert(placementPublicExternalJobLinks).values({
   jobId:job.id,collegeId:college.id,slug,
  }).returning({slug:placementPublicExternalJobLinks.slug});
  if(!created)throw new Error("PUBLIC_EXTERNAL_JOB_NOT_FOUND");
  await tx.update(placementJobs).set({publicExternalSlug:created.slug})
   .where(and(eq(placementJobs.id,job.id),eq(placementJobs.collegeId,college.id)));
  return {href:"/jobs/external/"+created.slug,replayed:false};
 });
}
export async function readPublicExternalJob(rawSlug:string){
 const slug=slugSchema.safeParse(rawSlug);
 if(!slug.success)return null;
 const [row]=await getDb().select({
  collegeId:placementJobs.collegeId,
  jobTitle:placementJobs.title,
  roleDescription:placementJobs.description,
  workMode:placementJobs.workMode,
  applicationMode:placementJobs.applicationMode,
  externalUrl:placementJobs.externalApplicationUrl,
  companyName:placementCompanies.name,
 }).from(placementPublicExternalJobLinks)
  .innerJoin(placementJobs,and(
    eq(placementJobs.id,placementPublicExternalJobLinks.jobId),
    eq(placementJobs.collegeId,placementPublicExternalJobLinks.collegeId)))
  .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE")))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(and(eq(placementPublicExternalJobLinks.slug,slug.data),
    isNull(placementPublicExternalJobLinks.revokedAt),
    eq(placementJobs.status,"PUBLISHED"),
    sql`${placementJobs.applicationMode} in ('HYBRID','EXTERNAL_ONLY')`,
    eq(placementCompanies.status,"ACTIVE"))).limit(1);
 if(!row)return null;
 const link=publicExternalHref(row.externalUrl);
 if(!link)return null;
 await getDb().update(placementPublicExternalJobLinks).set({
  viewsCount:sql`${placementPublicExternalJobLinks.viewsCount}+1`,
 }).where(and(eq(placementPublicExternalJobLinks.slug,slug.data),
  isNull(placementPublicExternalJobLinks.revokedAt)));
 return {title:row.jobTitle,companyName:row.companyName,description:row.roleDescription,
  workMode:row.workMode,applicationMode:row.applicationMode,applyHref:link};
}
