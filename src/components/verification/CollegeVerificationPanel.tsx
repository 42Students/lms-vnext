"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {TpoVerificationSwitch} from "./TpoVerificationSwitch";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
export function CollegeVerificationPanel({rows,counts,activeTab,initialKind,page,total,hasMore,query}:{
 rows:VerificationQueueCard[];counts:Record<VerificationTab,number>;
 activeTab:VerificationTab;initialKind:"ALL"|"EDUCATION"|"IDENTITY";page:number;total:number;hasMore:boolean;
 query:Record<string,string>;
}){
 const router=useRouter(),[selected,setSelected]=useState<VerificationQueueCard|null>(null);
 function navigate(patch:Record<string,string>){
  const params=new URLSearchParams(query);
  Object.entries(patch).forEach(([key,value])=>{if(value)params.set(key,value);else params.delete(key);});
  router.push("/college/verification?"+params.toString());
 }
 const exportQuery=new URLSearchParams(query);
 exportQuery.set("tab",activeTab);
 return <div className="min-w-0 space-y-4">
  <TpoVerificationSwitch/>
  <div className="flex flex-wrap items-center justify-end gap-2">
   <a href={`/api/college/verification/export?${exportQuery.toString()}`} className="rounded-md border px-3 py-2 text-sm">Export CSV</a>
   <button type="button" onClick={()=>router.refresh()} className="rounded-md border px-3 py-2 text-sm">Refresh</button>
  </div>
  <VerificationWorkspace key={activeTab+initialKind} rows={rows} counts={counts}
   initialTab={activeTab} initialKind={initialKind}
   onTabChange={tab=>navigate({tab,page:"1"})}
   onKindChange={kind=>navigate({kind:kind==="ALL"?"":kind,page:"1"})}
   onReview={row=>setSelected(row)}/>
  <nav aria-label="Verification pagination" className="flex flex-wrap items-center gap-4 text-sm">
   <span>Showing {rows.length} of {total} requests in the selected view</span>
   {page>1&&<button type="button" onClick={()=>navigate({page:String(page-1)})} className="underline">Previous page</button>}
   {hasMore&&<button type="button" onClick={()=>navigate({page:String(page+1)})} className="underline">Next page</button>}
  </nav>
  {selected&&<VerificationReviewDrawer key={selected.learnerMembershipId+selected.section}
   row={selected} onClose={()=>setSelected(null)} onSaved={()=>{setSelected(null);router.refresh();}}/>}
 </div>;
}
