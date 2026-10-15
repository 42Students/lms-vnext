"use client";
import {useMemo,useState} from "react";
import {verificationTab,verificationTabCounts,type VerificationTab} from "@/modules/verification/queue-tabs";
import {orderVerificationQueue} from "@/modules/verification/queue-order";
import {verificationSelectionKey} from "@/modules/verification/selection-model";
import type {VerificationRecord} from "@/modules/profile-verification/domain";

export type VerificationQueueCard = Pick<VerificationRecord,
 "learnerMembershipId"|"section"|"status"|"submittedAt"|"version"> & {
 learnerName:string;batchName:string|null;branchName:string|null;
 missingMarksheet:boolean;attention:string[];
};
export function VerificationWorkspace({rows,counts:authoritativeCounts,initialTab="WAITING",initialKind="ALL",onTabChange,onKindChange,loading=false,error=null,onRetry,onReview,selectedKeys,onSelectionChange,disableLocalSearch=false}:{
 rows:readonly VerificationQueueCard[];counts?:Record<VerificationTab,number>;initialTab?:VerificationTab;initialKind?:"ALL"|"EDUCATION"|"IDENTITY";onTabChange?:(tab:VerificationTab)=>void;onKindChange?:(kind:"ALL"|"EDUCATION"|"IDENTITY")=>void;loading?:boolean;error?:string|null;
 onRetry?:()=>void;onReview?:(row:VerificationQueueCard)=>void;
 selectedKeys?:ReadonlySet<string>;onSelectionChange?:(row:VerificationQueueCard,checked:boolean)=>void;
 disableLocalSearch?:boolean;
}){
 const [tab,setTab]=useState<VerificationTab>(initialTab);
 const [kind,setKind]=useState<"ALL"|"EDUCATION"|"IDENTITY">(initialKind);
 const [query,setQuery]=useState("");
 const counts=useMemo(()=>authoritativeCounts??verificationTabCounts(rows),[authoritativeCounts,rows]);
 const visible=useMemo(()=>orderVerificationQueue(rows.filter(row=>
  verificationTab(row)===tab&&(kind==="ALL"||row.section===kind)&&
  [row.learnerName,row.batchName??"",row.branchName??""].some(s=>s.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 )),[rows,tab,kind,query]);
 return <section className="min-w-0 space-y-4" aria-label="Profile verification workspace">
  <header className="space-y-2">
   <h1 className="text-xl font-semibold">Profile verification</h1>
   <p className="text-sm text-muted-foreground">Review learner education and identity submissions. Submitted updates to verified details remain in Waiting until decided.</p>
  </header>
  <nav aria-label="Verification status" className="flex flex-wrap gap-2">
   {(["WAITING","SENT_BACK","VERIFIED"] as const).map(t=>
    <button type="button" key={t} aria-pressed={tab===t} onClick={()=>onTabChange?onTabChange(t):setTab(t)}
     className={`rounded-md border px-3 py-2 text-sm ${tab===t?"font-semibold ring-2 ring-offset-1":""}`}>
     {t==="SENT_BACK"?"Sent back":t==="WAITING"?"Waiting":"Verified"} ({counts[t]})
    </button>)}
  </nav>
  <div className="flex flex-wrap gap-2">
   {!disableLocalSearch&&<label className="min-w-0 flex-1 text-sm">Search learners
    <input aria-label="Search learners" className="mt-1 block w-full min-w-0 rounded-md border bg-background px-3 py-2"
     value={query} onChange={e=>setQuery(e.target.value)} placeholder="Learner, batch or branch"/>
   </label>}
   <label className="text-sm">Kind
    <select aria-label="Kind" value={kind} onChange={e=>onKindChange?onKindChange(e.target.value as typeof kind):setKind(e.target.value as typeof kind)}
     className="mt-1 block w-full rounded-md border bg-background px-3 py-2">
     <option value="ALL">All</option><option value="EDUCATION">Education</option><option value="IDENTITY">Identity</option>
    </select>
   </label>
  </div>
  {loading?<p role="status">Loading verification requests…</p>:
   error?<div role="alert" className="space-y-2"><p>Unable to load verification requests: {error}</p>
    {onRetry&&<button type="button" className="rounded-md border px-3 py-2" onClick={onRetry}>Retry</button>}</div>:
   visible.length===0?<p role="status" className="rounded-md border p-4">No matching verification requests on this page.</p>:
   <ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {visible.map(row=><li key={row.learnerMembershipId+":"+row.section} className="min-w-0 rounded-lg border p-4">
     <h2 className="break-words font-medium">{row.learnerName}</h2>
     {onSelectionChange&&(row.status==="SUBMITTED"||row.status==="UPDATE_PENDING")&&
      <label className="mt-2 flex items-center gap-2 text-sm">
       <input type="checkbox" aria-label={"Select "+row.learnerName+" "+row.section}
        checked={selectedKeys?.has(verificationSelectionKey(row))??false}
        onChange={e=>onSelectionChange(row,e.target.checked)}/>Select for bulk review
      </label>}
     <p className="text-sm text-muted-foreground">{row.section==="EDUCATION"?"Education":"Identity"} · {row.batchName??"No batch"} · {row.branchName??"No branch"}</p>
     <p className="mt-2 text-xs">Submitted {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.submittedAt)} IST</p>
     {row.attention.length>0&&<p className="mt-2 break-words text-sm" aria-label="Needs a closer look">{row.attention.join(" · ")}</p>}
     <button type="button" disabled={!onReview} onClick={()=>onReview?.(row)}
      className="mt-3 rounded-md border px-3 py-2 text-sm disabled:opacity-50">Review</button>
    </li>)}
   </ul>}
 </section>;
}
