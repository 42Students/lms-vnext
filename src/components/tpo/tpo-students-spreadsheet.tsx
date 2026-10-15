"use client";
import Link from "next/link";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {TpoSpreadsheetGrid} from "./tpo-spreadsheet-grid";
import {TpoGridFilterPanel,type TpoFilterField} from "./tpo-grid-filter-panel";

const columns:readonly TpoGridColumn<TpoStudentRow>[]=[
 {key:"student",label:"Student",read:row=>row.displayName},
 {key:"number",label:"Student number",read:row=>row.rollNumber??row.registrationNumber},
 {key:"branch",label:"Branch",read:row=>row.branchName},
 {key:"batch",label:"Batch",read:row=>row.cohortName},
 {key:"cgpa",label:"CGPA",read:row=>row.cgpa},
 {key:"backlogs",label:"Active backlogs",read:row=>row.activeBacklogs},
 {key:"readiness",label:"Readiness evidence",read:row=>row.readinessSignal.replaceAll("_"," ")},
 {key:"registration",label:"Placement registration",read:row=>row.registrationChoice??"Not registered"},
 {key:"participation",label:"Participation",read:row=>row.participationStatus.replaceAll("_"," ")},
 {key:"best",label:"Best so far",read:row=>row.bestSoFar},
 {key:"applications",label:"Applications",read:row=>row.applicationCount},
 {key:"offers",label:"Offers",read:row=>row.offerCount},
 {key:"journey",label:"Journey",read:row=>row.journeyState.replaceAll("_"," ")},
 {key:"email",label:"Email (export only)",read:row=>row.email,exportOnly:true},
];
const journeys=[
 {value:"NOT_REGISTERED",label:"Not registered"},
 {value:"NEEDS_READINESS_SUPPORT",label:"Needs readiness support"},
 {value:"READY_NOT_APPLYING",label:"Ready to apply"},
 {value:"APPLYING",label:"Applying"},
 {value:"PLACED",label:"Placed"},
];
export function TpoStudentsSpreadsheet({rows,branches}:{rows:readonly TpoStudentRow[];branches:readonly {branchId:string;branchName:string}[]}){
 const filters:TpoFilterField[]=[
  {key:"journeyState",urlKey:"journeyState",label:"Student journey",options:journeys},
  {key:"branchId",urlKey:"branchId",label:"Academic branch",options:branches.map(b=>({value:b.branchId,label:b.branchName}))},
 ];
 return <div className="space-y-3"><TpoGridFilterPanel fields={filters}/>
  <TpoSpreadsheetGrid rows={rows} columns={columns} rowKey={row=>row.membershipId}
   rowActions={row=><div className="flex flex-col items-start gap-1">
    <Link href={"/tpo/students/"+encodeURIComponent(row.membershipId)+"/history"} className="min-h-10 text-primary-text underline">Placement history</Link>
    <Link href={"/tpo/students/"+encodeURIComponent(row.membershipId)+"/participation"} className="min-h-10 text-primary-text underline">Change participation</Link>
   </div>}/>
 </div>;
}
