import "server-only";
import {and,asc,count,eq,gt,ilike,inArray,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {
 colleges,collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobs,users,
} from "@/db/schema";
import {projectRecruiterVisibleShortlist} from "../tpo-shareable-shortlist-model";
import {companyShareTablesReady} from "./readiness";
import {placementCompanyApplicantShares as shares,placementCompanyApplicantShareViews as views} from "./staged-schema";
import {companyShareTokenSchema,hashCompanyShareToken} from "./token-model";
import {publicApplicantSearchSchema,escapeLiteralApplicantSearch} from "./public-filter-model";

const pageSchema=z.coerce.number().int().min(1).max(10000);
export type PublicCompanyApplicantShare =
 | {kind:"UNAVAILABLE"}
 | {kind:"READY";title:string;rows:ReturnType<typeof projectRecruiterVisibleShortlist>;
    total:number;page:number;totalPages:number;truncated:boolean;search:string};

/**
 * No authenticated user context: the 256-bit opaque token is the sole capability.
 * Validation, college/job scoping, current shortlist and durable audit all run in
 * one transaction. FOR SHARE prevents concurrent revocation completing before
 * this response's audited read finishes. Evaluate expiry on the DB clock after\n * acquiring the row lock, never against a clock sampled before lock waiting.\n * Audit failures deny the response.
 */
export async function getPublicCompanyApplicantShare(
 token:unknown,rawPage:unknown=1,eventKind:"VIEW"|"CSV"="VIEW",rawSearch:unknown="",
):Promise<PublicCompanyApplicantShare>{
 const valid=companyShareTokenSchema.safeParse(token);
 const page=pageSchema.safeParse(rawPage);
 const search=publicApplicantSearchSchema.safeParse(rawSearch);
 if(!valid.success||!page.success||!search.success||!await companyShareTablesReady())
  return {kind:"UNAVAILABLE"};
 return getDb().transaction(async tx=>{
  const [grant]=await tx.select({
   shareId:shares.id,collegeId:shares.collegeId,jobId:shares.jobId,
   title:placementJobs.title,
  }).from(shares)
   .innerJoin(placementJobs,and(eq(placementJobs.id,shares.jobId),
     eq(placementJobs.collegeId,shares.collegeId)))
   .innerJoin(colleges,and(eq(colleges.id,shares.collegeId),eq(colleges.status,"ACTIVE")))
   .where(and(eq(shares.tokenHash,hashCompanyShareToken(valid.data)),
      isNull(shares.revokedAt),gt(shares.expiresAt,sql`clock_timestamp()`),
      inArray(placementJobs.status,["PUBLISHED","CLOSED"])))
   .limit(1).for("share",{of:shares});
  if(!grant)return {kind:"UNAVAILABLE" as const};
  const filter=and(
   eq(placementApplications.jobId,grant.jobId),
   eq(placementApplications.status,"SUBMITTED"),
   eq(placementApplicationScreenings.status,"SHORTLISTED"),
   eq(collegeMemberships.collegeId,grant.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   search.data?ilike(users.displayName,"%"+escapeLiteralApplicantSearch(search.data)+"%"):undefined,
  );
  const source=()=>tx.select({
   applicationId:placementApplications.id,displayName:users.displayName,email:users.email,
  }).from(placementApplications)
   .innerJoin(placementApplicationScreenings,
     eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,
     eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId)).where(filter);
  const [counter]=await tx.select({total:count()}).from(placementApplications)
   .innerJoin(placementApplicationScreenings,
     eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,
     eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId)).where(filter);
  const total=counter?.total??0;
  const isCsv=eventKind==="CSV";
  const records=await source().orderBy(asc(users.displayName),asc(placementApplications.id))
   .limit(isCsv?500:25).offset(isCsv?0:(page.data-1)*25);
  await tx.insert(views).values({
   shareId:grant.shareId,collegeId:grant.collegeId,eventKind,
  });
  return {
   kind:"READY" as const,title:grant.title,
   rows:projectRecruiterVisibleShortlist(records),
   total,page:isCsv?1:page.data,totalPages:Math.max(1,Math.ceil(total/25)),
   truncated:isCsv&&total>500,search:search.data,
  };
 });
}
