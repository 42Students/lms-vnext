"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {TpoVerificationSwitch} from "./TpoVerificationSwitch";
import {VerificationExportControl} from "./VerificationExportControl";
import {VerificationFilterPanel} from "./VerificationFilterPanel";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import type {VerificationFilterChoiceList} from "@/modules/verification/filter-options-model";
export function CollegeVerificationPanel({rows,counts,activeTab,initialKind,page,total,hasMore,query,tpoCanVerify,batchChoices}:{
 rows:VerificationQueueCard[];counts:Record<VerificationTab,number>;
 activeTab:VerificationTab;initialKind:"ALL"|"EDUCATION"|"IDENTITY";page:number;total:number;hasMore:boolean;
 query:Record<string,string>;tpoCanVerify:boolean;batchChoices:VerificationFilterChoiceList;
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
  <TpoVerificationSwitch key={String(tpoCanVerify)} initialEnabled={tpoCanVerify}/>
  <div className="flex flex-wrap items-center justify-end gap-2">
   <VerificationExportControl query={Object.fromEntries(exportQuery)}/>
   <button type="button" onClick={()=>router.refresh()} className="rounded-md border px-3 py-2 text-sm">Refresh</button>
  </div>
  <VerificationFilterPanel key={JSON.stringify(query)} query={query} batchChoices={batchChoices} onApply={changes=>navigate({...changes,page:"1"})}/>
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
