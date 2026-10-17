import "server-only";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {listTpoCalendarRoundChoices} from "./tpo-round-calendar-service";
import {projectTpoInterviewReadiness,tpoInterviewWindowSchema} from "./tpo-interview-readiness-model";
import {z} from "zod";
/** Interview-only operational view of round schedule evidence. No candidate slots inferred. */
export async function getTpoInterviewReadiness(context:RequestContext,raw:unknown,now=new Date()){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||
   member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
   throw new AuthorizationError("placements.manage");
 const collegeId=member.collegeId;
 if(!can(context,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 const {days,page,q}=tpoInterviewWindowSchema.extend({
  page:z.coerce.number().int().min(1).max(10000).default(1),
  q:z.string().trim().max(100).default(""),
 }).parse(raw);
 await requirePlacementManageScope(context,collegeId);
 const available=await listTpoCalendarRoundChoices(context,{page,q,kind:"INTERVIEW"});
 const result=projectTpoInterviewReadiness(available.rows.map(r=>({
  id:r.id,jobId:r.jobId,jobTitle:r.jobTitle,companyName:r.companyName,
  name:r.name,kind:r.kind,status:r.status,mode:r.mode,venue:r.venue,
  scheduledAt:r.scheduledAt?.toISOString()??null,durationMinutes:r.durationMinutes,
  updatedAt:r.updatedAt.toISOString(),meetingUrl:r.meetingUrl,
 })),now.toISOString(),days);
 return {...result,days,asOf:now.toISOString(),limited:available.limited,page,q};
}
