import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {placementCompanyShareSelections} from "@/db/schema/placement-company-share-selection";
import {getDb} from "@/db/client";
import {placementCompanyApplicantShares} from "@/db/schema/placement-company-shares";
import {placementJobs} from "@/db/schema";
import {companyShareTablesReady} from "./readiness";

export async function listCompanyShareHistory(collegeId:string,jobIds:readonly string[]){
 if(jobIds.length===0)return {ready:true,items:[]};
 if(!await companyShareTablesReady())return {ready:false,items:[]};
 const rows=await getDb().select({
  id:placementCompanyApplicantShares.id,
  jobId:placementCompanyApplicantShares.jobId,
  jobTitle:placementJobs.title,
  createdAt:placementCompanyApplicantShares.createdAt,
  revokedAt:placementCompanyApplicantShares.revokedAt,
  expiresAt:placementCompanyApplicantShares.expiresAt,
  selectedCount:sql<number>`(select count(*)::integer from placement_company_share_selections sel
    where sel.share_id = ${placementCompanyApplicantShares.id})`,
 }).from(placementCompanyApplicantShares)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementCompanyApplicantShares.jobId),
  eq(placementJobs.collegeId,placementCompanyApplicantShares.collegeId)))
 .where(and(eq(placementCompanyApplicantShares.collegeId,collegeId),
  inArray(placementCompanyApplicantShares.jobId,[...jobIds])))
 .orderBy(desc(placementCompanyApplicantShares.createdAt)).limit(100);
 return {ready:true,items:rows};
}
