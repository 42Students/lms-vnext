"use client";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import {useEffect,useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
import {StatusBadge} from "@/components/ui/status-badge";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import Link from "next/link";
import {collegeVerificationStudentHref} from "@/modules/verification/staff-links";
import {collegeRoleContactHref} from "@/modules/people/college-role-directory-model";
import {verificationTab,verificationTabCounts,type VerificationTab} from "@/modules/verification/queue-tabs";
import {displayVerificationQueueOrder} from "@/modules/verification/queue-order";
import {verificationSelectionKey} from "@/modules/verification/selection-model";
import {verificationQueueCardPresentation} from "@/modules/verification/queue-card-action";
import {collegeVerificationLegacyCopy} from "@/modules/verification/college-legacy-verification-copy";
import type {VerificationRecord} from "@/modules/profile-verification/domain";

export type VerificationQueueCard = Pick<VerificationRecord,
 "learnerMembershipId"|"section"|"status"|"submittedAt"|"version"> & {
 learnerName:string;batchName:string|null;branchName:string|null;
 rollNumber?:string|null;decisionNote?:string|null;
 decidedAt?:Date|null;decidedByName?:string|null;
 missingMarksheet:boolean;missingIdentityProof?:boolean;attention:string[];marksheets?:{uploaded:number;expected:number;missing:number};
};
export function VerificationWorkspace({rows,counts:authoritativeCounts,initialTab="WAITING",initialKind="ALL",onTabChange,onKindChange,loading=false,error=null,onRetry,onReview,selectedKeys,onSelectionChange,disableLocalSearch=false,sort="OLDEST",allowCollegeStudentLinks=false,allowCollegeContactLinks=false,selectionDisabled=false,preserveServerOrder=false,legacyCollegeCopy=false,legacyTpoCopy=false,showTabCounts=true,hideHeader=false,denseTable=true}:{
 rows:readonly VerificationQueueCard[];counts?:Record<VerificationTab,number>;initialTab?:VerificationTab;initialKind?:"ALL"|"EDUCATION"|"IDENTITY";onTabChange?:(tab:VerificationTab)=>void;onKindChange?:(kind:"ALL"|"EDUCATION"|"IDENTITY")=>void;loading?:boolean;error?:string|null;
 onRetry?:()=>void;onReview?:(row:VerificationQueueCard)=>void;
 selectedKeys?:ReadonlySet<string>;onSelectionChange?:(row:VerificationQueueCard,checked:boolean)=>void;
 disableLocalSearch?:boolean;sort?:"OLDEST"|"NEWEST"|"NAME";allowCollegeStudentLinks?:boolean;allowCollegeContactLinks?:boolean;selectionDisabled?:boolean;preserveServerOrder?:boolean;legacyCollegeCopy?:boolean;legacyTpoCopy?:boolean;showTabCounts?:boolean;hideHeader?:boolean;denseTable?:boolean;
}){
 const [tab,setTab]=useState<VerificationTab>(initialTab);
 const [kind,setKind]=useState<"ALL"|"EDUCATION"|"IDENTITY">(initialKind);
 const [query,setQuery]=useState("");
 const [tableSort,setTableSort]=useState<"OLDEST"|"NEWEST"|"NAME">(sort);
 useEffect(()=>{setTableSort(sort);},[sort]);
 const counts=useMemo(()=>authoritativeCounts??verificationTabCounts(rows),[authoritativeCounts,rows]);
 const visible=useMemo(()=>displayVerificationQueueOrder(rows.filter(row=>
  verificationTab(row)===tab&&(kind==="ALL"||row.section===kind)&&
  [row.learnerName,row.batchName??"",row.branchName??""].some(s=>s.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 ),tableSort,preserveServerOrder&&tableSort===sort),[rows,tab,kind,query,tableSort,sort,preserveServerOrder]);
 return <section className="min-w-0 space-y-4" aria-label="Profile verification workspace">
  {hideHeader ? null : legacyTpoCopy ? <p className="text-sm text-body leading-[22px]">Check students&apos; education and identity against their documents. Verified marks are what eligibility uses.</p> :
   <PageHeader title="Profile verification" description={legacyCollegeCopy
     ? collegeVerificationLegacyCopy.subtitle
     : "Review learner education and identity submissions. Submitted updates to verified details remain in Waiting until decided."} />}
  <Tabs
   ariaLabel="Verification status"
   value={tab}
   renderPanel={false}
   controlledOnly
   onValueChange={next=>{
    const selectedTab=next as VerificationTab;
    if(onTabChange)onTabChange(selectedTab);else setTab(selectedTab);
   }}
   items={(["WAITING","SENT_BACK","VERIFIED"] as const).map(t=>({
    value:t,
    label:t==="SENT_BACK"?"Sent back":t==="WAITING"?"Waiting":"Verified",
    count:showTabCounts?counts[t]:undefined,
   }))}
  />
  <div className="flex flex-wrap gap-2">
   {!disableLocalSearch&&<label className="min-w-0 flex-1 text-sm">Search learners
    <Input aria-label="Search learners" className="mt-1 w-full"
     value={query} onChange={e=>setQuery(e.target.value)} placeholder="Learner, batch or branch"/>
   </label>}
   <label className="text-sm">Kind
    <Select aria-label="Kind" value={kind} onChange={e=>onKindChange?onKindChange(e.target.value as typeof kind):setKind(e.target.value as typeof kind)}
     className="mt-1 w-full">
     <option value="ALL">All</option><option value="EDUCATION">Education</option><option value="IDENTITY">Identity</option>
    </Select>
   </label>
  </div>

  {!loading&&!error&&visible.length>0?<div className="flex flex-wrap items-end gap-2 print:hidden" aria-label="Verification table actions">
   <label className="grid gap-1 text-xs font-semibold">Sort
    <Select value={tableSort} onChange={event=>setTableSort(event.target.value as typeof tableSort)}>
     <option value="OLDEST">Oldest first</option>
     <option value="NEWEST">Newest first</option>
     <option value="NAME">Student name</option>
    </Select>
   </label>
   {onSelectionChange?<Button variant="secondary" type="button" disabled={selectionDisabled}
     onClick={()=>{
      const eligible=visible.filter(row=>["SUBMITTED","UPDATE_PENDING"].includes(row.status)).slice(0,20);
      for(const row of eligible)if(!selectedKeys?.has(verificationSelectionKey(row)))onSelectionChange(row,true);
     }}>Select visible (up to 20)</Button>:null}
   {onSelectionChange&&selectedKeys?.size?<Button variant="secondary" type="button"
     disabled={selectionDisabled} onClick={()=>{
      for(const row of visible)if(selectedKeys.has(verificationSelectionKey(row)))onSelectionChange(row,false);
     }}>Clear visible selection</Button>:null}
   <Button variant="secondary" type="button" onClick={()=>{
    const fields=[["Student","Roll","Batch","Branch","Section","Status","Marksheets","Submitted (IST)","By / reason"],
      ...visible.map(row=>[row.learnerName,row.rollNumber??"",row.batchName??"",row.branchName??"",
       row.section,verificationQueueCardPresentation(row.status).state,
       row.section==="EDUCATION"?(row.marksheets?row.marksheets.uploaded+"/"+row.marksheets.expected:
        row.missingMarksheet?"Missing":"Available"):row.missingIdentityProof?"Missing":"Available",
       new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(row.submittedAt),
       [row.decidedByName,row.decisionNote].filter(Boolean).join(" · ")])];
    const csv=fields.map(columns=>columns.map(value=>{
     const text=String(value).replace(/[\r\n]+/g," ");
     const guarded=/^[\s]*[=+@-]/.test(text)?"'"+text:text;
     return '"'+guarded.replace(/"/g,'""')+'"';
    }).join(",")).join("\r\n");
    const href=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
    const anchor=document.createElement("a");
    anchor.href=href;anchor.download="verification-"+tab.toLowerCase()+"-page.csv";
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(href),1000);
   }}>Export CSV (page)</Button>
   <span className="self-center text-xs text-muted-foreground">{visible.length} in this view</span>
  </div>:null}
  {loading?<p role="status">Loading verification requests…</p>:
   error?<div role="alert" className="space-y-2"><p>Unable to load verification requests: {error}</p>
    {onRetry&&<Button variant="secondary" type="button" className="min-h-[var(--lms-control-height)] " onClick={onRetry}>Retry</Button>}</div>:
   visible.length===0?<div role="status" className="border-y border-border px-3 py-4">
     {(legacyCollegeCopy||legacyTpoCopy) && counts[tab]===0
      ? <><p className="font-semibold">{tab==="WAITING"
          ? (legacyTpoCopy?"Nobody is waiting":collegeVerificationLegacyCopy.emptyWaiting)
          : (legacyTpoCopy?"Nothing here yet":collegeVerificationLegacyCopy.emptyDecided)}</p>
         <p className="mt-1 text-sm text-muted-foreground leading-[22px]">{legacyTpoCopy?"Students appear here when they send their education or identity.":collegeVerificationLegacyCopy.emptyDescription}</p></>
      : <p>No matching verification requests on this page.</p>}
    </div>:
   denseTable?<DataTable caption="Verification requests" rows={visible}
    getRowKey={row=>verificationSelectionKey(row)}
    empty={<p>No matching verification requests.</p>}
    columns={[
      ...(onSelectionChange?[{
        key:"select",header:"Select",mobilePriority:"action" as const,
        cell:(row:VerificationQueueCard)=>
         <Checkbox aria-label={"Select "+row.learnerName+" "+row.section}
          checked={selectedKeys?.has(verificationSelectionKey(row))??false}
          disabled={selectionDisabled||!["SUBMITTED","UPDATE_PENDING"].includes(row.status)}
          onChange={e=>onSelectionChange(row,e.target.checked)}/>,
      }]:[]),
      {key:"learner",header:"Student",mobilePriority:"primary" as const,
       cell:(row:VerificationQueueCard)=><div className="min-w-0">
         <strong>{row.learnerName}</strong>
         <p className="text-xs text-muted-foreground">{row.rollNumber??"No roll number"} · {row.batchName??"No batch"}</p>
        </div>},
      {key:"roll",header:"Roll",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=>row.rollNumber??"—"},
      {key:"batch",header:"Batch",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=>row.batchName??"—"},
      {key:"branch",header:"Branch",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=>row.branchName??"—"},
      {key:"kind",header:"Section",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=>row.section==="EDUCATION"?"Education":"Identity"},
      {key:"state",header:"Status",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=><StatusBadge tone={row.status==="VERIFIED"?"success":row.status==="SENT_BACK"?"warning":"info"}>
        {verificationQueueCardPresentation(row.status).state}</StatusBadge>},
      {key:"date",header:"Submitted",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=>new Intl.DateTimeFormat("en-IN",{
         dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.submittedAt)+" IST"},
      {key:"reviewHistory",header:"By / reason",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=>row.decidedByName
         ?row.decidedByName+(row.decisionNote?" · "+row.decisionNote:"")
         :row.decisionNote??"—"},
      {key:"evidence",header:"Marksheets",mobilePriority:"secondary" as const,
       cell:(row:VerificationQueueCard)=>row.section==="EDUCATION"
        ?row.marksheets
         ?row.marksheets.uploaded+" / "+row.marksheets.expected+" uploaded"
         :row.missingMarksheet?"Missing marksheet":"Marksheet available"
        :row.missingIdentityProof?"Missing identity proof":"Identity proof available"},
      {key:"actions",header:"Actions",mobilePriority:"action" as const,
       cell:(row:VerificationQueueCard)=><Button type="button" variant="secondary"
        disabled={!onReview} onClick={()=>onReview?.(row)}
        className="min-h-11 md:min-h-9">Review</Button>},
    ]}/>:
   <ul className="min-w-0 divide-y divide-border border-y border-border">
    {visible.map(row=><li key={row.learnerMembershipId+":"+row.section} className="min-w-0 py-4">
     <h2 className="break-words font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{row.learnerName}</h2>
     {row.rollNumber?<p className="text-xs text-muted-foreground leading-[20px]">Roll no.: {row.rollNumber}</p>:null}
     <StatusBadge tone={row.status==="VERIFIED"?"success":row.status==="SENT_BACK"?"warning":"info"}>{verificationQueueCardPresentation(row.status).state}</StatusBadge>
     {allowCollegeStudentLinks&&<Link href={collegeVerificationStudentHref(row.learnerMembershipId)} className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">Open Student profile</Link>}
     {allowCollegeContactLinks&&<Link href={collegeRoleContactHref(row.learnerMembershipId)} className="ml-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">View masked contact</Link>}
     {onSelectionChange&&(row.status==="SUBMITTED"||row.status==="UPDATE_PENDING")&&
      <label className="mt-2 flex items-center gap-2 text-sm">
       <Checkbox disabled={selectionDisabled} aria-label={"Select "+row.learnerName+" "+row.section}
        checked={selectedKeys?.has(verificationSelectionKey(row))??false}
        onChange={e=>{if(!selectionDisabled)onSelectionChange(row,e.target.checked);}}/>Select for bulk review
      </label>}
     <p className="text-sm text-muted-foreground leading-[22px]">{row.section==="EDUCATION"?"Education":"Identity"} · {row.batchName??"No batch"} · {row.branchName??"No branch"}</p>
     {row.section==="EDUCATION"&&row.marksheets?<p className="mt-2 text-xs leading-[20px]" aria-label="Marksheet completeness">
      Marksheets: {row.marksheets.missing===0&&row.marksheets.expected>0
       ?"All "+row.marksheets.uploaded+" uploaded"
       :row.marksheets.missing+" of "+row.marksheets.expected+" missing"}
     </p>:null}
     {row.decidedAt?<p className="mt-2 text-xs leading-[20px]">Decided by {row.decidedByName??"Placement team"} on {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(row.decidedAt)}</p>:null}
     {row.status==="SENT_BACK"&&row.decisionNote?<p className="mt-1 text-sm leading-[22px]">Reason sent back: {row.decisionNote}</p>:null}
     <p className="mt-2 text-xs leading-[20px]">Submitted {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.submittedAt)} IST</p>
     {row.attention.length>0&&<p className="mt-2 break-words text-sm leading-[22px]" aria-label="Needs a closer look">{row.attention.join(" · ")}</p>}
     <Button variant="secondary" type="button" disabled={!onReview} onClick={()=>onReview?.(row)}
      className="mt-3 min-h-[var(--lms-control-height)] ">{verificationQueueCardPresentation(row.status).action}</Button>
    </li>)}
   </ul>}
 </section>;
}
