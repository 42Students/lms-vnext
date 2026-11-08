import { spreadsheetCsvCell } from "@/security/csv-cell";
import type {RecruiterReportRow} from "./recruiter-company-reports-model";
export const HR_REPORT_EXPORT_CAP=200;
function csvCell(v:string){
 return spreadsheetCsvCell(v);
}
export function buildHrCompanyReportCsv(rows:readonly RecruiterReportRow[],total:number){
 const output=[["Drive","Status","Applied","Submitted","Withdrawn","Issued","Accepted",
 "Declined","Joined"].map(csvCell).join(",")];
 for(const row of rows.slice(0,HR_REPORT_EXPORT_CAP)){
  output.push([row.title,row.status,row.applications,row.submittedApplications,
   row.withdrawnApplications,row.outstandingOffers,row.acceptedOffers,
   row.declinedOffers,row.joinedOffers].map(x=>csvCell(String(x))).join(","));
 }
 const exported=Math.min(rows.length,HR_REPORT_EXPORT_CAP);
 const authorizedTotal=Number.isSafeInteger(total)&&total>=0?total:exported;
 const omitted=Math.max(0,authorizedTotal-exported);
 if(omitted)output.push(["Export capped",omitted+" additional drives","","","","","","",""]
  .map(csvCell).join(","));
 return {csv:"\uFEFF"+output.join("\r\n")+"\r\n",exported,omitted};
}
