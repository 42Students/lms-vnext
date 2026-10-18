import {placementReportCsv} from "./report-model";
import {recruiterLeadsXlsx} from "./tpo-recruiter-xlsx-export";
import type {TpoRecruiterGrantView,TpoRecruiterAccessQuery} from "./tpo-recruiter-access-model";

export const TPO_RECRUITER_GRANT_EXPORT_HEADERS=[
 "Recruiter","Company","Grant status","Verification","Valid through (IST)",
 "Access capabilities","Granted (IST)","Revoked (IST)",
] as const;

/** Keep filtered Excel and CSV exports on one safe, bounded, privacy-preserving projection. */
export function tpoRecruiterGrantExportRows(rows:readonly TpoRecruiterGrantView[],truncated:boolean):string[][]{
 const values=rows.map(row=>[
  row.displayName,row.companyName,row.status,row.verificationStatus,row.validUntilDate??"",
  row.capabilities.join(" | "),row.grantedDate,row.revokedDate??"",
 ]);
 if(truncated)values.unshift(["NOTICE","Only the first 500 matching grant records are included","","","","","",""]);
 return values;
}
export function tpoRecruiterGrantCsv(rows:readonly TpoRecruiterGrantView[],truncated:boolean){
 return placementReportCsv(TPO_RECRUITER_GRANT_EXPORT_HEADERS,tpoRecruiterGrantExportRows(rows,truncated));
}
export function tpoRecruiterGrantXlsx(rows:readonly TpoRecruiterGrantView[],truncated:boolean){
 return recruiterLeadsXlsx(TPO_RECRUITER_GRANT_EXPORT_HEADERS,tpoRecruiterGrantExportRows(rows,truncated));
}
export function tpoRecruiterGrantExportHref(filters:Pick<TpoRecruiterAccessQuery,"status"|"q">,format:"csv"|"xlsx"="csv"){
 const qs=new URLSearchParams();
 if(filters.status!=="ALL")qs.set("status",filters.status);
 if(filters.q)qs.set("q",filters.q);
 if(format==="xlsx")qs.set("format","xlsx");
 const suffix=qs.toString();
 return "/api/placements/tpo/settings/recruiter-grants/export"+(suffix?"?"+suffix:"");
}
