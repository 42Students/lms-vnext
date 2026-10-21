import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,placementCompanies,placementCompanyRelationships,
 placementRecruiterCollegeGrants,placementRecruiterProfiles,
 placementTpoLeads,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";

const id=z.string().uuid();
const action=z.strictObject({
 action:z.enum(["ACCEPT","DECLINE"]),
 expectedVersion:z.number().int().min(1),
});
function requireSignedRecruiter(context:RequestContext){
 if(context.user.platformStatus!=="ACTIVE"||
    !context.recruiter||context.recruiter.userId!==context.user.id)
  throw new Error("PENDING_RECRUITER_ACCESS_DENIED");
 return context.recruiter;
}
export async function listOwnRecruiterPendingInvites(context:RequestContext){
 const actor=requireSignedRecruiter(context);
 const rows=await getDb().select({
  id:placementRecruiterCollegeGrants.id,
  version:placementRecruiterCollegeGrants.version,
  status:placementRecruiterCollegeGrants.status,
  collegeId:placementCompanyRelationships.collegeId,
  collegeName:colleges.name,
  companyName:placementCompanies.name,
  leadId:placementRecruiterCollegeGrants.pendingRecruiterLeadId,
  updatedAt:placementRecruiterCollegeGrants.updatedAt,
 }).from(placementRecruiterCollegeGrants)
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId),
   eq(placementCompanyRelationships.status,"ACTIVE"),
  ))
  .innerJoin(colleges,and(
   eq(colleges.id,placementCompanyRelationships.collegeId),
   eq(colleges.status,"ACTIVE"),
  ))
  .innerJoin(placementCompanies,and(
   eq(placementCompanies.id,placementCompanyRelationships.companyId),
   eq(placementCompanies.status,"ACTIVE"),
   eq(placementCompanies.id,actor.companyId),
  ))
  .where(and(
   eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
   eq(placementRecruiterCollegeGrants.status,"PENDING_RECRUITER"),
  )).orderBy(desc(placementRecruiterCollegeGrants.updatedAt));
 return {items:rows};
}
/** An existing recruiter consents explicitly. Never grant a pending row
 * visibility in the active identity-context reader. Lock the row and check
 * tenant, lead, profile, relationship and actor again inside the transaction. */
export async function respondToOwnRecruiterPendingInvite(
 context:RequestContext,rawId:unknown,raw:unknown,
){
 const actor=requireSignedRecruiter(context);
 const grantId=id.parse(rawId),input=action.parse(raw);
 return getDb().transaction(async tx=>{
  const [row]=await tx.select({
   grant:placementRecruiterCollegeGrants,
   companyId:placementCompanyRelationships.companyId,
   collegeId:placementCompanyRelationships.collegeId,
   collegeStatus:colleges.status,
   relationshipStatus:placementCompanyRelationships.status,
   profileStatus:placementRecruiterProfiles.status,
   platformStatus:users.platformStatus,
   leadCollegeId:placementTpoLeads.collegeId,
  }).from(placementRecruiterCollegeGrants)
   .innerJoin(placementCompanyRelationships,
    eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
   .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
   .innerJoin(placementRecruiterProfiles,
    eq(placementRecruiterProfiles.userId,placementRecruiterCollegeGrants.recruiterUserId))
   .innerJoin(users,eq(users.id,placementRecruiterCollegeGrants.recruiterUserId))
   .leftJoin(placementTpoLeads,and(
    eq(placementTpoLeads.id,placementRecruiterCollegeGrants.pendingRecruiterLeadId),
    eq(placementTpoLeads.collegeId,placementCompanyRelationships.collegeId)))
   .where(and(
    eq(placementRecruiterCollegeGrants.id,grantId),
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
   )).for("update",{of:placementRecruiterCollegeGrants}).limit(1);
  if(!row||row.companyId!==actor.companyId||
    row.collegeStatus!=="ACTIVE"||row.relationshipStatus!=="ACTIVE"||
    row.profileStatus!=="ACTIVE"||row.platformStatus!=="ACTIVE")
   throw new Error("PENDING_RECRUITER_NOT_FOUND");
  if(row.grant.version!==input.expectedVersion)
   throw new Error("PENDING_RECRUITER_STALE");
  if(row.grant.status!=="PENDING_RECRUITER")
   throw new Error("PENDING_RECRUITER_INVALID_STATE");
  if(row.grant.pendingRecruiterLeadId&&row.leadCollegeId!==row.collegeId)
   throw new Error("PENDING_RECRUITER_NOT_FOUND");
  if(input.action==="ACCEPT"&&(!row.grant.validUntil||
      row.grant.validUntil.getTime()<=Date.now()))
   throw new Error("PENDING_RECRUITER_EXPIRED");
  const now=new Date(),next=input.action==="ACCEPT"?"ACTIVE":"REVOKED";
  const [updated]=await tx.update(placementRecruiterCollegeGrants).set({
   status:next,
   pendingRecruiterLeadId:null,
   ...(input.action==="DECLINE"?{
    revokedAt:now,revokedByUserId:context.user.id,
    revokedByType:"RECRUITER",revokeReason:"Declined recruiter college invitation",
   }:{}),
   updatedAt:now,
   version:sql`${placementRecruiterCollegeGrants.version}+1`,
  }).where(and(
   eq(placementRecruiterCollegeGrants.id,row.grant.id),
   eq(placementRecruiterCollegeGrants.status,"PENDING_RECRUITER"),
   eq(placementRecruiterCollegeGrants.version,input.expectedVersion),
  )).returning({id:placementRecruiterCollegeGrants.id,
   status:placementRecruiterCollegeGrants.status,
   version:placementRecruiterCollegeGrants.version});
  if(!updated)throw new Error("PENDING_RECRUITER_STALE");
  return {grantId:updated.id,status:updated.status,version:updated.version};
 });
}
