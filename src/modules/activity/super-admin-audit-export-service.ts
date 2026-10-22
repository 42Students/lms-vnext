import "server-only";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { listActivityEvents } from "./service";
import { buildSuperAdminAuditCsv, superAdminAuditExportSchema, SUPER_ADMIN_AUDIT_CSV_CAP,
  type SuperAdminAuditRow } from "./super-admin-audit-export-model";
/** Capped, scope-safe read. Scope comes from server context only, not URL. */
export async function exportSuperAdminActivity(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("activity.read");
 requirePermission(context,"activity.read",{
  ...(context.adminScope?.collegeId != null ? {collegeId:context.adminScope.collegeId} : {}),
  ...(context.adminScope?.organizationId != null ? {organizationId:context.adminScope.organizationId} : {}),
 });
 const query=superAdminAuditExportSchema.parse(raw);
 const rows:SuperAdminAuditRow[]=[];
 let cursor:{beforeOccurredAt:Date;beforeId:string}|null=null;
 let truncated=false;
 for(let page=0;page<10;page++){
  const response=await listActivityEvents(context,{...query,...(cursor??{}),limit:100});
  for(const item of response.items){
   rows.push({occurredAt:item.event.occurredAt,module:item.event.module,
    importance:item.event.importance,eventType:item.event.eventType,
    subjectType:item.event.subjectType,subjectId:item.event.subjectId,
    subjectLabel:item.event.subjectLabel,summary:item.event.summary,
    actorName:item.actor?.displayName??null});
  }
  if(!response.nextCursor)break;
  if(rows.length>=SUPER_ADMIN_AUDIT_CSV_CAP){truncated=true;break;}
  cursor=response.nextCursor;
 }
 return {csv:buildSuperAdminAuditCsv(rows.slice(0,SUPER_ADMIN_AUDIT_CSV_CAP),truncated),
  cap:SUPER_ADMIN_AUDIT_CSV_CAP,exported:Math.min(rows.length,SUPER_ADMIN_AUDIT_CSV_CAP),truncated};
}
