import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementApplications, placementApplicationScreenings, placementJobs } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoJobActor, requireTpoJobCollege } from "./tpo-job-write-base";
import { getTpoLearnerParticipation } from "./tpo-participation-service";
import { tpoBulkPreviewRequestSchema, selectedBulkActionRows,
  type TpoBulkPreviewRequest } from "./tpo-bulk-workflow-model";
import { signTpoBulkPreview } from "./tpo-bulk-preview-token";
import { getAuthConfig } from "@/modules/auth/config";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import type { TpoMembershipDecisionSnapshot } from "./tpo-participation-model";

export type TpoBulkCurrent={version:string;ready:boolean};
export function tpoBulkStudentVersion(snapshot:TpoMembershipDecisionSnapshot){
  return createHash("sha256").update(JSON.stringify([
    snapshot.status,snapshot.reason,snapshot.note,snapshot.updatedAt,
  ])).digest("hex");
}
export function tpoBulkStudentReady(action:TpoBulkPreviewRequest["action"],
  status:TpoMembershipDecisionSnapshot["status"]){
  return action==="ELIGIBLE"?status!=="ELIGIBLE":
    action==="CLEAR_OVERRIDE"?status!==null:false;
}
export function tpoBulkApplicationReady(action:TpoBulkPreviewRequest["action"],
  jobStatus:string,applicationStatus:string,screeningStatus:string|null,updatedAt:Date|null){
  return (action==="SHORTLISTED"||action==="REJECTED")&&jobStatus==="PUBLISHED"&&
    applicationStatus==="SUBMITTED"&&(screeningStatus==="PENDING"||screeningStatus==="HOLD")&&
    updatedAt!==null;
}

/** Read only; only current college-scoped records are projected, never person names. */
export async function loadTpoBulkCurrent(context:RequestContext,plan:TpoBulkPreviewRequest){
 const collegeId=await requireTpoJobCollege(context);
 await getDb().transaction(async tx=>requireTpoJobActor(tx,context),{accessMode:"read only"});
 const current=new Map<string,TpoBulkCurrent>();
 if(plan.target==="STUDENTS"){
   for(const id of plan.ids){
     try {
       const record=await getTpoLearnerParticipation(context,id);
       current.set(id,{version:tpoBulkStudentVersion(record.direct),
         ready:tpoBulkStudentReady(plan.action,record.direct.status)});
     } catch(error) {
       if(!(error instanceof AuthorizationError))throw error;
     }
   }
 } else {
   const records=await getDb().select({
     id:placementApplications.id,
     jobStatus:placementJobs.status,
     applicationStatus:placementApplications.status,
     screeningStatus:placementApplicationScreenings.status,
     updatedAt:placementApplicationScreenings.updatedAt,
   }).from(placementApplications)
     .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
     .leftJoin(placementApplicationScreenings,
       eq(placementApplicationScreenings.applicationId,placementApplications.id))
     .where(and(eq(placementJobs.collegeId,collegeId),
       eq(placementJobs.id,plan.jobId!),inArray(placementApplications.id,plan.ids)));
   for(const row of records)current.set(row.id,{
     version:row.updatedAt?.toISOString()??"unavailable",
     ready:tpoBulkApplicationReady(plan.action,row.jobStatus,row.applicationStatus,
       row.screeningStatus,row.updatedAt),
   });
 }
 return current;
}
export async function previewTpoBulkAction(context:RequestContext,raw:unknown){
 const plan=tpoBulkPreviewRequestSchema.parse(raw);
 const current=await loadTpoBulkCurrent(context,plan);
 const rows=selectedBulkActionRows(plan.ids,current);
 const selections=rows.map(row=>({id:row.id,version:row.version}));
 const actor=context.user.id+":"+(context.membership?.id??"");
 const previewToken=signTpoBulkPreview(getAuthConfig().secret,actor,plan,selections);
 return {rows,previewToken,counts:{ready:rows.filter(r=>r.status==="ready").length,
   skipped:rows.filter(r=>r.status==="skipped").length}};
}
