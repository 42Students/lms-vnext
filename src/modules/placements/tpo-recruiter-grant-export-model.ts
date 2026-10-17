import {placementReportCsv} from "./report-model";
import type {TpoRecruiterGrantView,TpoRecruiterAccessQuery} from "./tpo-recruiter-access-model";
export function tpoRecruiterGrantCsv(rows:readonly TpoRecruiterGrantView[],truncated:boolean){
 const values:(string|null)[][]=rows.map(row=>[
  row.displayName,row.companyName,row.status,row.verificationStatus,row.validUntilDate,
  row.capabilities.join(" | "),row.grantedDate,row.revokedDate,
 ]);
 if(truncated)values.unshift(["NOTICE","Only the first 500 matching grant records are included",null,null,null,null,null,null]);
 return placementReportCsv(["Recruiter","Company","Grant status","Verification","Valid through (IST)","Access capabilities","Granted (IST)","Revoked (IST)"],values);
}
export function tpoRecruiterGrantExportHref(filters:Pick<TpoRecruiterAccessQuery,"status"|"q">){
 const qs=new URLSearchParams();
 if(filters.status!=="ALL")qs.set("status",filters.status);
 if(filters.q)qs.set("q",filters.q);
 const suffix=qs.toString();
 return "/api/placements/tpo/settings/recruiter-grants/export"+(suffix?"?"+suffix:"");
}
