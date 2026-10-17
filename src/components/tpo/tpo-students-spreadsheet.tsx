"use client";
import Link from "next/link";
import {tpoStudentDisplayLabel} from "@/modules/placements/tpo-student-display-label";
import {useState} from "react";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import {TpoStudentNoteEditor} from "./tpo-student-note-editor";
import {TpoStudentOutcomePill} from "./tpo-student-outcome-pill";
import {TpoStudentClipboardActions} from "./tpo-student-clipboard-actions";
import {tpoStudentClipboardTsv} from "@/modules/placements/tpo-student-clipboard-model";
import {exportTpoStudentsCsv} from "@/modules/placements/tpo-students-csv";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {TpoStudentQuickPanel} from "./tpo-student-quick-panel";
import {tpoStudentNeedsAttention,TPO_STUDENT_JOURNEY_STATES,type TpoStudentRow} from "@/modules/placements/tpo-students-model";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {TpoSpreadsheetGrid} from "./tpo-spreadsheet-grid";
import {TpoGridFilterPanel,type TpoFilterField} from "./tpo-grid-filter-panel";
import {TpoAfterCollegeEditor} from "./tpo-after-college-editor";
import { TpoAfterCollegeBulkEditor } from "./tpo-after-college-bulk-editor";
import {AFTER_COLLEGE_OUTCOMES,AFTER_COLLEGE_LABELS,afterCollegeDisplay,type AfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";

const columns:readonly TpoGridColumn<TpoStudentRow>[]=[
 {key:"student",label:"Student",read:row=>row.fromFinishedBatch?
   row.displayName+" · From "+row.cohortName:row.displayName},
 {key:"number",label:"Student number",read:row=>row.rollNumber??row.registrationNumber},
 {key:"branch",label:"Branch",read:row=>row.branchName},
 {key:"batch",label:"Batch",read:row=>row.programName+" · "+row.cohortName+(row.fromFinishedBatch?" · From "+row.cohortName:"")},
 {key:"stage",label:"Stage",filter:{urlKey:"journeyState",
  options:TPO_STUDENT_JOURNEY_STATES.map(value=>({value,label:tpoStudentDisplayLabel(value)}))},
  read:row=>tpoStudentDisplayLabel(row.journeyState)},
 {key:"gender",label:"Gender",read:row=>row.profileFacts?.gender??"Not recorded"},
 {key:"dob",label:"Birth year",read:row=>row.profileFacts?.birthYear??"Not recorded"},
 {key:"phone",label:"Phone (last four)",read:row=>row.profileFacts?.phoneMasked??"Not recorded"},
 {key:"degree",label:"Degree",read:row=>row.profileFacts?.degree??"Not recorded"},
 {key:"entranceExam",label:"Entrance exam",read:row=>row.profileFacts?.entranceExam??"Not recorded"},
 {key:"pg",label:"PG % (profile entry)",read:row=>row.profileFacts?.pgPercentage??"Not recorded"},
 {key:"linkedin",label:"LinkedIn (profile entry)",read:row=>row.profileFacts?.linkedIn??"Not recorded"},
 {key:"github",label:"GitHub (profile entry)",read:row=>row.profileFacts?.github??"Not recorded"},
 {key:"portfolio",label:"Portfolio (profile entry)",read:row=>row.profileFacts?.portfolio??"Not recorded"},
 {key:"experiences",label:"Experience entries",read:row=>row.profileFacts?.experiences??0},
 {key:"skills",label:"Skills",read:row=>row.profileFacts?.skills??0},
 {key:"projects",label:"Projects",read:row=>row.profileFacts?.projects??0},
 {key:"resume",label:"Resume",read:row=>row.profileFacts?.resume?"Provided":"Not provided"},
 {key:"codingProfiles",label:"Coding profiles",read:row=>row.profileFacts?.codingProfiles?"Provided":"Not provided"},
 {key:"certifications",label:"Certifications",read:row=>row.profileFacts?.certifications??0},
 {key:"profile",label:"Profile",filter:{urlKey:"profileStatus",options:[
  {value:"VERIFIED",label:"Verified"},{value:"WAITING",label:"Waiting"},
  {value:"SENT_BACK",label:"Sent back"},{value:"NOT_VERIFIED",label:"Not verified"}]},
  read:row=>row.verification.status==="UNKNOWN"?"Verification unavailable":row.verification.status==="WAITING"? "Waiting: "+row.verification.waitingSections.join(" / "):row.verification.status==="SENT_BACK"?"Sent back":row.verification.status==="VERIFIED"?"Verified Education and Identity":"Not verified"},
 {key:"cgpa",label:"CGPA",read:row=>row.cgpa},
 {key:"tenth",label:"10th %",read:row=>row.tenthPct},
 {key:"twelfth",label:"12th %",read:row=>row.twelfthPct},
 {key:"diploma",label:"Diploma %",read:row=>row.diplomaPct},
 {key:"ug",label:"UG %",read:row=>row.ugPct},
 {key:"passingYear",label:"Passing year",read:row=>row.passingYear},
 {key:"gapYears",label:"Gap years",read:row=>row.gapYears},
 {key:"lateral",label:"Lateral entry",read:row=>row.isLateralEntry==null?"Not recorded":row.isLateralEntry?"Yes":"No"},
 {key:"marksVerified",label:"Marks verified",read:row=>row.marksVerified?"Verified":"Not verified"},
 {key:"backlogs",label:"Active backlogs",read:row=>row.activeBacklogs},
 {key:"readiness",label:"Readiness evidence",read:row=>tpoStudentDisplayLabel(row.readinessSignal)},
 {key:"readinessNote",label:"Readiness note",read:row=>[
  !row.profileFacts?.resume?"No resume":"",row.readinessSignal==="ACADEMIC_EVIDENCE_MISSING"?"Academics incomplete":"",
  row.offersAwaitingAnswer>0?row.offersAwaitingAnswer+" offer(s) waiting on an answer":""
 ].filter(Boolean).join(" · ")||"No flags recorded"},
 {key:"eligibilityReason",label:"Eligibility reason",read:row=>row.participationReason??"Not recorded"},
 {key:"eligibilityLevel",label:"Eligibility set by",read:row=>row.participationLevel??"Not recorded"},
 {key:"eligibilityDate",label:"Eligibility set at",read:row=>row.participationDecidedAt?
  row.participationDecidedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):"Not recorded"},
 {key:"attention",label:"Needs attention",read:row=>tpoStudentNeedsAttention(row)?"Review needed":"No flags"},
 {key:"debarred",label:"Debarred",filter:{urlKey:"debarred",
  options:[{value:"YES",label:"Debarred"},{value:"NO",label:"Not debarred"}]},
  read:row=>row.debarred===null?"Unavailable":row.debarred?"Debarred":"No"},
 {key:"furthest",label:"Furthest round",read:row=>row.maximumAppliedRoundSequence??"Not recorded"},
 {key:"registration",label:"Placement registration",read:row=>row.registrationChoice??"Not registered"},
 {key:"participation",label:"Participation",read:row=>tpoStudentDisplayLabel(row.participationStatus)},
 {key:"best",label:"Best so far",tooltip:row=>row.bestDriveResults?.join("\n"),read:row=>(row.bestCompany?row.bestCompany+": ":"")+tpoStudentDisplayLabel(row.bestSoFar)+
  ((row.interviewedCompanies?.length??0)>1?" · +"+((row.interviewedCompanies?.length??1)-1)+" more":"")},
 {key:"applications",label:"Applications",read:row=>row.applicationCount},
 {key:"offers",label:"Offers",read:row=>row.offerCount},
 {key:"offersAwaiting",label:"Offers waiting on their answer",read:row=>row.offersAwaitingAnswer},
 {key:"journey",label:"Journey",read:row=>tpoStudentDisplayLabel(row.journeyState)},
 {key:"email",label:"Email (export only)",read:row=>row.email,exportOnly:true},
];
export function TpoStudentsSpreadsheet({rows,programs,classes,afterCollege,afterCollegeAvailable}:{rows:readonly TpoStudentRow[];programs:readonly {id:string;name:string}[];classes:readonly {id:string;name:string}[];
 afterCollege:Record<string,{outcome:AfterCollegeOutcome;expectedVersion:string}>;afterCollegeAvailable:boolean}){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const selected=params.get("student");
 const [localSelection,setLocalSelection]=useState<string[]>([]);
 const shared=useTpoStudentsSelection();
 const noteSelection=shared?.selected??localSelection;
 const setNoteSelection=shared?.setSelected??setLocalSelection;
 const [downloadError,setDownloadError]=useState("");
 const [pageSort,setPageSort]=useState<"NAME"|"APPLICATIONS_DESC"|"APPLICATIONS_ASC"|"OFFERS_DESC"|"OFFERS_ASC">("NAME");
 const sortedRows=[...rows].sort((a,b)=>{
  const diff=pageSort.startsWith("APPLICATIONS")?a.applicationCount-b.applicationCount:
   pageSort.startsWith("OFFERS")?a.offerCount-b.offerCount:0;
  return pageSort==="NAME"?a.displayName.localeCompare(b.displayName):
   (pageSort.endsWith("_DESC")?-diff:diff)||a.displayName.localeCompare(b.displayName);
 });
 const active=sortedRows.find(row=>row.membershipId===selected)??null;
 const selectedScoped=noteSelection.filter(id=>shared?.allIds?.includes(id)??rows.some(row=>row.membershipId===id));
 const allSelected=Boolean(shared?.allIds?.length&&selectedScoped.length===shared.allIds.length);
 const xlsxHref=(()=>{
  const query=new URLSearchParams(params.toString());
  query.delete("student");query.delete("page");query.delete("pageSize");
  if(!selectedScoped.length)return null;
  if(!allSelected&&selectedScoped.length>200)return null;
  query.set("ids",allSelected?"ALL":selectedScoped.join(","));
  query.set("view",params.get("afterCollege")||params.get("journeyState")||"Students");
  return "/api/placements/tpo/students/export-xlsx?"+query.toString();
 })();
 function downloadSelection(){
  const permitted=new Set(rows.map(row=>row.membershipId));
  const chosen=sortedRows.filter(row=>noteSelection.includes(row.membershipId)&&permitted.has(row.membershipId));
  if(!chosen.length){setDownloadError("Select at least one student on this visible page.");return;}
  setDownloadError("");
  try{
   const csv=exportTpoStudentsCsv(chosen,Object.fromEntries(chosen.map(row=>[
     row.membershipId,afterCollegeDisplay(afterCollege[row.membershipId]?.outcome),
   ])));
   const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
   try{
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="selected-tpo-students.csv";document.body.appendChild(anchor);
    anchor.click();anchor.remove();
   }finally{URL.revokeObjectURL(url);}
  }catch{setDownloadError("Could not prepare the selected CSV. Please try again.");}
 }

 const open=(id:string|null)=>{const q=new URLSearchParams(params.toString());if(id)q.set("student",id);else q.delete("student");router.replace(pathname+(q.size?"?"+q.toString():""),{scroll:false});};
 const displayColumns:readonly TpoGridColumn<TpoStudentRow>[]=[
  ...columns.slice(0,5),
  {key:"afterCollege",label:"After college",filter:{urlKey:"afterCollege",options:
   AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value]}))},read:row=>afterCollegeDisplay(afterCollege[row.membershipId]?.outcome)??"Not decided"},
  ...columns.slice(5),
 ];
 const filters:TpoFilterField[]=[
  {key:"programId",urlKey:"programId",label:"Program",options:programs.map(p=>({value:p.id,label:p.name}))},
  {key:"classId",urlKey:"classId",label:"Class",options:classes.map(c=>({value:c.id,label:c.name}))},
  {key:"afterCollege",urlKey:"afterCollege",label:"After college",options:AFTER_COLLEGE_OUTCOMES.map(value=>({value,label:AFTER_COLLEGE_LABELS[value]}))},
  {key:"maxActiveBacklogs",urlKey:"maxActiveBacklogs",label:"Max active backlogs",options:[0,1,2,3,5,10].map(value=>({value:String(value),label:String(value)}))},
  {key:"maxPastBacklogs",urlKey:"maxPastBacklogs",label:"Max past backlogs",options:[0,1,2,3,5,10].map(value=>({value:String(value),label:String(value)}))},
  {key:"cgpaRecorded",urlKey:"cgpaRecorded",label:"CGPA recorded",options:[
   {value:"YES",label:"Recorded"},{value:"NO",label:"No recorded CGPA"},
  ]},
  {key:"minCgpa",urlKey:"minCgpa",label:"Minimum CGPA",options:[0,6,7,7.5,8,8.5,9].map(value=>({value:String(value),label:String(value)}))},
  {key:"maxCgpa",urlKey:"maxCgpa",label:"Maximum CGPA",options:[5,6,7,8,9,10].map(value=>({value:String(value),label:String(value)}))},
  {key:"minApplications",urlKey:"minApplications",label:"At least applications",options:[0,1,2,3,5,10,20,50].map(value=>({value:String(value),label:String(value)}))},
  {key:"minOffers",urlKey:"minOffers",label:"At least offers",options:[0,1,2,3,5,10].map(value=>({value:String(value),label:String(value)}))},
  {key:"offerWaiting",urlKey:"offerWaiting",label:"Offer waiting on answer",options:[
   {value:"YES",label:"Yes"},{value:"NO",label:"No"},
  ]},
  {key:"hasResume",urlKey:"hasResume",label:"Resume",options:[{value:"YES",label:"Provided"},{value:"NO",label:"Not provided"}]},
  {key:"hasCodingProfiles",urlKey:"hasCodingProfiles",label:"Coding profiles",options:[{value:"YES",label:"Provided"},{value:"NO",label:"Not provided"}]},
  {key:"profileStatus",urlKey:"profileStatus",label:"Profile verified",options:[
   {value:"VERIFIED",label:"Verified"},{value:"WAITING",label:"Waiting to verify"},
   {value:"SENT_BACK",label:"Sent back"},{value:"NOT_VERIFIED",label:"Not verified"},
  ]},
 ];
 return <div className="space-y-3" role="region" aria-label="Students spreadsheet keyboard actions" tabIndex={0}
  onKeyDown={event=>{
   const target=event.target;
   if(target instanceof HTMLElement&&target.closest("input,textarea,select,[contenteditable=true]"))return;
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="a"){
    event.preventDefault();setNoteSelection([...(shared?.allIds??rows.map(row=>row.membershipId))]);
   }
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c"){
    event.preventDefault();const chosen=sortedRows.filter(row=>!noteSelection.length||noteSelection.includes(row.membershipId));
    setDownloadError("");
    void navigator.clipboard.writeText(tpoStudentClipboardTsv(chosen)).catch(()=>{
      setDownloadError("Could not copy student rows. Check browser clipboard permissions.");
    });
   }
  }}>
  <TpoAfterCollegeBulkEditor rows={rows} current={afterCollege} available={afterCollegeAvailable} />
  <TpoStudentClipboardActions rows={rows} selected={noteSelection} onSelect={setNoteSelection}/>
  <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{selectedScoped.length} selected of {shared?.totalCount??rows.length} in the authorized view.</p>
   {xlsxHref?<a href={xlsxHref} className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">Export selected XLSX</a>:
    selectedScoped.length>200?<p role="status" className="text-xs text-warning-text">Export up to 200 individually selected students or select all matching students.</p>:null}
  <button type="button" disabled={!noteSelection.some(id=>rows.some(row=>row.membershipId===id))}
    onClick={downloadSelection} className="min-h-11 rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
    Export selected CSV
  </button>
  {downloadError?<p role="alert" className="text-xs text-error">{downloadError}</p>:null}
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
   <TpoStudentNoteEditor membershipIds={[...noteSelection]} afterSave={()=>setNoteSelection([])}/>
  </details>
  <label className="inline-flex items-center gap-3 text-sm font-semibold">Sort visible roster page
   <select value={pageSort} onChange={e=>setPageSort(e.target.value as typeof pageSort)}
    className="min-h-10 rounded border border-border bg-surface px-3">
    <option value="NAME">Name</option><option value="APPLICATIONS_DESC">Applications · most</option>
    <option value="APPLICATIONS_ASC">Applications · fewest</option>
    <option value="OFFERS_DESC">Offers · most</option><option value="OFFERS_ASC">Offers · fewest</option>
   </select>
  </label>
  <TpoGridFilterPanel fields={filters} mobileSheet/>
  <TpoSpreadsheetGrid mobileActionsCollapsible storageKey="tpo-students-columns-v1" selection={{selected:noteSelection,onChange:setNoteSelection,allIds:shared?.allIds??rows.map(row=>row.membershipId)}} rows={sortedRows} columns={displayColumns} rowKey={row=>row.membershipId}
   openPrimary={{columnKey:"student",onOpen:row=>open(row.membershipId),
     ariaLabel:row=>"Open student panel for "+row.displayName}}
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
  {active?<TpoStudentQuickPanel key={active.membershipId} student={active} rows={sortedRows}
    recordedOutcome={afterCollege[active.membershipId]?.outcome??null}
    onNavigate={open} onClose={()=>open(null)} />:null}
  {selected&&!active?<p role="status" className="text-sm">
    Selected student is not on this roster page. Clear the student panel selection or change filters.
    <button type="button" className="ml-2 text-primary-text underline" onClick={()=>open(null)}>Clear selection</button>
  </p>:null}
 </div>;
}
