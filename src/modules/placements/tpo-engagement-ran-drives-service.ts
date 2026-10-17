import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementJobRounds,placementCompanyRelationships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePlacementManageScope} from "./scope";
/** Only a COMPLETED persisted round is proof that a drive ran.
 * Counts distinct drives, never rounds, across exactly the authorized report scope.
 */
export async function getTpoRecordedRanDrives(context:RequestContext,input:{
 collegeId:string;seasonId:string|null;jobId:string|null;
}):Promise<Map<string,number>>{
 await requirePlacementManageScope(context,input.collegeId);
 if(!input.seasonId)return new Map();
 const rows=await getDb().select({
  companyId:placementCompanyRelationships.companyId,
  count:sql<number>`count(distinct ${placementJobs.id})::integer`,
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,input.collegeId),
  ))
  .innerJoin(placementJobRounds,and(
   eq(placementJobRounds.jobId,placementJobs.id),
   eq(placementJobRounds.status,"COMPLETED"),
  ))
  .where(and(eq(placementJobs.collegeId,input.collegeId),
   eq(placementJobs.seasonId,input.seasonId),isNull(placementJobs.archivedAt),
   input.jobId?eq(placementJobs.id,input.jobId):undefined))
  .groupBy(placementCompanyRelationships.companyId);
 return new Map(rows.map(row=>[row.companyId,row.count]));
}
