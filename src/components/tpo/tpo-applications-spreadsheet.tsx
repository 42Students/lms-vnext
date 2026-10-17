"use client";
import Link from "next/link";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {applicantStage} from "@/modules/placements/tpo-applicant-pipeline-model";
import {tpoGridTimeLabel} from "@/modules/placements/tpo-grid-time-label";
import {TpoApplicantReviewDrawer} from "@/components/placements/tpo-applicant-review-drawer";
import {TpoSpreadsheetGrid} from "./tpo-spreadsheet-grid";
import {TpoGridFilterPanel,type TpoFilterField} from "./tpo-grid-filter-panel";

type Row={
 id:string;student:string|null;role:string;rollNumber:string|null;email:string|null;phone:string|null;batchName:string|null;branchName:string|null;cgpaHundredths:number|null;activeBacklogs:number|null;pastBacklogs:number|null;tenthPctBasisPoints:number|null;twelfthPctBasisPoints:number|null;lastRound:string|null;lastResult:string|null;applicationStatus:string;screeningStatus:string|null;
 screeningUpdatedAt:string|null;eligibilityStatus:string;channel:string;submittedAt:string;flags:string[];
};
const columns:readonly TpoGridColumn<Row>[]=[
 {key:"student",label:"Student",read:r=>r.student??"Name unavailable"},
 {key:"role",label:"Role",read:r=>r.role},
 {key:"roll",label:"Roll number",read:r=>r.rollNumber??"Not recorded"},
 {key:"email",label:"Email",read:r=>r.email??"Not recorded"},
 {key:"phone",label:"Phone",read:r=>r.phone??"Not recorded"},
 {key:"batch",label:"Batch",read:r=>r.batchName??"Not recorded"},
 {key:"branch",label:"Branch",read:r=>r.branchName??"Not recorded"},
 {key:"cgpa",label:"CGPA",read:r=>r.cgpaHundredths===null?"Not recorded":(r.cgpaHundredths/100).toFixed(2)},
 {key:"activeBacklogs",label:"Active backlogs",read:r=>r.activeBacklogs===null?"Not recorded":String(r.activeBacklogs)},
 {key:"pastBacklogs",label:"Past backlogs",read:r=>r.pastBacklogs===null?"Not recorded":String(r.pastBacklogs)},
 {key:"tenth",label:"10th %",read:r=>r.tenthPctBasisPoints===null?"Not recorded":(r.tenthPctBasisPoints/100).toFixed(2)+"%"},
 {key:"twelfth",label:"12th %",read:r=>r.twelfthPctBasisPoints===null?"Not recorded":(r.twelfthPctBasisPoints/100).toFixed(2)+"%"},
 {key:"lastRound",label:"Last assessed round",read:r=>r.lastRound??"Not recorded"},
 {key:"lastResult",label:"Last applied result",read:r=>r.lastResult??"Not recorded"},
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
