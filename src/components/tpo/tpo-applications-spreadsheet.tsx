"use client";
import Link from "next/link";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {applicantStage} from "@/modules/placements/tpo-applicant-pipeline-model";
import {tpoGridTimeLabel} from "@/modules/placements/tpo-grid-time-label";
import {TpoApplicantReviewDrawer} from "@/components/placements/tpo-applicant-review-drawer";
import {TpoSpreadsheetGrid} from "./tpo-spreadsheet-grid";
import {TpoGridFilterPanel,type TpoFilterField} from "./tpo-grid-filter-panel";

type Row={
 id:string;student:string|null;role:string;applicationStatus:string;screeningStatus:string|null;
 screeningUpdatedAt:string|null;eligibilityStatus:string;channel:string;submittedAt:string;flags:string[];
};
const columns:readonly TpoGridColumn<Row>[]=[
 {key:"student",label:"Student",read:r=>r.student??"Name unavailable"},
 {key:"role",label:"Role",read:r=>r.role},
 {key:"stage",label:"Stage",read:r=>applicantStage(r)},
 {key:"application",label:"Application",read:r=>r.applicationStatus},
 {key:"channel",label:"Channel",read:r=>r.channel},
 {key:"eligibility",label:"Eligibility evidence",read:r=>r.eligibilityStatus},
 {key:"flags",label:"Flags",read:r=>r.flags.length?r.flags.join(" · "):"None"},
 {key:"submitted",label:"Submitted (IST)",read:r=>tpoGridTimeLabel(r.submittedAt)},
 {key:"screening",label:"Screening",read:r=>r.screeningStatus??"Pending"},
 {key:"screeningUpdated",label:"Screening updated",read:r=>r.screeningUpdatedAt,exportOnly:true},
];
const filters:TpoFilterField[]=[
 {key:"stage",urlKey:"stage",allValue:"ALL",label:"Applicant stage",options:["SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"].map(value=>({value,label:value}))},
 {key:"channel",urlKey:"channel",allValue:"ALL",label:"Application channel",options:[{value:"INTERNAL",label:"Internal"},{value:"EXTERNAL",label:"External"}]},
 {key:"eligibility",urlKey:"eligibility",allValue:"ALL",label:"Eligibility evidence",options:[{value:"ELIGIBLE",label:"Eligible"},{value:"ELIGIBLE_WITH_MISSING_EVIDENCE",label:"Missing evidence"}]},
];
export function TpoApplicationsSpreadsheet({rows,jobId,jobStatus}:{rows:readonly Row[];jobId:string;jobStatus:string}){
 return <div className="space-y-3"><TpoGridFilterPanel fields={filters}/>
  <TpoSpreadsheetGrid rows={rows} columns={columns} rowKey={row=>row.id}
   rowActions={row=><div className="space-y-1">
    <TpoApplicantReviewDrawer jobId={jobId} jobStatus={jobStatus} app={row}/>
    <Link href={"/tpo/placements/jobs/"+jobId+"/applicants/"+row.id} className="inline-flex min-h-10 items-center text-primary-text underline">Open applicant</Link>
   </div>}/>
 </div>;
}
