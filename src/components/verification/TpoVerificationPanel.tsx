"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";

/** Same locked review, private receipt and stale-version path as College Admin. */
export function TpoVerificationPanel({rows}:{rows:VerificationQueueCard[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<VerificationQueueCard|null>(null);
 return <section className="min-w-0 space-y-3">
  <button type="button" className="rounded border px-3 py-2 text-sm"
   onClick={()=>router.refresh()}>Refresh</button>
  <VerificationWorkspace rows={rows} legacyTpoCopy onReview={row=>setSelected(row)} />
  {selected&&<VerificationReviewDrawer
   key={selected.learnerMembershipId+selected.section} row={selected}
   apiBase="/api/tpo/verification"
   onClose={()=>setSelected(null)}
   onSaved={()=>{setSelected(null);router.refresh();}} />}
 </section>;
}
