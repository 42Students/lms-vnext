import "server-only";
import {and,eq,gt,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,placementOffers,placementJobs,placementCompanyRelationships,placementCompanies,placementRecruiterCollegeGrants,placementRecruiterProfiles,colleges,organizations,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";

/** Only counts records which have already been shared by a TPO shortlist.
 * The caller supplies job IDs from listOwnRecruiterPlacementJobs and a granted
 * college; private applications and screening decisions never enter this count. */
export async function recruiterVisiblePortfolioCounts(context:RequestContext,
 collegeId:string,authorizedJobIds:readonly string[]){
 const recruiter=context.recruiter;
 const activeGrant=recruiter?.grants.find(g=>g.collegeId===collegeId);
 if(!hasActiveRecruiter(context)||!recruiter||recruiter.userId!==context.user.id||!activeGrant)
  throw new AuthorizationError("placements.recruiter.read");
 const ids=[...new Set(authorizedJobIds)].slice(0,20);
 if(ids.length===0)return {} as Record<string,{sharedApplicants:number;offers:number}>;
 // A provided job ID cannot enlarge the employer's granted college/relationship.
 // Preserve all active relationships for a multi-grant recruiter within the college.
 const relationshipIds=[...new Set(recruiter.grants
   .filter(grant=>grant.collegeId===collegeId&&grant.companyRelationshipId.trim())
   .map(grant=>grant.companyRelationshipId))];
 const db=getDb();
 const scope=and(inArray(placementApplications.jobId,ids),
  recruiterOwnJobPredicate(context.user.id),
  eq(placementJobs.collegeId,collegeId),
  inArray(placementJobs.companyRelationshipId,relationshipIds),
  inArray(placementJobs.status,["PUBLISHED","CLOSED"]),
  isNull(placementJobs.archivedAt),
  eq(collegeMemberships.collegeId,collegeId),
  eq(collegeMemberships.status,"ACTIVE"),
  eq(users.platformStatus,"ACTIVE"),
  // Withdrawn/deactivated applications cannot remain in employer-visible totals
  // merely because an old shortlist or offer row was retained for audit.
  eq(placementApplications.status,"SUBMITTED"),
  eq(placementApplicationScreenings.status,"SHORTLISTED"));
 // Every job is re-scoped against the same college grant in the parent call.
 requirePermission(context,"placements.recruiter.read",{
   collegeId,placementCompanyRelationshipId:activeGrant.companyRelationshipId,
 });
 const [shared,offers]=await Promise.all([
  db.select({jobId:placementApplications.jobId,n:sql<number>`count(distinct ${placementApplications.id})::integer`})
   .from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE")))
   .innerJoin(placementCompanies,and(
    eq(placementCompanies.id,placementCompanyRelationships.companyId),
    eq(placementCompanies.id,recruiter.companyId),
    eq(placementCompanies.status,"ACTIVE")))
   .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),
    eq(colleges.status,"ACTIVE")))
   .innerJoin(organizations,and(
    eq(organizations.id,colleges.organizationId),
    eq(organizations.status,"ACTIVE")))
   .innerJoin(placementRecruiterProfiles,and(
    eq(placementRecruiterProfiles.userId,context.user.id),
    eq(placementRecruiterProfiles.companyId,placementCompanies.id),
    eq(placementRecruiterProfiles.status,"ACTIVE")))
   .innerJoin(placementRecruiterCollegeGrants,and(
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,placementJobs.companyRelationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
    gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
    sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(scope).groupBy(placementApplications.jobId),
  db.select({jobId:placementApplications.jobId,n:sql<number>`count(distinct ${placementOffers.applicationId})::integer`})
   .from(placementOffers).innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE")))
   .innerJoin(placementCompanies,and(
    eq(placementCompanies.id,placementCompanyRelationships.companyId),
    eq(placementCompanies.id,recruiter.companyId),
    eq(placementCompanies.status,"ACTIVE")))
   .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),
    eq(colleges.status,"ACTIVE")))
   .innerJoin(organizations,and(
    eq(organizations.id,colleges.organizationId),
    eq(organizations.status,"ACTIVE")))
   .innerJoin(placementRecruiterProfiles,and(
    eq(placementRecruiterProfiles.userId,context.user.id),
    eq(placementRecruiterProfiles.companyId,placementCompanies.id),
    eq(placementRecruiterProfiles.status,"ACTIVE")))
   .innerJoin(placementRecruiterCollegeGrants,and(
    eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
    eq(placementRecruiterCollegeGrants.companyRelationshipId,placementJobs.companyRelationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
    gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
    sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(scope,inArray(placementOffers.status,["ISSUED","ACCEPTED"])))
   .groupBy(placementApplications.jobId),
 ]);
 const counts:Record<string,{sharedApplicants:number;offers:number}>={};
 for(const id of ids)counts[id]={sharedApplicants:0,offers:0};
 for(const row of shared)counts[row.jobId]!.sharedApplicants=Number(row.n);
 for(const row of offers)counts[row.jobId]!.offers=Number(row.n);
 return counts;
}
