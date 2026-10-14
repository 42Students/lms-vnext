import {z} from "zod";
import {placementReportCsv} from "./report-model";
export const tpoDriveApplicationsExportQuerySchema=z.object({jobId:z.string().uuid()}).strict();
export const TPO_DRIVE_APPLICATION_EXPORT_LIMIT=500;
export type TpoDriveApplicationExportFact={
 applicationId:string;studentName:string|null;roleTitle:string;
 status:string;screeningStatus:string|null;channel:string;submittedAt:string;
};
export function projectTpoDriveApplicationsExport(rows:readonly TpoDriveApplicationExportFact[],jobTitle:string){
 const truncated=rows.length>TPO_DRIVE_APPLICATION_EXPORT_LIMIT;
 const displayed=rows.slice(0,TPO_DRIVE_APPLICATION_EXPORT_LIMIT);
 const data:(string|null)[][]=displayed.map(r=>[
  r.applicationId,r.studentName??"Name unavailable",r.roleTitle,
  r.status,r.screeningStatus??"Not recorded",r.channel,r.submittedAt,
 ]);
 if(truncated)data.push(["TRUNCATED",
  "First "+TPO_DRIVE_APPLICATION_EXPORT_LIMIT+" application rows are exported; further matching applications exist.",
  null,null,null,null,null]);
 return {rows:displayed,truncated,jobTitle,csv:placementReportCsv([
  "Application ID","Student","Role","Application status","Screening status","Channel","Submitted (UTC)",
 ],data)};
}
