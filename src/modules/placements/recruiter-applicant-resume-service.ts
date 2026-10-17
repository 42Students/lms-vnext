import "server-only";
import {and,desc,eq,gt,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementCompanyRelationships,profilePrivateDocumentReceipts,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {createPrivateReadGrant} from "@/modules/storage/private-object-storage";

export class RecruiterResumeUnavailable extends Error{
 constructor(){super("RECRUITER_RESUME_NOT_AVAILABLE");}
}
/** REC-home-drives-38: resumes are tenant-private receipts, not profile JSON URLs.
 * The job, recruiter company, shortlist decision, exact consented share columns,
 * receipt ownership, privileged scan metadata and object generation all bind
 * the grant. No private key/bucket path crosses this return boundary.
 */
export async function grantRecruiterSharedResume(
 context:RequestContext,rawJobId:unknown,rawApplicationId:unknown,
){
 const jobId=z.string().uuid().parse(rawJobId);
 const applicationId=z.string().uuid().parse(rawApplicationId);
 const workspace=await getRecruiterPlacementWorkspace(context,jobId);
 const db=getDb();
 const grant=context.recruiter?.grants.find(item=>item.collegeId===workspace.college.id &&
   item.companyRelationshipId===workspace.job.companyRelationshipId);
 if(!grant)throw new RecruiterResumeUnavailable();
 const [relation]=await db.select({columns:placementCompanyRelationships.shareColumnDefaults})
  .from(placementCompanyRelationships)
  .where(and(eq(placementCompanyRelationships.id,grant.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,workspace.college.id),
    eq(placementCompanyRelationships.companyId,context.recruiter?.companyId??""),
    eq(placementCompanyRelationships.status,"ACTIVE"))).limit(1);
 if(!relation?.columns?.includes("resume"))throw new RecruiterResumeUnavailable();
 const [applicant]=await db.select({membershipId:placementApplications.membershipId})
  .from(placementApplications)
  .innerJoin(placementApplicationScreenings,
    eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementApplications.id,applicationId),
    eq(placementApplications.jobId,workspace.job.id),
    eq(placementApplications.status,"SUBMITTED"),
    eq(placementApplicationScreenings.status,"SHORTLISTED"),
    eq(collegeMemberships.collegeId,workspace.college.id),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!applicant)throw new RecruiterResumeUnavailable();
 const now=new Date();
 const [receipt]=await db.select().from(profilePrivateDocumentReceipts)
  .where(and(eq(profilePrivateDocumentReceipts.owningMembershipId,applicant.membershipId),
    eq(profilePrivateDocumentReceipts.purpose,"RESUME"),
    eq(profilePrivateDocumentReceipts.scanStatus,"CLEAN"),
    isNull(profilePrivateDocumentReceipts.revokedAt),
    or(isNull(profilePrivateDocumentReceipts.retentionUntil),
      gt(profilePrivateDocumentReceipts.retentionUntil,now))))
  .orderBy(desc(profilePrivateDocumentReceipts.uploadedAt),
   desc(profilePrivateDocumentReceipts.id)).limit(1);
 const selected=receipt;
 if(!selected)throw new RecruiterResumeUnavailable();
 const evidence={...selected,scanStatus:"CLEAN" as const,purpose:"RESUME" as const};
 if(!await verifyPrivateDocumentReceipt(evidence))
  throw new RecruiterResumeUnavailable();
 const privateGrant=await createPrivateReadGrant({
   objectKey:selected.privateObjectKey,collegeId:workspace.college.id,
   ownerMembershipId:applicant.membershipId,expiresInMs:120_000,
 });
 if(privateGrant.generation!==selected.objectGeneration ||
    privateGrant.sha256Hex.toLowerCase()!==selected.sha256Hex.toLowerCase())
   throw new RecruiterResumeUnavailable();
 return {url:privateGrant.readUrl,expiresAt:privateGrant.expiresAt.toISOString(),
   contentType:privateGrant.contentType};
}
