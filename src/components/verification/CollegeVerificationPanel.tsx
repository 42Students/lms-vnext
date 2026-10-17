"use client";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {tpoVerificationSectionReasons} from "@/modules/verification/review-reasons";
import {verificationSessionProgress,verificationSessionStopped,verificationSessionFinished} from "@/modules/verification/sequential-review-progress";
import {useState} from "react";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {TpoVerificationSwitch} from "./TpoVerificationSwitch";
import {VerificationExportControl} from "./VerificationExportControl";
import {VerificationFilterPanel} from "./VerificationFilterPanel";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {verificationAttentionShortcuts,verificationAttentionShortcutPatch} from "@/modules/verification/attention-shortcuts";
import {verificationSelectionKey,selectEligibleVerificationKeys} from "@/modules/verification/selection-model";
import {verificationBulkPreviewRows} from "@/modules/verification/bulk-preview-display";
import {collegeBulkReviewPayload} from "@/modules/verification/bulk-client-payload";
import {canStartVerificationBulkPreview,canNavigateCollegeVerificationQueue} from "@/modules/verification/bulk-action-guard";
import {emptyVerificationBulkFeedback} from "@/modules/verification/bulk-feedback-reset";
import {safeCollegeBulkReviewFailure} from "@/modules/verification/bulk-safe-error";
import {parseCollegeBulkReviewReceipt} from "@/modules/verification/bulk-response-validation";
import type {BulkReviewOutcome} from "@/modules/verification/bulk-outcome";
import {describeBulkReviewOutcomeRows} from "@/modules/verification/bulk-outcome";
import type {VerificationFilterChoiceList} from "@/modules/verification/filter-options-model";
export function CollegeVerificationPanel({rows,counts,activeTab,initialKind,page,total,hasMore,pageSize,query,tpoCanVerify,truncated=false,batchChoices,branchChoices,classChoices,programChoices}:{
 rows:VerificationQueueCard[];counts:Record<VerificationTab,number>;
 activeTab:VerificationTab;initialKind:"ALL"|"EDUCATION"|"IDENTITY";page:number;total:number;hasMore:boolean;pageSize:number;
 query:Record<string,string>;tpoCanVerify:boolean;truncated?:boolean;batchChoices:VerificationFilterChoiceList;branchChoices:VerificationFilterChoiceList;classChoices:VerificationFilterChoiceList;programChoices:VerificationFilterChoiceList;
}){
 const router=useRouter(),[selected,setSelected]=useState<VerificationQueueCard|null>(null);
 const [selection,setSelection]=useState<Set<string>>(()=>new Set());
 const [sequential,setSequential]=useState<{keys:string[];index:number}|null>(null);
 const [reviewFeedback,setReviewFeedback]=useState("");
 const [acknowledged,setAcknowledged]=useState(false);
 const [bulkAction,setBulkAction]=useState<"VERIFY"|"SEND_BACK"|null>(null);
 const [bulkBusy,setBulkBusy]=useState(false);
 const [bulkError,setBulkError]=useState("");
 const [bulkReason,setBulkReason]=useState("");
 const [bulkResult,setBulkResult]=useState<{summary:{attempted:number;succeeded:number;failed:number};outcomes:BulkReviewOutcome[];labels:ReturnType<typeof describeBulkReviewOutcomeRows>}|null>(null);
 const selectable=rows.filter(row=>row.status==="SUBMITTED"||row.status==="UPDATE_PENDING");
 const queueKeys=selectable.map(verificationSelectionKey);
 const sequenceLabel=sequential ? verificationSessionProgress(sequential.index,sequential.keys.length) : "";
 function nextInSequence(afterDecision=false) {
  if(!sequential)return;
  const nextIndex=sequential.index+1;
  if(nextIndex>=sequential.keys.length){
   setSelected(null);setSequential(null);
   if(!afterDecision)setReviewFeedback(verificationSessionFinished(sequential.keys.length));
   return;
  }
  const next=rows.find(item=>verificationSelectionKey(item)===sequential.keys[nextIndex]);
  if(!next){
   setSelected(null);setSequential(null);
   setReviewFeedback(verificationSessionStopped(sequential.index,sequential.keys.length)+" The next request is no longer on this page.");
   return;
  }
  setSequential({...sequential,index:nextIndex});setSelected(next);
 }
 function savedReview(action?:"VERIFY"|"SEND_BACK"){
  setReviewFeedback(action==="VERIFY"
   ? `${selected?.section==="EDUCATION"?"Education":"Identity"} verified. The student has been told.`
   : "Sent back. The student sees your reason.");
  if(sequential)nextInSequence(true);
  else setSelected(null);
  router.refresh();
 }
 const available=new Set(selectable.map(verificationSelectionKey));
 const selectedRows=selectable.filter(row=>selection.has(verificationSelectionKey(row)));
 const preview=bulkAction?verificationBulkPreviewRows(
  bulkAction==="VERIFY"?selectedRows.filter(row=>!row.missingMarksheet&&!row.missingIdentityProof):selectedRows,bulkAction):null;
 const missingProof=bulkAction==="VERIFY"?selectedRows.filter(row=>row.missingMarksheet||row.missingIdentityProof):[];
 function resetBulkFeedback(){setAcknowledged(false);const state=emptyVerificationBulkFeedback();
  setBulkAction(state.pendingAction);setBulkReason(state.reason);setBulkError(state.error);setBulkResult(state.result);
 }
 function choose(row:VerificationQueueCard,checked:boolean){
  if(bulkBusy)return;
  resetBulkFeedback();
  setSelection(current=>{
   const next=new Set([...current].filter(key=>available.has(key))),key=verificationSelectionKey(row);
   if(checked&&next.size<20)next.add(key);else if(!checked)next.delete(key);
   return next;
  });
 }
 async function executeBulk(action:"VERIFY"|"SEND_BACK",reason?:string){
  if(bulkBusy||selectedRows.length===0||selectedRows.length>20||
    (action==="VERIFY"&&!acknowledged))return;
  const body=collegeBulkReviewPayload(action==="VERIFY" ? selectedRows.filter(row=>!row.missingMarksheet&&!row.missingIdentityProof) : selectedRows,action,reason);
  if(body.items.length===0){setBulkError("Every one picked has a document missing. Open them to send back with a reason.");return;}
  setBulkBusy(true);setBulkError("");setBulkResult(null);
  try{
   const payload=await apiFetch<unknown>("/api/college/verification/bulk-review",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   const data=parseCollegeBulkReviewReceipt(payload,body.items);
   setBulkResult({...data,labels:describeBulkReviewOutcomeRows(data.outcomes,selectedRows)});
   setReviewFeedback(action==="VERIFY"
    ? `${data.summary.succeeded} verified. The students have been told.`
    : `${data.summary.succeeded} sent back. The students see your reason.`);
   if(data.summary.failed)setBulkError(`${data.summary.failed} item(s) could not be completed; review the row outcomes.`);
   setSelection(new Set());setBulkAction(null);setBulkReason("");router.refresh();
  }catch(error){setBulkError(safeCollegeBulkReviewFailure(error));}
  finally{setBulkBusy(false);}
 }
 function navigate(patch:Record<string,string>){
  if(!canNavigateCollegeVerificationQueue(bulkBusy))return;
  setSelected(null);setSequential(null);
  setSelection(new Set());resetBulkFeedback();
  const params=new URLSearchParams(query);
  Object.entries(patch).forEach(([key,value])=>{if(value)params.set(key,value);else params.delete(key);});
  router.push("/college/verification?"+params.toString());
 }
 const exportQuery=new URLSearchParams(query);
 exportQuery.set("tab",activeTab);
 return <div className="min-w-0 space-y-4">
  <TpoVerificationSwitch key={String(tpoCanVerify)} initialEnabled={tpoCanVerify}/>
  {truncated?<p role="status" className="rounded-lg border border-warning bg-surface p-3 text-sm text-body">
   Showing the first 1,000 students in this view. Totals reflect this working set; narrow the filters to review other students.
  </p>:null}
  <div className="flex flex-wrap items-center justify-end gap-2">
   <VerificationExportControl query={Object.fromEntries(exportQuery)}/>
   <button type="button" disabled={bulkBusy} onClick={()=>{if(canNavigateCollegeVerificationQueue(bulkBusy))router.refresh();}} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Refresh</button>
  </div>
  {reviewFeedback&&<p role="status" className="rounded-md border p-3 text-sm">
    {reviewFeedback}
  </p>}
  {activeTab==="WAITING"&&selectable.length>0&&<section aria-label="Review one by one" className="space-y-2 rounded-md border p-3">
    <h2 className="font-semibold">Review one by one</h2>
    <p className="text-sm">Each student&apos;s values next to their documents, with Verify and Send back. The next one opens by itself.</p>
    <button type="button" disabled={bulkBusy} onClick={()=>{
      setSequential({keys:queueKeys,index:0});setSelected(selectable[0]??null);setReviewFeedback("");
    }} className="rounded-md border px-3 py-2 text-sm font-semibold">
      Start with the first of {selectable.length}
    </button>
  </section>}
  <nav aria-label="Verification attention shortcuts" className="flex flex-wrap gap-2">
   {verificationAttentionShortcuts.map(item=><button type="button" key={item.attention} aria-pressed={query.attention===item.attention}
    onClick={()=>navigate(verificationAttentionShortcutPatch(item.attention))} className="rounded-md border px-3 py-2 text-sm">{item.label}</button>)}
   {query.attention&&query.attention!=="ALL"&&<button type="button" onClick={()=>navigate({attention:"ALL",page:"1"})} className="rounded-md border px-3 py-2 text-sm">All attention states</button>}
  </nav>
  <VerificationFilterPanel key={JSON.stringify(query)} query={query} batchChoices={batchChoices} branchChoices={branchChoices} classChoices={classChoices} programChoices={programChoices} onApply={changes=>navigate({...changes,page:"1"})}/>
  <VerificationWorkspace key={activeTab+initialKind} rows={rows} counts={counts} legacyCollegeCopy
   selectedKeys={new Set(selectedRows.map(verificationSelectionKey))} onSelectionChange={choose} selectionDisabled={bulkBusy} disableLocalSearch preserveServerOrder allowCollegeStudentLinks allowCollegeContactLinks
   initialTab={activeTab} initialKind={initialKind} sort={query.sort==="NAME"?"NAME":query.sort==="NEWEST"?"NEWEST":"OLDEST"}
   onTabChange={tab=>navigate({tab,page:"1",waitingState:tab==="WAITING"?query.waitingState??"ALL":"",ageBand:tab==="WAITING"?query.ageBand??"ANY":"",attention:tab!=="WAITING"&&["VERIFIED_DETAILS_CHANGED","WAITING_OVER_WEEK"].includes(query.attention)?"ALL":query.attention??"ALL"})}
   onKindChange={kind=>navigate({kind:kind==="ALL"?"":kind,page:"1",...(kind==="IDENTITY"?{marksheets:"ANY",attention:query.attention==="MISSING_MARKSHEET"?"ALL":query.attention}:{})})}
   onReview={row=>setSelected(row)}/>
  {activeTab==="WAITING"&&selectable.length>0&&<section aria-label="Bulk verification selection" className="space-y-3 rounded-md border p-3">
   <p role="status" className="text-sm">{selectedRows.length} of 20 requests selected on this page.</p>
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={bulkBusy} onClick={()=>{setSelection(selectEligibleVerificationKeys(selectable));resetBulkFeedback();}} className="rounded-md border px-3 py-2 text-sm">Select first 20 waiting</button>
    <button type="button" disabled={bulkBusy} onClick={()=>{setSelection(new Set());resetBulkFeedback();}} className="rounded-md border px-3 py-2 text-sm">Clear selection</button>
    <button type="button" disabled={!canStartVerificationBulkPreview(bulkBusy,selectedRows.length)} onClick={()=>{setBulkReason("");setBulkAction("VERIFY");}} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Preview verify</button>
    <button type="button" disabled={!canStartVerificationBulkPreview(bulkBusy,selectedRows.length)} onClick={()=>{setBulkReason("");setBulkAction("SEND_BACK");}} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Preview send back</button>
   </div>
   {bulkAction&&<div className="space-y-2 rounded-md border p-3">
    <h2 className="font-semibold">Preview {bulkAction==="VERIFY"?"verify":"send back"}</h2>
    <p className="text-sm">{preview?.eligible.length??0} eligible and {preview?.skipped.length??0} skipped. This is a local preview only; the server will recheck each document, role and row version.</p>
    <ul className="max-h-48 space-y-1 overflow-y-auto text-sm" aria-label="Selected review candidates">
     {preview?.eligible.map(item=><li key={item.key} className="break-words">{item.name} · {item.section} · version {item.version}</li>)}
     {preview?.skipped.map(item=><li key={item.key} className="break-words">{item.name} · {item.section}: skipped ({item.reason})</li>)}
     {missingProof.map(item=><li key={verificationSelectionKey(item)} className="break-words">{item.learnerName} · {item.section}: left out: {item.missingIdentityProof?"identity document is missing":"a marksheet is missing"}</li>)}
    </ul>
    {bulkAction==="SEND_BACK"&&<div className="flex flex-wrap gap-2">
      {(selectedRows.every(row=>row.section==="IDENTITY")
        ? tpoVerificationSectionReasons("IDENTITY")
        : selectedRows.every(row=>row.section==="EDUCATION")
          ? tpoVerificationSectionReasons("EDUCATION")
          : ["Submitted details do not match the document"] as const).map(reason=>
          <button key={reason} type="button" disabled={bulkBusy}
            onClick={()=>setBulkReason(reason)} className="rounded-md border px-3 py-2 text-xs">
            {reason}
          </button>)}
    </div>}
    {bulkAction==="SEND_BACK"&&<label className="block text-sm">Correction reason for every selected request
     <textarea disabled={bulkBusy} value={bulkReason} maxLength={500} onChange={event=>setBulkReason(event.target.value)}
      className="mt-1 min-h-20 w-full rounded-md border bg-background p-2" placeholder="Describe the correction required"/>
     <span className="mt-1 block text-xs">A shared reason of at least 3 characters is required and will be recorded for each learner.</span>
    </label>}
    {bulkAction==="SEND_BACK"&&<button type="button" disabled={bulkBusy||selectedRows.length===0||bulkReason.trim().length<3}
      onClick={()=>void executeBulk("SEND_BACK",bulkReason)} className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50">
      {bulkBusy?"Sending decisions…":"Confirm send back selected"}</button>}
    {bulkAction==="VERIFY"&&<>
     <h3 className="font-semibold">Verify without opening</h3>
     <p className="text-sm">Only do this when you have checked these students&apos; documents another way (for example against the college&apos;s own records). Each one is recorded with your name.</p>
     <label className="flex items-start gap-2 text-sm">
       <input type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/>
       I have checked their documents another way (for example the college&apos;s own records).
     </label>
     <p className="text-xs text-muted-foreground">A missing marksheet or ID document blocks blind verification. The server rechecks document receipts before any decision.</p>
     <button type="button" disabled={bulkBusy||!acknowledged||(preview?.eligible.length??0)===0}
      onClick={()=>void executeBulk("VERIFY")}
      className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50">{bulkBusy?"Saving reviews…":"Verify "+(preview?.eligible.length??0)+" without opening each"}</button>
    </>}
    <button type="button" disabled={bulkBusy} onClick={()=>setBulkAction(null)} className="rounded-md border px-3 py-2 text-sm">Cancel preview</button>
   </div>}
  </section>}
  {bulkResult&&<section aria-label="Bulk review outcome" role="status" className="space-y-2 rounded-md border p-3">
   <h2 className="font-semibold">Bulk review results</h2>
   <p className="text-sm">{bulkResult.summary.succeeded} of {bulkResult.summary.attempted} succeeded; {bulkResult.summary.failed} could not be decided. Review the individual outcomes below.</p>
   <ul className="space-y-1 text-sm">{bulkResult.labels.map(result=><li key={result.key}>
    {result.label} · {result.section}: {result.message}
   </li>)}</ul>
   <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={()=>router.refresh()}>Refresh queue</button>
  </section>}
  {bulkError&&<p role="alert" className="rounded-md border p-3 text-sm">Bulk review issue: {bulkError}. Check the per-row outcome before retrying; earlier successful decisions remain recorded.</p>}
  <nav aria-label="Verification pagination" className="flex flex-wrap items-center gap-4 text-sm">
   <label>Sort by <select value={query.sort??"OLDEST"} onChange={event=>navigate({sort:event.target.value,page:"1"})} className="ml-2 rounded-md border bg-background p-2">
    <option value="OLDEST">Oldest first</option><option value="NEWEST">Newest first</option><option value="NAME">Learner name A–Z</option>
   </select></label>
   <label>Requests per page <select value={pageSize} onChange={event=>navigate({pageSize:event.target.value,page:"1"})} className="ml-2 rounded-md border bg-background p-2">
    <option value="10">10</option><option value="25">25</option><option value="50">50</option>
   </select></label>
   <span>Showing {rows.length} of {total} requests in the selected view</span>
   {page>1&&<button type="button" onClick={()=>navigate({page:String(page-1)})} className="underline">Previous page</button>}
   {hasMore&&<button type="button" onClick={()=>navigate({page:String(page+1)})} className="underline">Next page</button>}
  </nav>
  {selected&&<VerificationReviewDrawer key={selected.learnerMembershipId+selected.section}
    row={selected}
    sequenceProgress={sequential?sequenceLabel:undefined}
    onNext={sequential?()=>nextInSequence():undefined}
    onFinish={sequential?()=>{setSelected(null);setSequential(null);
      setReviewFeedback(verificationSessionStopped(sequential.index,sequential.keys.length));}:undefined}
    onClose={()=>{if(sequential)setReviewFeedback(
      verificationSessionStopped(sequential.index,sequential.keys.length));
      setSelected(null);setSequential(null);}}
    onSaved={savedReview}/>}

 </div>;
}
