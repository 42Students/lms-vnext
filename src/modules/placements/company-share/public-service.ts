import "server-only";
import {and,asc,count,eq,gt,ilike,inArray,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {
 colleges,collegeMemberships,organizations,placementApplications,placementApplicationScreenings,
 placementCompanies,placementCompanyRelationships,placementJobs,users,learnerProfiles,
} from "@/db/schema";
import {projectCompanyShareRows,safeCompanyShareColumns} from "./column-model";
import {companyShareTablesReady} from "./readiness";
import {placementTableExists} from "../staged-tables";
import {placementCompanyShareSelections as selectedShares} from "@/db/schema/placement-company-share-selection";
import {placementCompanyApplicantShares as shares,placementCompanyApplicantShareViews as views} from "@/db/schema/placement-company-shares";
import {companyShareTokenSchema,hashCompanyShareToken,companyShareAccessProof,validCompanyShareAccessProof} from "./token-model";
import {publicApplicantSearchSchema,escapeLiteralApplicantSearch,clampCompanySharePage} from "./public-filter-model";

const pageSchema=z.coerce.number().int().min(1).max(10000);
export type PublicCompanyApplicantShare =
 | {kind:"UNAVAILABLE"}
 | {kind:"CODE_REQUIRED"}
 | {kind:"READY";title:string;companyName:string;collegeName:string;
    sharedAt:string;expiresAt:string;rows:ReturnType<typeof projectCompanyShareRows>;
    total:number;page:number;totalPages:number;truncated:boolean;search:string;
    selectedColumns:string[];shortlistBy:string|null};

/**
 * No authenticated user context: the 256-bit opaque token is the sole capability.
 * Validation, college/job scoping, current shortlist and durable audit all run in
 * one transaction. FOR SHARE prevents concurrent revocation completing before
 * this response's audited read finishes. Evaluate expiry on the DB clock after\n * acquiring the row lock, never against a clock sampled before lock waiting.\n * Audit failures deny the response.
 */
export async function getPublicCompanyApplicantShare(
 token:unknown,rawPage:unknown=1,eventKind:"VIEW"|"CSV"="VIEW",rawSearch:unknown="",rawProof:unknown=null,
):Promise<PublicCompanyApplicantShare>{
 const valid=companyShareTokenSchema.safeParse(token);
 const page=pageSchema.safeParse(rawPage);
 const search=publicApplicantSearchSchema.safeParse(rawSearch);
 if(!valid.success||!page.success||!search.success||!await companyShareTablesReady())
  return {kind:"UNAVAILABLE"};
 return getDb().transaction(async tx=>{
  const [grant]=await tx.select({
   shareId:shares.id,collegeId:shares.collegeId,jobId:shares.jobId,
   title:placementJobs.title,companyName:placementCompanies.name,collegeName:colleges.name,
   sharedAt:shares.createdAt,expiresAt:shares.expiresAt,
   tokenHash:shares.tokenHash,codeHash:shares.codeHash,lockedUntil:shares.lockedUntil,
   selectedColumns:shares.selectedColumns,shortlistBy:shares.shortlistBy,
  }).from(shares)
   .innerJoin(placementJobs,and(eq(placementJobs.id,shares.jobId),
     eq(placementJobs.collegeId,shares.collegeId)))
   .innerJoin(placementCompanyRelationships,and(
     eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
     eq(placementCompanyRelationships.collegeId,shares.collegeId)))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .innerJoin(colleges,and(eq(colleges.id,shares.collegeId),eq(colleges.status,"ACTIVE")))
   .innerJoin(organizations,and(
     eq(organizations.id,colleges.organizationId),
     eq(organizations.status,"ACTIVE"),
   ))
   .where(and(eq(shares.tokenHash,hashCompanyShareToken(valid.data)),
      isNull(shares.revokedAt),gt(shares.expiresAt,sql`clock_timestamp()`),
      inArray(placementJobs.status,["PUBLISHED","CLOSED"])))
   .limit(1).for("share",{of:shares});
  if(!grant)return {kind:"UNAVAILABLE" as const};
  // No applicant, column or audit query before BOTH challenges are satisfied.
  const signed=companyShareAccessProof(grant.shareId,grant.tokenHash,grant.codeHash);
  if(grant.lockedUntil&&grant.lockedUntil.getTime()>Date.now()||
    !validCompanyShareAccessProof(rawProof,signed))
    return {kind:"CODE_REQUIRED" as const};
  const selectionReady=await placementTableExists("placement_company_share_selections");
  const selected=selectionReady?await tx.select({applicationId:selectedShares.applicationId})
    .from(selectedShares).where(eq(selectedShares.shareId,grant.shareId)):[];
  const selectedIds=selected.map(item=>item.applicationId);
  // Capability tokens permit only the explicit applicant projection. Never
  // forward arbitrary DB stored selectedColumns or job posting JSON keys:
  // internal screening rules, identity IDs and legacy importantDates maps
  // are not part of the public grant.
  const selectedColumns=safeCompanyShareColumns(grant.selectedColumns);
  const filter=and(
   eq(placementApplications.jobId,grant.jobId),
   selectedIds.length?inArray(placementApplications.id,selectedIds):undefined,
   eq(placementApplications.status,"SUBMITTED"),
   eq(placementApplicationScreenings.status,"SHORTLISTED"),
   eq(collegeMemberships.collegeId,grant.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   search.data?ilike(users.displayName,"%"+escapeLiteralApplicantSearch(search.data)+"%"):undefined,
  );
  const source=()=>tx.select({
   applicationId:placementApplications.id,displayName:users.displayName,email:users.email,
   phone:users.phoneE164,rollNumber:learnerProfiles.rollNumber,
   profileDocument:learnerProfiles.profileDocument,
   stage:placementApplicationScreenings.status,
   branch:sql<string|null>`(SELECT p.name FROM learner_program_enrollments lpe
      JOIN programs p ON p.id=lpe.program_id
      WHERE lpe.membership_id=${collegeMemberships.id} AND lpe.status='ACTIVE'
      ORDER BY p.name,p.id LIMIT 1)`,
  }).from(placementApplications)
   .innerJoin(placementApplicationScreenings,
     eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,
     eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
   .where(filter);
  const [counter]=await tx.select({total:count()}).from(placementApplications)
   .innerJoin(placementApplicationScreenings,
     eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,
     eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId)).where(filter);
  const total=counter?.total??0;
  const pagination=clampCompanySharePage(page.data,total);
  const isCsv=eventKind==="CSV";
  const records=await source().orderBy(asc(users.displayName),asc(placementApplications.id))
   .limit(isCsv?500:25).offset(isCsv?0:(pagination.page-1)*25);
  await tx.insert(views).values({
   shareId:grant.shareId,collegeId:grant.collegeId,eventKind,
  });
  return {
   kind:"READY" as const,title:grant.title,companyName:grant.companyName,
   collegeName:grant.collegeName,sharedAt:grant.sharedAt.toISOString(),
   expiresAt:grant.expiresAt.toISOString(),
   rows:projectCompanyShareRows(records,selectedColumns),
   total,page:isCsv?1:pagination.page,totalPages:pagination.totalPages,
   truncated:isCsv&&total>500,search:search.data,
   selectedColumns,shortlistBy:grant.shortlistBy?.toISOString()??null,
  };
 });
}
