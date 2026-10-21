import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementCompanies,placementCompanyRelationships,
 placementRecruiterProfiles,placementRecruiterCollegeGrants,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {superAdminHrUserIdSchema} from "./super-admin-hr-validation";
import {PlacementsServiceError} from "./errors";

/** Super Admin audit of per-college recruiter grants. A revoked grant is
 * history, not permission. Suspended user/profile remains a separate state.
 */
export async function getSuperAdminRecruiterGrantAudit(
 context:RequestContext,rawUserId:unknown,
){
 requirePermission(context,"admin-scope.select");
 const userId=superAdminHrUserIdSchema.parse(rawUserId);
 const scope=context.adminScope,db=getDb();
 const [identity]=await db.select({
  id:users.id,email:users.email,platformStatus:users.platformStatus,
  recruiterStatus:placementRecruiterProfiles.status,
  companyId:placementRecruiterProfiles.companyId,
  companyDomain:placementCompanies.primaryDomain,
  companyName:placementCompanies.name,
 }).from(users)
 .innerJoin(placementRecruiterProfiles,eq(placementRecruiterProfiles.userId,users.id))
 .innerJoin(placementCompanies,eq(placementCompanies.id,placementRecruiterProfiles.companyId))
 .where(eq(users.id,userId)).limit(1);
 if(!identity)throw new PlacementsServiceError("PLACEMENT_RECRUITER_USER_NOT_FOUND");
 const grants=await db.select({
  grant:placementRecruiterCollegeGrants,
  collegeId:colleges.id,collegeStatus:colleges.status,
  companyId:placementCompanyRelationships.companyId,
  relationshipStatus:placementCompanyRelationships.status,
 }).from(placementRecruiterCollegeGrants)
  .innerJoin(placementCompanyRelationships,
   eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
  .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
  .where(and(eq(placementRecruiterCollegeGrants.recruiterUserId,userId),
   scope?.collegeId?eq(colleges.id,scope.collegeId):undefined,
   scope?.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
  .orderBy(asc(colleges.name),asc(placementRecruiterCollegeGrants.createdAt));
 if((scope?.collegeId||scope?.organizationId)&&grants.length===0)
  throw new AuthorizationError("admin-scope.select");
 const emailDomain=identity.email?.split("@").at(-1)?.toLowerCase()??null;
 const canonicalDomain=identity.companyDomain?.toLowerCase()??null;
 const now=Date.now();
 return {
  userId:identity.id,companyId:identity.companyId,companyName:identity.companyName,
  email:identity.email,platformStatus:identity.platformStatus,
  recruiterProfileStatus:identity.recruiterStatus,
  emailDomain,canonicalCompanyDomain:canonicalDomain,
  domainReviewRequired:Boolean(emailDomain&&canonicalDomain&&
   emailDomain!==canonicalDomain&&!emailDomain.endsWith("."+canonicalDomain)),
  grants:grants.map(row=>{
   const grant=row.grant;
   const active=grant.status==="ACTIVE"&&grant.verificationStatus==="VERIFIED"&&
    grant.validUntil!==null&&grant.validUntil.getTime()>now&&
    identity.platformStatus==="ACTIVE"&&identity.recruiterStatus==="ACTIVE"&&
    row.collegeStatus==="ACTIVE"&&row.relationshipStatus==="ACTIVE"&&
    row.companyId===identity.companyId;
   return {
    id:grant.id,collegeId:row.collegeId,companyRelationshipId:grant.companyRelationshipId,
    status:grant.status,verificationStatus:grant.verificationStatus,
    accountSuspended:identity.platformStatus==="DISABLED"||
     identity.recruiterStatus!=="ACTIVE",
    capabilities:[...grant.capabilities],
    effectiveCapabilities:active?[...grant.capabilities]:[],
    validUntil:grant.validUntil?.toISOString()??null,
    revokedAt:grant.revokedAt?.toISOString()??null,
    revokedByUserId:grant.revokedByUserId,revokeReason:grant.revokeReason??null,
    legacyImportMetadata:grant.legacyImportMetadata??null,
    version:grant.version,createdAt:grant.createdAt.toISOString(),
   };
  }),
 };
}
/** Pure migration translation, not a grant extension. The historical IST
 * calendar day is inclusive through 23:59:59.999 local, not midnight UTC.
 */
export function legacyRecruiterExpiryIstEndOfDay(raw:unknown):string{
 if(typeof raw!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(raw))
  throw new Error("Enter expiry as YYYY-MM-DD in IST.");
 const year=Number(raw.slice(0,4)),month=Number(raw.slice(5,7)),day=Number(raw.slice(8,10));
 if(month<1||month>12||day<1||
  new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)!==raw)
  throw new Error("Enter a valid calendar date in IST.");
 return new Date(Date.UTC(year,month-1,day+1)-330*60_000-1).toISOString();
}
