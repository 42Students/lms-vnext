import {placementReportCsv} from "./report-model";
import {applicantStage,tpoApplicantPipelineParams} from "./tpo-applicant-pipeline-model";
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
 status:string;screeningStatus:string|null;screeningUpdatedAt:string|null;eligibilityStatus:string;channel:string;submittedAt:string;rollNumber?:string|null;email?:string|null;phone?:string|null;
 batchName?:string|null;branchName?:string|null;academicYear?:string|null;
 pendingWithdrawal?:boolean;noShow?:boolean;placedElsewhere?:boolean;addedByCollege?:boolean;
};
export function projectTpoDriveApplicationsExport(rows:readonly TpoDriveApplicationExportFact[],jobTitle:string,options:{exportAll?:boolean}={}){
 const truncated=!options.exportAll&&rows.length>TPO_DRIVE_APPLICATION_EXPORT_LIMIT;
 const displayed=options.exportAll?rows:rows.slice(0,TPO_DRIVE_APPLICATION_EXPORT_LIMIT);
 const data:(string|null)[][]=displayed.map(r=>[
  r.applicationId,r.studentName??"Name unavailable",r.roleTitle,
  applicantStage({id:r.applicationId,student:r.studentName,role:r.roleTitle,applicationStatus:r.status,screeningStatus:r.screeningStatus,submittedAt:r.submittedAt}),
  r.status,r.screeningStatus??"Not recorded",r.eligibilityStatus,r.channel,
  new Date(r.submittedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST",
  r.screeningUpdatedAt?new Date(r.screeningUpdatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" IST":"Not recorded",
  r.rollNumber??"Not recorded",r.email??"Not recorded",r.phone??"Not recorded",
  r.batchName??"Not recorded",r.branchName??"Not recorded",r.academicYear??"Not recorded",
  r.pendingWithdrawal?"Yes":"No",r.noShow?"Yes":"No",
  r.placedElsewhere?"Yes":"No",r.addedByCollege?"Yes":"No",
 ]);
 if(truncated)data.push(["TRUNCATED",
  "First "+TPO_DRIVE_APPLICATION_EXPORT_LIMIT+" application rows are shown; further matching applications exist.",
  ...Array.from({length:18},()=>null)]);
 return {rows:displayed,truncated,jobTitle,csv:placementReportCsv([
  "Application ID","Student","Role","Stage","Application status","Screening status","Eligibility evidence","Channel","Submitted (IST)","Screening updated (IST)","Roll number","Email","Phone","Batch","Branch","Academic year",
  "Withdrawal requested","No-show","Accepted offer elsewhere","Added by college",
 ],data)};
}
