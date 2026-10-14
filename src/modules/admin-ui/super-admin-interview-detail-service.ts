import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementJobs,placementJobRounds} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {placementDateIst,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
export async function getSuperAdminInterviewDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  id:placementJobRounds.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  sequence:placementJobRounds.sequence,name:placementJobRounds.name,kind:placementJobRounds.kind,
  status:placementJobRounds.status,mode:placementJobRounds.mode,
  timezone:placementJobRounds.timezone,duration:placementJobRounds.durationMinutes,
  scheduledAt:placementJobRounds.scheduledAt,resultsDueAt:placementJobRounds.resultsDueAt,
  completedAt:placementJobRounds.completedAt,cancelledAt:placementJobRounds.cancelledAt,
 }).from(placementJobRounds)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementJobRounds.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(eq(placementJobRounds.id,id)).limit(1);
 if(!r)return null;
 return {title:r.name,subtitle:r.jobTitle+" · Round "+r.sequence,status:r.status,
  backHref:"/admin/placements/interviews",
  related:{href:"/admin/placements/jobs/"+encodeURIComponent(r.jobId),label:"Job"},
  facts:[{label:"Round ID",value:r.id},{label:"Kind",value:r.kind},{label:"Mode",value:r.mode??"Not scheduled"},
   {label:"Timezone",value:r.timezone??"Not recorded"},{label:"Scheduled (IST)",value:placementDateIst(r.scheduledAt)},
   {label:"Duration",value:r.duration===null?"Not recorded":r.duration+" minutes"},
   {label:"Results due",value:placementDateIst(r.resultsDueAt)},
   {label:"Completed",value:placementDateIst(r.completedAt)},
   {label:"Cancelled",value:placementDateIst(r.cancelledAt)}]};
}
