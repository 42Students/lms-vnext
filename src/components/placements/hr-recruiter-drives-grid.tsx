"use client";

import Link from "next/link";
import {TpoGrid} from "@/components/tpo/grid/tpo-grid";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";

/** A page-scoped, employer-authorized projection of the server's drive results.
 * No client-side fetching, mutation, or broadening of the employer/college scope. */
export type HrRecruiterDriveSheetRow={
 id:string;
 title:string;
 jobType:string;
 pay:string;
 sharedApplicants:number;
 offers:number;
 applicantsHref:string;
 offersHref:string;
 requestsHref:string;
 deadlineLabel:string;
 status:string;
 nextStep:string;
 company:string;
 college:string;
 openHref:string;
 hireAgainHref:string;
 hireAgainLabel:string;
 messagesHref:string;
 unansweredRequests:number;
};

const columns:readonly TpoGridColumn<HrRecruiterDriveSheetRow>[]=[
 {key:"drive",label:"Drive",read:row=>row.title,
  tooltip:row=>row.company+" · "+row.college},
 {key:"jobType",label:"Job type",read:row=>row.jobType},
 {key:"pay",label:"Pay",read:row=>row.pay},
 {key:"applied",label:"Shared applicants",read:row=>row.sharedApplicants,
  sortKind:"number",sortValue:row=>row.sharedApplicants},
 {key:"offers",label:"Offers",read:row=>row.offers,
  sortKind:"number",sortValue:row=>row.offers},
 {key:"deadline",label:"Deadline",read:row=>row.deadlineLabel},
 {key:"status",label:"Status",read:row=>row.status},
 {key:"next",label:"Next",read:row=>row.nextStep},
];

export function HrRecruiterDrivesGrid({rows,scopeKey}:{
 rows:readonly HrRecruiterDriveSheetRow[];
 /** Both user and college are required to isolate saved grid preferences. */
 scopeKey:string;
}){
 return <TpoGrid<HrRecruiterDriveSheetRow>
  rows={rows} rowKey={row=>row.id} columns={columns}
  storageKey={"hr-recruiter-drives:"+scopeKey}
  mobilePrimaryKeys={["drive","jobType","status","deadline"]}
  rowActions={row=><div className="flex flex-wrap items-center gap-2">
   <Link href={row.applicantsHref} className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    {row.sharedApplicants} shared applicants
   </Link>
   <Link href={row.offersHref} className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    {row.offers} offers
   </Link>
   {row.unansweredRequests>0?<Link href={row.requestsHref} className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Answer {row.unansweredRequests} open {row.unansweredRequests===1?"request":"requests"}
   </Link>:null}
   <Link href={row.openHref} className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Open hiring flow
   </Link>
   <Link href={row.hireAgainHref} className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    {row.hireAgainLabel}
   </Link>
   <Link href={row.messagesHref} className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Answer
   </Link>
  </div>}
 />;
}
