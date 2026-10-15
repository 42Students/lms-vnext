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
import {collegeBulkReviewPayload} from "@/modules/verification/bulk-client-payload";
import type {BulkReviewOutcome} from "@/modules/verification/bulk-outcome";
import {bulkReviewFailureLabel} from "@/modules/verification/bulk-outcome";
import type {VerificationFilterChoiceList} from "@/modules/verification/filter-options-model";
export function CollegeVerificationPanel({rows,counts,activeTab,initialKind,page,total,hasMore,pageSize,query,tpoCanVerify,batchChoices,branchChoices,classChoices}:{
 rows:VerificationQueueCard[];counts:Record<VerificationTab,number>;
 activeTab:VerificationTab;initialKind:"ALL"|"EDUCATION"|"IDENTITY";page:number;total:number;hasMore:boolean;pageSize:number;
 query:Record<string,string>;tpoCanVerify:boolean;batchChoices:VerificationFilterChoiceList;branchChoices:VerificationFilterChoiceList;classChoices:VerificationFilterChoiceList;
}){
 const router=useRouter(),[selected,setSelected]=useState<VerificationQueueCard|null>(null);
 const [selection,setSelection]=useState<Set<string>>(()=>new Set());
 const [bulkAction,setBulkAction]=useState<"VERIFY"|"SEND_BACK"|null>(null);
 const [bulkBusy,setBulkBusy]=useState(false);
 const [bulkError,setBulkError]=useState("");
 const [bulkReason,setBulkReason]=useState("");
 const [bulkResult,setBulkResult]=useState<{summary:{attempted:number;succeeded:number;failed:number};outcomes:BulkReviewOutcome[]}|null>(null);
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
 async function executeBulk(action:"VERIFY"|"SEND_BACK",reason?:string){
  if(bulkBusy||selectedRows.length===0||selectedRows.length>20)return;
  const body=collegeBulkReviewPayload(selectedRows,action,reason);
  if(body.items.length===0)return;
  setBulkBusy(true);setBulkError("");setBulkResult(null);
  try{
   const response=await fetch("/api/college/verification/bulk-review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   if(!response.ok){
    const failure=await response.json().catch(()=>({error:"REQUEST_FAILED"})) as {error?:string};
    throw Error(failure.error??"Bulk review was not accepted");
   }
   const data=await response.json() as {summary:{attempted:number;succeeded:number;failed:number};outcomes:BulkReviewOutcome[]};
   setBulkResult(data);setSelection(new Set());setBulkAction(null);setBulkReason("");router.refresh();
  }catch(error){setBulkError(error instanceof Error?error.message:"Bulk review failed");}
  finally{setBulkBusy(false);}
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
   selectedKeys={new Set(selectedRows.map(verificationSelectionKey))} onSelectionChange={choose} disableLocalSearch
   initialTab={activeTab} initialKind={initialKind} sort={query.sort==="NEWEST"?"NEWEST":"OLDEST"}
   onTabChange={tab=>navigate({tab,page:"1",waitingState:tab==="WAITING"?query.waitingState??"ALL":""})}
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
    {bulkAction==="SEND_BACK"&&<label className="block text-sm">Correction reason for every selected request
     <textarea value={bulkReason} maxLength={500} onChange={event=>setBulkReason(event.target.value)}
      className="mt-1 min-h-20 w-full rounded-md border bg-background p-2" placeholder="Describe the correction required"/>
     <span className="mt-1 block text-xs">A shared reason of at least 3 characters is required and will be recorded for each learner.</span>
    </label>}
    {bulkAction==="SEND_BACK"&&<button type="button" disabled={bulkBusy||selectedRows.length===0||bulkReason.trim().length<3}
      onClick={()=>void executeBulk("SEND_BACK",bulkReason)} className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50">
      {bulkBusy?"Sending decisions…":"Confirm send back selected"}</button>}
    {bulkAction==="VERIFY"&&<button type="button" disabled={bulkBusy||selectedRows.length===0} onClick={()=>void executeBulk("VERIFY")}
     className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50">{bulkBusy?"Saving reviews…":"Confirm verify selected"}</button>}
    <button type="button" disabled={bulkBusy} onClick={()=>setBulkAction(null)} className="rounded-md border px-3 py-2 text-sm">Cancel preview</button>
   </div>}
  </section>}
  {bulkResult&&<section aria-label="Bulk review outcome" role="status" className="space-y-2 rounded-md border p-3">
   <h2 className="font-semibold">Bulk review results</h2>
   <p className="text-sm">{bulkResult.summary.succeeded} succeeded; {bulkResult.summary.failed} could not be decided. Review the individual outcomes below.</p>
   <ul className="space-y-1 text-sm">{bulkResult.outcomes.map(result=><li key={result.learnerMembershipId+":"+result.section}>
    {result.section} request {result.learnerMembershipId.slice(0,8)}: {bulkReviewFailureLabel(result.result)}
   </li>)}</ul>
   <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={()=>router.refresh()}>Refresh queue</button>
  </section>}
  {bulkError&&<p role="alert" className="rounded-md border p-3 text-sm">Bulk review failed: {bulkError}. No blanket success is assumed; refresh to inspect persisted decisions.</p>}
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
