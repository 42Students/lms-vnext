"use client";
import {useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
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
export function VerificationWorkspace({rows,counts:authoritativeCounts,initialTab="WAITING",initialKind="ALL",onTabChange,onKindChange,loading=false,error=null,onRetry,onReview,selectedKeys,onSelectionChange,disableLocalSearch=false,sort="OLDEST",allowCollegeStudentLinks=false,allowCollegeContactLinks=false,selectionDisabled=false,preserveServerOrder=false,legacyCollegeCopy=false,legacyTpoCopy=false,showTabCounts=true}:{
 rows:readonly VerificationQueueCard[];counts?:Record<VerificationTab,number>;initialTab?:VerificationTab;initialKind?:"ALL"|"EDUCATION"|"IDENTITY";onTabChange?:(tab:VerificationTab)=>void;onKindChange?:(kind:"ALL"|"EDUCATION"|"IDENTITY")=>void;loading?:boolean;error?:string|null;
 onRetry?:()=>void;onReview?:(row:VerificationQueueCard)=>void;
 selectedKeys?:ReadonlySet<string>;onSelectionChange?:(row:VerificationQueueCard,checked:boolean)=>void;
 disableLocalSearch?:boolean;sort?:"OLDEST"|"NEWEST"|"NAME";allowCollegeStudentLinks?:boolean;allowCollegeContactLinks?:boolean;selectionDisabled?:boolean;preserveServerOrder?:boolean;legacyCollegeCopy?:boolean;legacyTpoCopy?:boolean;showTabCounts?:boolean;
}){
 const [tab,setTab]=useState<VerificationTab>(initialTab);
 const [kind,setKind]=useState<"ALL"|"EDUCATION"|"IDENTITY">(initialKind);
 const [query,setQuery]=useState("");
 const counts=useMemo(()=>authoritativeCounts??verificationTabCounts(rows),[authoritativeCounts,rows]);
 const visible=useMemo(()=>displayVerificationQueueOrder(rows.filter(row=>
  verificationTab(row)===tab&&(kind==="ALL"||row.section===kind)&&
  [row.learnerName,row.batchName??"",row.branchName??""].some(s=>s.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 ),sort,preserveServerOrder),[rows,tab,kind,query,sort,preserveServerOrder]);
 return <section className="min-w-0 space-y-4" aria-label="Profile verification workspace">
  <header className="space-y-2">
   <h1 className="text-xl font-semibold">{legacyTpoCopy?"Verification":"Profile verification"}</h1>
   <p className="text-sm text-muted-foreground">{legacyTpoCopy
    ? "Check students\u0027 education and identity against their documents. Verified marks are what eligibility uses."
    : legacyCollegeCopy
    ? collegeVerificationLegacyCopy.subtitle
    : "Review learner education and identity submissions. Submitted updates to verified details remain in Waiting until decided."}</p>
  </header>
  <nav aria-label="Verification status" className="flex flex-wrap gap-2">
   {(["WAITING","SENT_BACK","VERIFIED"] as const).map(t=>
    <Button variant={tab===t?"primary":"secondary"} type="button" key={t} aria-pressed={tab===t} onClick={()=>onTabChange?onTabChange(t):setTab(t)}
     className="min-h-[var(--lms-control-height)] ">
     {t==="SENT_BACK"?"Sent back":t==="WAITING"?"Waiting":"Verified"}{showTabCounts?` (${counts[t]})`:""}
    </Button>)}
  </nav>
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
  {loading?<p role="status">Loading verification requests…</p>:
   error?<div role="alert" className="space-y-2"><p>Unable to load verification requests: {error}</p>
    {onRetry&&<Button variant="secondary" type="button" className="min-h-[var(--lms-control-height)] " onClick={onRetry}>Retry</Button>}</div>:
   visible.length===0?<div role="status" className="rounded-md border p-4">
     {(legacyCollegeCopy||legacyTpoCopy) && counts[tab]===0
      ? <><p className="font-semibold">{tab==="WAITING"
          ? (legacyTpoCopy?"Nobody is waiting":collegeVerificationLegacyCopy.emptyWaiting)
          : (legacyTpoCopy?"Nothing here yet":collegeVerificationLegacyCopy.emptyDecided)}</p>
         <p className="mt-1 text-sm text-muted-foreground">{legacyTpoCopy?"Students appear here when they send their education or identity.":collegeVerificationLegacyCopy.emptyDescription}</p></>
      : <p>No matching verification requests on this page.</p>}
    </div>:
   <ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {visible.map(row=><li key={row.learnerMembershipId+":"+row.section} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border p-4">
     <h2 className="break-words font-medium">{row.learnerName}</h2>
     {row.rollNumber?<p className="text-xs text-muted-foreground">Roll no.: {row.rollNumber}</p>:null}
     <p className="mt-1 text-xs font-semibold text-primary-text">{verificationQueueCardPresentation(row.status).state}</p>
     {allowCollegeStudentLinks&&<Link href={collegeVerificationStudentHref(row.learnerMembershipId)} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Open Student profile</Link>}
     {allowCollegeContactLinks&&<Link href={collegeRoleContactHref(row.learnerMembershipId)} className="ml-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">View masked contact</Link>}
     {onSelectionChange&&(row.status==="SUBMITTED"||row.status==="UPDATE_PENDING")&&
      <label className="mt-2 flex items-center gap-2 text-sm">
       <Checkbox disabled={selectionDisabled} aria-label={"Select "+row.learnerName+" "+row.section}
        checked={selectedKeys?.has(verificationSelectionKey(row))??false}
        onChange={e=>{if(!selectionDisabled)onSelectionChange(row,e.target.checked);}}/>Select for bulk review
      </label>}
     <p className="text-sm text-muted-foreground">{row.section==="EDUCATION"?"Education":"Identity"} · {row.batchName??"No batch"} · {row.branchName??"No branch"}</p>
     {row.section==="EDUCATION"&&row.marksheets?<p className="mt-2 text-xs" aria-label="Marksheet completeness">
      Marksheets: {row.marksheets.missing===0&&row.marksheets.expected>0
       ?"All "+row.marksheets.uploaded+" uploaded"
       :row.marksheets.missing+" of "+row.marksheets.expected+" missing"}
     </p>:null}
     {row.decidedAt?<p className="mt-2 text-xs">Decided by {row.decidedByName??"Placement team"} on {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(row.decidedAt)}</p>:null}
     {row.status==="SENT_BACK"&&row.decisionNote?<p className="mt-1 text-sm">Reason sent back: {row.decisionNote}</p>:null}
     <p className="mt-2 text-xs">Submitted {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.submittedAt)} IST</p>
     {row.attention.length>0&&<p className="mt-2 break-words text-sm" aria-label="Needs a closer look">{row.attention.join(" · ")}</p>}
     <Button variant="secondary" type="button" disabled={!onReview} onClick={()=>onReview?.(row)}
      className="mt-3 min-h-[var(--lms-control-height)] ">{verificationQueueCardPresentation(row.status).action}</Button>
    </li>)}
   </ul>}
 </section>;
}
