"use client";
import {useRouter,useSearchParams} from "next/navigation";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {filterTpoVerificationRows,defaultTpoVerificationFilters,type TpoVerificationLocalFilters} from "@/modules/verification/tpo-queue-local-filters";

/** Same locked review, private receipt and stale-version path as College Admin. */
export function TpoVerificationPanel({rows,serverTab,serverKind}:{rows:VerificationQueueCard[];serverTab:VerificationTab;serverKind:"ALL"|"EDUCATION"|"IDENTITY"}){
 const router=useRouter(),params=useSearchParams();
 function navigate(patch:Record<string,string>){
  const next=new URLSearchParams(params.toString());
  Object.entries(patch).forEach(([key,value])=>{if(value)next.set(key,value);else next.delete(key);});
  router.push("/tpo/verification?"+next.toString());
 }
 const [selected,setSelected]=useState<VerificationQueueCard|null>(null);
 const [filters,setFilters]=useState<TpoVerificationLocalFilters>(defaultTpoVerificationFilters);
 const [asOf]=useState(()=>new Date());
 const visible=filterTpoVerificationRows(rows,filters,asOf);
 function update<K extends keyof TpoVerificationLocalFilters>(key:K,value:TpoVerificationLocalFilters[K]){
  setFilters(old=>({...old,[key]:value}));setSelected(null);
 }
 return <section className="min-w-0 space-y-3">
  <button type="button" className="rounded border px-3 py-2 text-sm"
   onClick={()=>router.refresh()}>Refresh</button>
  <section aria-label="Verification filters" className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
   <label className="text-sm font-semibold">Marksheets
    <select value={filters.marksheets} onChange={e=>update("marksheets",e.target.value as TpoVerificationLocalFilters["marksheets"])}
     className="mt-1 block min-h-10 w-full rounded border border-border bg-surface px-3">
     <option value="ANY">Any</option><option value="MISSING">Missing</option><option value="PRESENT">All uploaded</option>
    </select>
   </label>
   <label className="text-sm font-semibold">Needs a closer look
    <select value={filters.attention} onChange={e=>update("attention",e.target.value as TpoVerificationLocalFilters["attention"])}
     className="mt-1 block min-h-10 w-full rounded border border-border bg-surface px-3">
     <option value="ALL">All requests</option><option value="MISSING_DOCUMENT">Missing document</option>
     <option value="WAITING_OVER_WEEK">Waiting over a week</option>
    </select>
   </label>
   <p className="text-xs text-muted-foreground sm:col-span-3">Showing {visible.length} of {rows.length} records from the server-filtered authorized page. Status, section, batch and branch filters apply before pagination.</p>
  </section>
  <VerificationWorkspace key={JSON.stringify(filters)+serverTab+serverKind} rows={visible}
   legacyTpoCopy initialTab={serverTab} initialKind={serverKind}
   disableLocalSearch preserveServerOrder
   onTabChange={tab=>navigate({tab,page:"1",waitingState:tab==="WAITING"?(params.get("waitingState")??"ALL"):"ALL"})}
   onKindChange={kind=>navigate({kind,page:"1"})}
   onReview={row=>setSelected(row)} />
  {selected&&<VerificationReviewDrawer
   key={selected.learnerMembershipId+selected.section} row={selected}
   apiBase="/api/tpo/verification"
   onClose={()=>setSelected(null)}
   onSaved={()=>{setSelected(null);router.refresh();}} />}
 </section>;
}
