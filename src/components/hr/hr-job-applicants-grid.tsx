"use client";

import Link from "next/link";
import {TpoGrid} from "@/components/tpo/grid/tpo-grid";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";

/** Only the recruiter-shared, server-paginated applicant projection can enter the sheet. */
export type HrJobApplicantSheetRow={
 id:string;
 name:string;
 role:string;
 rollNumber:string|null;
 branch:string|null;
 ugPercentage:string|null;
 tenthPercentage:string|null;
 twelfthOrDiplomaPercentage:string|null;
 status:string;
 screening:string;
 applied:string;
 reviewHref:string;
};

const columns:readonly TpoGridColumn<HrJobApplicantSheetRow>[]=[
 {key:"applicant",label:"Name",read:row=>row.name},
 {key:"screening",label:"Stage",read:row=>row.screening},
 {key:"role",label:"Role",read:row=>row.role},
 {key:"roll",label:"Roll no.",read:row=>row.rollNumber},
 {key:"branch",label:"Branch",read:row=>row.branch},
 {key:"ug",label:"UG %",read:row=>row.ugPercentage,
  sortKind:"number",sortValue:row=>row.ugPercentage===null?null:Number(row.ugPercentage)},
 {key:"tenth",label:"10th %",read:row=>row.tenthPercentage,
  sortKind:"number",sortValue:row=>row.tenthPercentage===null?null:Number(row.tenthPercentage)},
 {key:"twelfth",label:"12th / diploma %",read:row=>row.twelfthOrDiplomaPercentage,
  sortKind:"number",sortValue:row=>row.twelfthOrDiplomaPercentage===null?null:Number(row.twelfthOrDiplomaPercentage)},
 {key:"application",label:"Application",read:row=>row.status},
 {key:"applied",label:"Applied",read:row=>row.applied,
  sortKind:"date"},
];

export function HrJobApplicantsGrid({rows,scopeKey}:{
 rows:readonly HrJobApplicantSheetRow[];
 /** User/drive/stage isolation for column memory; never cache applicant records. */
 scopeKey:string;
}){
 // Legacy shows Name / Stage first, followed only by shared fields that
 // have at least one recorded value in this authorized server projection.
 const valueKeys:Record<string,keyof HrJobApplicantSheetRow>={
  role:"role",roll:"rollNumber",branch:"branch",ug:"ugPercentage",
  tenth:"tenthPercentage",twelfth:"twelfthOrDiplomaPercentage",
  application:"status",applied:"applied",
 };
 const visibleColumns=columns.filter(column=>
  column.key==="applicant"||column.key==="screening"||
  rows.some(row=>{
   const key=valueKeys[column.key];
   return key!==undefined&&row[key]!==null&&row[key]!==undefined&&String(row[key]).trim()!=="";
  }));
 return <TpoGrid<HrJobApplicantSheetRow>
  rows={rows} rowKey={row=>row.id} columns={visibleColumns}
  storageKey={"hr-shared-applicants:"+scopeKey}
  mobilePrimaryKeys={["applicant","screening","role","application"]}
  rowActions={row=><Link href={row.reviewHref}
   className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
   Review applicant
  </Link>}
 />;
}
