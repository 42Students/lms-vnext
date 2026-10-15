"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {TpoVerificationSwitch} from "./TpoVerificationSwitch";
import {VerificationExportControl} from "./VerificationExportControl";
import {VerificationFilterPanel} from "./VerificationFilterPanel";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {verificationAttentionShortcuts,verificationAttentionShortcutPatch} from "@/modules/verification/attention-shortcuts";
import {verificationSelectionKey,selectEligibleVerificationKeys} from "@/modules/verification/selection-model";
import {previewVerificationBulk} from "@/modules/verification/bulk-preview";
import type {VerificationFilterChoiceList} from "@/modules/verification/filter-options-model";
export function CollegeVerificationPanel({rows,counts,activeTab,initialKind,page,total,hasMore,pageSize,query,tpoCanVerify,batchChoices,branchChoices,classChoices}:{
 rows:VerificationQueueCard[];counts:Record<VerificationTab,number>;
 activeTab:VerificationTab;initialKind:"ALL"|"EDUCATION"|"IDENTITY";page:number;total:number;hasMore:boolean;pageSize:number;
 query:Record<string,string>;tpoCanVerify:boolean;batchChoices:VerificationFilterChoiceList;branchChoices:VerificationFilterChoiceList;classChoices:VerificationFilterChoiceList;
}){
 const router=useRouter(),[selected,setSelected]=useState<VerificationQueueCard|null>(null);
 const [selection,setSelection]=useState<Set<string>>(()=>new Set());
 const [bulkAction,setBulkAction]=useState<"VERIFY"|"SEND_BACK"|null>(null);
 const selectable=rows.filter(row=>row.status==="SUBMITTED"||row.status==="UPDATE_PENDING");
 const available=new Set(selectable.map(verificationSelectionKey));
 const selectedRows=selectable.filter(row=>selection.has(verificationSelectionKey(row)));
 function choose(row:VerificationQueueCard,checked:boolean){
  setSelection(current=>{
   const next=new Set([...current].filter(key=>available.has(key))),key=verificationSelectionKey(row);
   if(checked&&next.size<20)next.add(key);else if(!checked)next.delete(key);
   return next;
  });
 }
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
  <nav aria-label="Verification attention shortcuts" className="flex flex-wrap gap-2">
   {verificationAttentionShortcuts.map(item=><button type="button" key={item.attention} aria-pressed={query.attention===item.attention}
    onClick={()=>navigate(verificationAttentionShortcutPatch(item.attention))} className="rounded-md border px-3 py-2 text-sm">{item.label}</button>)}
   {query.attention&&query.attention!=="ALL"&&<button type="button" onClick={()=>navigate({attention:"ALL",page:"1"})} className="rounded-md border px-3 py-2 text-sm">All attention states</button>}
  </nav>
  <VerificationFilterPanel key={JSON.stringify(query)} query={query} batchChoices={batchChoices} branchChoices={branchChoices} classChoices={classChoices} onApply={changes=>navigate({...changes,page:"1"})}/>
  <VerificationWorkspace key={activeTab+initialKind} rows={rows} counts={counts}
   selectedKeys={new Set(selectedRows.map(verificationSelectionKey))} onSelectionChange={choose}
   initialTab={activeTab} initialKind={initialKind}
   onTabChange={tab=>navigate({tab,page:"1"})}
   onKindChange={kind=>navigate({kind:kind==="ALL"?"":kind,page:"1"})}
   onReview={row=>setSelected(row)}/>
  {activeTab==="WAITING"&&selectable.length>0&&<section aria-label="Bulk verification selection" className="space-y-3 rounded-md border p-3">
   <p role="status" className="text-sm">{selectedRows.length} of 20 requests selected on this page.</p>
   <div className="flex flex-wrap gap-2">
    <button type="button" onClick={()=>setSelection(selectEligibleVerificationKeys(selectable))} className="rounded-md border px-3 py-2 text-sm">Select first 20 waiting</button>
    <button type="button" onClick={()=>{setSelection(new Set());setBulkAction(null);}} className="rounded-md border px-3 py-2 text-sm">Clear selection</button>
    <button type="button" disabled={selectedRows.length===0} onClick={()=>setBulkAction("VERIFY")} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Preview verify</button>
    <button type="button" disabled={selectedRows.length===0} onClick={()=>setBulkAction("SEND_BACK")} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Preview send back</button>
   </div>
   {bulkAction&&<div className="space-y-2 rounded-md border p-3">
    <h2 className="font-semibold">Preview {bulkAction==="VERIFY"?"verify":"send back"}</h2>
    <p className="text-sm">{previewVerificationBulk(selectedRows,bulkAction).eligible.length} eligible and {previewVerificationBulk(selectedRows,bulkAction).skipped.length} skipped. No decisions have been saved.</p>
    <button type="button" onClick={()=>setBulkAction(null)} className="rounded-md border px-3 py-2 text-sm">Cancel preview</button>
   </div>}
  </section>}
  <nav aria-label="Verification pagination"
  <nav aria-label="Verification pagination" className="flex flex-wrap items-center gap-4 text-sm">
   <label>Sort by <select value={query.sort??"OLDEST"} onChange={event=>navigate({sort:event.target.value,page:"1"})} className="ml-2 rounded-md border bg-background p-2">
    <option value="OLDEST">Oldest first</option><option value="NEWEST">Newest first</option>
   </select></label>
   <label>Requests per page <select value={pageSize} onChange={event=>navigate({pageSize:event.target.value,page:"1"})} className="ml-2 rounded-md border bg-background p-2">
    <option value="10">10</option><option value="25">25</option><option value="50">50</option>
   </select></label>
   <span>Showing {rows.length} of {total} requests in the selected view</span>
   {page>1&&<button type="button" onClick={()=>navigate({page:String(page-1)})} className="underline">Previous page</button>}
   {hasMore&&<button type="button" onClick={()=>navigate({page:String(page+1)})} className="underline">Next page</button>}
  </nav>
  {selected&&<VerificationReviewDrawer key={selected.learnerMembershipId+selected.section}
   row={selected} onClose={()=>setSelected(null)} onSaved={()=>{setSelected(null);router.refresh();}}/>}
 </div>;
}
