import { z } from "zod";
import { adminAuditTextFilterSchema } from "./admin-audit-search-model";
import { ACTIVITY_IMPORTANCE, ACTIVITY_MODULES } from "./taxonomy";
import { escapeActivityCsvCell } from "./college-activity-export-model";
export const SUPER_ADMIN_AUDIT_CSV_CAP = 1000;
export const superAdminAuditExportSchema=z.object({
 ...adminAuditTextFilterSchema.shape,
 module:z.enum(ACTIVITY_MODULES).optional(),
 importance:z.enum(ACTIVITY_IMPORTANCE).optional(),
 actorUserId:z.string().uuid().optional(),
 collegeId:z.string().uuid().optional(),
 subjectId:z.string().trim().min(1).max(500).optional(),
 eventType:z.string().trim().min(1).max(120).optional(),
 subjectType:z.string().trim().min(1).max(80).optional(),
 from:z.string().min(1).max(40).optional(),
 to:z.string().min(1).max(40).optional(),
}).strict();
export type SuperAdminAuditRow={
 occurredAt:Date;module:string;importance:string;eventType:string;
 subjectType:string;subjectId:string;subjectLabel:string|null;
 summary:string;actorName:string|null;
};
/** Every text column is formula-neutralized, including export footer. No contact fields. */
export function buildSuperAdminAuditCsv(rows:readonly SuperAdminAuditRow[],truncated:boolean) {
 const header=["Occurred At (IST)","Module","Importance","Event Type",
  "Subject Type","Subject ID","Subject Label","Summary","Actor Name"];
 const fmt=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",
 });
 const lines=[header.map(escapeActivityCsvCell).join(",")];
 for(const row of rows)lines.push([
  fmt.format(row.occurredAt)+" IST",row.module,row.importance,row.eventType,
  row.subjectType,row.subjectId,row.subjectLabel??"",row.summary,row.actorName??"",
 ].map(escapeActivityCsvCell).join(","));
 if(truncated)lines.push(["EXPORT TRUNCATED","","","","","","",
  "Only the latest "+SUPER_ADMIN_AUDIT_CSV_CAP+" events were exported. Narrow filters for older records.",""]
  .map(escapeActivityCsvCell).join(","));
 return "\ufeff"+lines.join("\r\n");
}
