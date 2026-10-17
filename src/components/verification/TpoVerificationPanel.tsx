"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {filterTpoVerificationRows,defaultTpoVerificationFilters,type TpoVerificationLocalFilters} from "@/modules/verification/tpo-queue-local-filters";

/** Same locked review, private receipt and stale-version path as College Admin. */
export function TpoVerificationPanel({rows}:{rows:VerificationQueueCard[]}){
 const router=useRouter();
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
  <section aria-label="Verification filters" className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-3">
   <label className="text-sm font-semibold">Request kind
    <select value={filters.state} onChange={e=>update("state",e.target.value as TpoVerificationLocalFilters["state"])}
     className="mt-1 block min-h-10 w-full rounded border border-border bg-surface px-3">
     <option value="ALL">All submissions</option><option value="SUBMITTED">First check</option>
     <option value="UPDATE_PENDING">Update</option>
    </select>
   </label>
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
   <p className="text-xs text-muted-foreground sm:col-span-3">Showing {visible.length} of {rows.length} authorized requests on this page.</p>
  </section>
  <VerificationWorkspace key={JSON.stringify(filters)} rows={visible} legacyTpoCopy onReview={row=>setSelected(row)} />
  {selected&&<VerificationReviewDrawer
   key={selected.learnerMembershipId+selected.section} row={selected}
   apiBase="/api/tpo/verification"
   onClose={()=>setSelected(null)}
   onSaved={()=>{setSelected(null);router.refresh();}} />}
 </section>;
}
