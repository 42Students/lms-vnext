import {placementReportCsv} from "./report-model";
import {tpoApplicantPipelineParams} from "./tpo-applicant-pipeline-model";
export const tpoDriveApplicationsExportQuerySchema=tpoApplicantPipelineParams.omit({page:true});
/** Search text is literal, never an operator-controlled SQL wildcard. */
export function tpoApplicantExportSearchPattern(search:string){
 return "%"+search.replace(/[\\%_]/g,"\\$&")+"%";
}
export const TPO_DRIVE_APPLICATION_EXPORT_LIMIT=500;
/** Read stable chunks without imposing the preview cap on CSV downloads. */
export async function collectTpoExportPages<T>(
  readPage: (offset: number, limit: number) => Promise<T[]>,
  batchSize = 500,
): Promise<T[]> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5000)
    throw new Error("Invalid export batch size");
  const result: T[] = [];
  for (;;) {
    const page = await readPage(result.length, batchSize);
    if (page.length > batchSize) throw new Error("Export page exceeds request size");
    result.push(...page);
    if (page.length < batchSize) return result;
  }
}
export type TpoDriveApplicationExportFact={
 applicationId:string;studentName:string|null;roleTitle:string;
 status:string;screeningStatus:string|null;channel:string;submittedAt:string;rollNumber?:string|null;email?:string|null;phone?:string|null;
};
export function projectTpoDriveApplicationsExport(rows:readonly TpoDriveApplicationExportFact[],jobTitle:string,options:{exportAll?:boolean}={}){
 const truncated=!options.exportAll&&rows.length>TPO_DRIVE_APPLICATION_EXPORT_LIMIT;
 const displayed=options.exportAll?rows:rows.slice(0,TPO_DRIVE_APPLICATION_EXPORT_LIMIT);
 const data:(string|null)[][]=displayed.map(r=>[
  r.applicationId,r.studentName??"Name unavailable",r.roleTitle,
  r.status,r.screeningStatus??"Not recorded",r.channel,
  new Date(r.submittedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST",
  r.rollNumber??"Not recorded",r.email??"Not recorded",r.phone??"Not recorded",
 ]);
 if(truncated)data.push(["TRUNCATED",
  "First "+TPO_DRIVE_APPLICATION_EXPORT_LIMIT+" application rows are exported; further matching applications exist.",
  null,null,null,null,null,null,null,null]);
 return {rows:displayed,truncated,jobTitle,csv:placementReportCsv([
  "Application ID","Student","Role","Application status","Screening status","Channel","Submitted (IST)","Roll number","Email","Phone",
 ],data)};
}
