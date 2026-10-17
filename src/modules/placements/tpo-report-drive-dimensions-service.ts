import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanyRelationships,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePlacementManageScope} from "./scope";

/** Observed drive dimensions for display-only secondary report table filters.
 * These rows do not change aggregate season/drive metrics or default CSV exports. */
export async function getTpoReportDriveDimensions(context:RequestContext,input:{
 collegeId:string;seasonId:string|null;jobId:string|null;
}){
 await requirePlacementManageScope(context,input.collegeId);
 if(!input.seasonId)return new Map<string,{companyId:string;workMode:string;payCategory:string}>();
 const rows=await getDb().select({
  jobId:placementJobs.id,companyId:placementCompanyRelationships.companyId,
  workMode:placementJobs.workMode,
  minCtc:placementJobs.minimumAnnualCtcInr,
  maxCtc:placementJobs.maximumAnnualCtcInr,
  stipend:placementJobs.stipendPerMonthInr,
 }).from(placementJobs).innerJoin(placementCompanyRelationships,and(
  eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
  eq(placementCompanyRelationships.collegeId,input.collegeId)))
  .where(and(eq(placementJobs.collegeId,input.collegeId),
   eq(placementJobs.seasonId,input.seasonId),isNull(placementJobs.archivedAt),
   input.jobId?eq(placementJobs.id,input.jobId):undefined));
 return new Map(rows.map(row=>[row.jobId,{
  companyId:row.companyId,workMode:row.workMode,
  payCategory:row.minCtc!==null||row.maxCtc!==null?"CTC_RECORDED":
   row.stipend!==null?"STIPEND_RECORDED":"NOT_RECORDED",
 }] as const));
}
