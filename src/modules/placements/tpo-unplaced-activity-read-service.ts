import "server-only";
import {and,eq,max,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePlacementManageScope} from "./scope";
/** Actual latest submitted application in a selected season/drive, not a guessed timestamp. */
export async function getTpoUnplacedLastApplications(context:RequestContext,input:{
 collegeId:string;seasonId:string|null;jobId:string|null;
}):Promise<Map<string,{lastSubmittedAt:Date|null;applications:number;stillInDrive:boolean}>>{
 await requirePlacementManageScope(context,input.collegeId);
 if(!input.seasonId)return new Map();
 const rows=await getDb().select({
  membershipId:placementApplications.membershipId,lastSubmittedAt:max(placementApplications.submittedAt),
  applications:sql<number>`count(distinct ${placementApplications.id})::integer`,
  openApplications:sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementApplications.status}='SUBMITTED')::integer`,
 }).from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .where(and(eq(placementJobs.collegeId,input.collegeId),
   eq(placementJobs.seasonId,input.seasonId),eq(collegeMemberships.collegeId,input.collegeId),
   input.jobId?eq(placementJobs.id,input.jobId):undefined))
  .groupBy(placementApplications.membershipId);
 return new Map(rows.map(row=>[row.membershipId,{
  lastSubmittedAt:row.lastSubmittedAt,applications:row.applications,
  stillInDrive:row.openApplications>0,
 }] as const));
}
