"use client";

import Link from "next/link";
import {TpoGrid} from "@/components/tpo/grid/tpo-grid";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";

/**
 * The parent recruiter results editor supplies only server-authorized applicants.
 * This is a read-only summary of local/staged drafts, never an edit or publish API.
 */
export type RecruiterResultReviewRow={
 id:string;
 applicant:string;
 email:string;
 outcome:string;
 score:number|null;
 waitlistRank:number|null;
 resultStatus:string;
 editHref:string;
};

const columns:readonly TpoGridColumn<RecruiterResultReviewRow>[]=[
 {key:"applicant",label:"Candidate",read:row=>row.applicant},
 {key:"email",label:"Contact",read:row=>row.email},
 {key:"outcome",label:"Outcome",read:row=>row.outcome},
 {key:"score",label:"Score %",read:row=>row.score,sortKind:"number",sortValue:row=>row.score},
 {key:"waitlist",label:"Waitlist #",read:row=>row.waitlistRank,
  sortKind:"number",sortValue:row=>row.waitlistRank},
 {key:"status",label:"Result status",read:row=>row.resultStatus},
];

export function RecruiterResultReviewGrid({rows,scopeKey}:{
 rows:readonly RecruiterResultReviewRow[];
 scopeKey:string;
}){
 return <TpoGrid<RecruiterResultReviewRow>
   rows={rows} columns={columns} rowKey={row=>row.id}
   mobilePrimaryKeys={["applicant","outcome","status","score"]}
   storageKey={"recruiter-result-review:"+scopeKey}
   rowActions={row=><Link href={row.editHref}
    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
    Review row
   </Link>}
 />;
}
