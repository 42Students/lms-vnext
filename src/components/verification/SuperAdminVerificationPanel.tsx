"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationFilterPanel} from "./VerificationFilterPanel";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";

export function SuperAdminVerificationPanel({collegeId,rows,counts,activeTab,initialKind,page,total,hasMore,query}:{
 collegeId:string;
 rows:VerificationQueueCard[];counts:Record<VerificationTab,number>;
 activeTab:VerificationTab;initialKind:"ALL"|"EDUCATION"|"IDENTITY";
 page:number;total:number;hasMore:boolean;query:Record<string,string>;
}){
 const router=useRouter();
 const [selected,setSelected]=useState<VerificationQueueCard|null>(null);
 const base=`/admin/colleges/${encodeURIComponent(collegeId)}/verification`;
 const navigate=(changes:Record<string,string>)=>{
  const params=new URLSearchParams(query);
  for(const [k,v] of Object.entries(changes)){if(v)params.set(k,v);else params.delete(k);}
  router.push(base+"?"+params.toString());
 };
 return <div className="min-w-0 space-y-4">
  <div className="flex flex-wrap justify-end gap-2">
   <button type="button" onClick={()=>router.refresh()} className="min-h-10 rounded-md border px-3 text-sm">Refresh</button>
  </div>
  <VerificationFilterPanel key={JSON.stringify(query)} query={query} onApply={filters=>navigate({...filters,page:"1"})}/>
  <VerificationWorkspace key={activeTab+initialKind} rows={rows} counts={counts}
   initialTab={activeTab} initialKind={initialKind}
   onTabChange={tab=>navigate({tab,page:"1"})}
   onKindChange={kind=>navigate({kind:kind==="ALL"?"":kind,page:"1"})}
   onReview={row=>setSelected(row)}/>
  <nav aria-label="Verification pages" className="flex flex-wrap gap-3 text-sm">
   <span>Showing {rows.length} of {total} in this status</span>
   {page>1?<button type="button" onClick={()=>navigate({page:String(page-1)})} className="underline">Previous</button>:null}
   {hasMore?<button type="button" onClick={()=>navigate({page:String(page+1)})} className="underline">Next</button>:null}
  </nav>
  {selected?<VerificationReviewDrawer key={selected.learnerMembershipId+selected.section}
   row={selected} apiBase="/api/admin/verification"
   collegeId={collegeId} onClose={()=>setSelected(null)}
   onSaved={()=>{setSelected(null);router.refresh();}}/>:null}
 </div>;
}
