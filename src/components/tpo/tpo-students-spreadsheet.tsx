"use client";
import Link from "next/link";
import {useState} from "react";
import {TpoStudentNoteEditor} from "./tpo-student-note-editor";
import {TpoStudentOutcomePill} from "./tpo-student-outcome-pill";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {TpoStudentQuickPanel} from "./tpo-student-quick-panel";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {TpoSpreadsheetGrid} from "./tpo-spreadsheet-grid";
import {TpoGridFilterPanel,type TpoFilterField} from "./tpo-grid-filter-panel";
import {TpoAfterCollegeEditor} from "./tpo-after-college-editor";
import { TpoAfterCollegeBulkEditor } from "./tpo-after-college-bulk-editor";
import type {AfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";

const columns:readonly TpoGridColumn<TpoStudentRow>[]=[
 {key:"student",label:"Student",read:row=>row.fromFinishedBatch?
   row.displayName+" · From "+row.cohortName:row.displayName},
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
export function TpoStudentsSpreadsheet({rows,branches,afterCollege,afterCollegeAvailable}:{rows:readonly TpoStudentRow[];branches:readonly {branchId:string;branchName:string}[];
 afterCollege:Record<string,{outcome:AfterCollegeOutcome;expectedVersion:string}>;afterCollegeAvailable:boolean}){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const selected=params.get("student");
 const [noteSelection,setNoteSelection]=useState<string[]>([]);
 const active=rows.find(row=>row.membershipId===selected)??null;
 const open=(id:string|null)=>{const q=new URLSearchParams(params.toString());if(id)q.set("student",id);else q.delete("student");router.replace(pathname+(q.size?"?"+q.toString():""),{scroll:false});};
 const filters:TpoFilterField[]=[
  {key:"journeyState",urlKey:"journeyState",label:"Student journey",options:journeys},
  {key:"branchId",urlKey:"branchId",label:"Academic branch",options:branches.map(b=>({value:b.branchId,label:b.branchName}))},
 ];
 return <div className="space-y-3">
  <TpoAfterCollegeBulkEditor rows={rows} current={afterCollege} available={afterCollegeAvailable} />
  <details className="rounded-xl border border-border p-4">
   <summary className="cursor-pointer font-semibold">Bulk Add a note</summary>
   <p className="mt-2 text-xs text-muted-foreground">Choose up to 100 students on this visible roster page; no student is added outside your current filtered page.</p>
   <label className="mt-3 flex min-h-10 items-center gap-2 text-sm"><input type="checkbox"
     checked={rows.length>0&&rows.every(r=>noteSelection.includes(r.membershipId))}
     onChange={e=>setNoteSelection(e.target.checked?rows.slice(0,100).map(r=>r.membershipId):[])} />Select visible page</label>
   <div className="my-3 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
    {rows.map(row=><label className="flex gap-2 text-sm" key={row.membershipId}>
     <input type="checkbox" checked={noteSelection.includes(row.membershipId)}
       disabled={!noteSelection.includes(row.membershipId)&&noteSelection.length>=100}
       onChange={e=>setNoteSelection(ids=>e.target.checked?[...ids,row.membershipId]:ids.filter(id=>id!==row.membershipId))}/>
     {row.displayName}</label>)}
   </div>
   <p className="text-sm">{noteSelection.length} selected</p>
   <TpoStudentNoteEditor membershipIds={noteSelection} afterSave={()=>setNoteSelection([])}/>
  </details>
  <TpoGridFilterPanel fields={filters}/>
  <TpoSpreadsheetGrid rows={rows} columns={columns} rowKey={row=>row.membershipId}
   rowActions={row=><div className="flex flex-col items-start gap-1">
    <button type="button" className="min-h-10 text-primary-text underline"
      onClick={()=>open(row.membershipId)} aria-label={"Open student panel for "+row.displayName}>
      Open student panel
    </button>
    <TpoStudentOutcomePill recorded={afterCollege[row.membershipId]?.outcome??null}
      placed={row.placed} registered={row.registeredForPlacements}/>
    <TpoAfterCollegeEditor membershipId={row.membershipId} learnerName={row.displayName}
      initial={afterCollege[row.membershipId]??{outcome:"NOT_DECIDED",expectedVersion:"none"}}
      available={afterCollegeAvailable} />
    <Link href={"/tpo/students/"+encodeURIComponent(row.membershipId)+"/history"}
      aria-label={"Placement history for "+row.displayName} className="min-h-10 text-primary-text underline">Placement history</Link>
    <Link href={"/tpo/students/"+encodeURIComponent(row.membershipId)+"/participation"}
      aria-label={"Change participation for "+row.displayName} className="min-h-10 text-primary-text underline">Change participation</Link>
   </div>}/>
  {active?<TpoStudentQuickPanel key={active.membershipId} student={active} rows={rows}
    onNavigate={open} onClose={()=>open(null)} />:null}
  {selected&&!active?<p role="status" className="text-sm">
    Selected student is not on this roster page. Clear the student panel selection or change filters.
    <button type="button" className="ml-2 text-primary-text underline" onClick={()=>open(null)}>Clear selection</button>
  </p>:null}
 </div>;
}
