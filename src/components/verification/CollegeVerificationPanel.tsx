"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { collegeVerificationLegacyCopy } from "@/modules/verification/college-legacy-verification-copy";
import { Banner } from "@/components/ui/banner";
import {ActionPagination} from "@/components/ui/action-pagination";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
 return <div className="min-w-0 space-y-5 md:space-y-6">
  <PageHeader title="Profile verification" description={collegeVerificationLegacyCopy.subtitle}/>

  {truncated?<Banner tone="warning">
   Showing the first 1,000 students in this view. Totals reflect this working set; narrow the filters to review other students.
  </Banner>:null}
  <div className="grid min-w-0 grid-cols-2 items-start gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto">
   <VerificationExportControl query={Object.fromEntries(exportQuery)}/>
   <Button variant="secondary" type="button" disabled={bulkBusy} className="min-h-11 sm:min-h-9" onClick={()=>{if(canNavigateCollegeVerificationQueue(bulkBusy))router.refresh();}} >Refresh</Button>
  </div>
  {reviewFeedback&&<Banner tone="info">{reviewFeedback}</Banner>}
  {activeTab==="WAITING"&&selectable.length>0&&<section aria-label="Review one by one" className="min-w-0 space-y-2 border-y border-[var(--lms-canvas-border)] py-3">
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Review one by one</h2>
    <p className="text-sm leading-[22px]">Each student&apos;s values next to their documents, with Verify and Send back. The next one opens by itself.</p>
    <Button variant="primary" type="button" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={bulkBusy} onClick={()=>{
      setSequential({keys:queueKeys,index:0});setSelected(selectable[0]??null);setReviewFeedback("");
    }} >
      Start with the first of {selectable.length}
    </Button>
  </section>}
  <div className="flex min-w-0 flex-wrap items-center gap-2">
   <NeedsDoingChips label="Needs doing:" selectedKey={query.attention}
    items={verificationAttentionShortcuts.map(item=>({key:item.attention,label:item.label}))}
    onSelect={key=>{
     const choice=verificationAttentionShortcuts.find(item=>item.attention===key);
     if(choice)navigate(verificationAttentionShortcutPatch(choice.attention));
    }}/>
   {query.attention&&query.attention!=="ALL"&&<Button variant="ghost" type="button"
    onClick={()=>navigate({attention:"ALL",page:"1"})}>All attention states</Button>}
  </div>
  <VerificationFilterPanel key={JSON.stringify(query)} query={query} batchChoices={batchChoices} branchChoices={branchChoices} classChoices={classChoices} programChoices={programChoices} onApply={changes=>navigate({...changes,page:"1"})}/>
  {activeTab==="WAITING"&&selectable.length>0&&<section aria-label="Bulk verification selection" className="min-w-0 space-y-3 border-y border-[var(--lms-canvas-border)] py-3">
   <p role="status" className="text-sm leading-[22px]">{selectedRows.length} of 20 requests selected on this page.</p>
   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={bulkBusy} onClick={()=>{setSelection(selectEligibleVerificationKeys(selectable));resetBulkFeedback();}} >Select first 20 waiting</Button>
    {selectedRows.length>0&&<Button variant="secondary" type="button" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={bulkBusy} onClick={()=>{setSelection(new Set());resetBulkFeedback();}} >Clear selection</Button>}
    {selectedRows.length>0&&<Button variant="primary" type="button" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={!canStartVerificationBulkPreview(bulkBusy,selectedRows.length)} onClick={()=>{setAcknowledged(false);setBulkReason("");setBulkAction("VERIFY");}} >Preview verify</Button>}
    {selectedRows.length>0&&<Button variant="secondary" type="button" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={!canStartVerificationBulkPreview(bulkBusy,selectedRows.length)} onClick={()=>{setAcknowledged(false);setBulkReason("");setBulkAction("SEND_BACK");}} >Preview send back</Button>}
   </div>
   {bulkAction&&<div className="min-w-0 space-y-3 border-t border-[var(--lms-canvas-border)] pt-3">
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Preview {bulkAction==="VERIFY"?"verify":"send back"}</h2>
    <p className="text-sm leading-[22px]">{preview?.eligible.length??0} eligible and {preview?.skipped.length??0} skipped. This is a local preview only; the server will recheck each document, role and row version.</p>
    <ul className="max-h-48 min-w-0 space-y-1 overflow-y-auto overscroll-contain text-[13px] leading-[22px]" aria-label="Selected review candidates">
     {preview?.eligible.map(item=><li key={item.key} className="break-words">{item.name} · {item.section} · version {item.version}</li>)}
     {preview?.skipped.map(item=><li key={item.key} className="break-words">{item.name} · {item.section}: skipped ({item.reason})</li>)}
     {missingProof.map(item=><li key={verificationSelectionKey(item)} className="break-words">{item.learnerName} · {item.section}: left out: {item.missingIdentityProof?"identity document is missing":"a marksheet is missing"}</li>)}
    </ul>
    {bulkAction==="SEND_BACK"&&<div className="flex min-w-0 flex-wrap gap-2">
      {(selectedRows.every(row=>row.section==="IDENTITY")
        ? tpoVerificationSectionReasons("IDENTITY")
        : selectedRows.every(row=>row.section==="EDUCATION")
          ? tpoVerificationSectionReasons("EDUCATION")
          : ["Submitted details do not match the document"] as const).map(reason=>
          <Button variant="secondary" key={reason} type="button" disabled={bulkBusy}
            onClick={()=>setBulkReason(reason)} >
            {reason}
          </Button>)}
    </div>}
    {bulkAction==="SEND_BACK"&&<label className="block text-sm">Correction reason for every selected request
     <Textarea disabled={bulkBusy} value={bulkReason} maxLength={500} onChange={event=>setBulkReason(event.target.value)}
      className="mt-1 min-h-20 w-full" placeholder="Or write what needs to change"/>
     <span className="mt-1 block text-xs leading-[20px]">A shared reason of at least 3 characters is required and will be recorded for each learner.</span>
     {bulkReason.trim().length<3?<span role="alert" className="mt-1 block text-xs text-error">Say what needs to change</span>:null}
    </label>}
    {bulkAction==="SEND_BACK"&&<Button variant="secondary" type="button" disabled={bulkBusy||selectedRows.length===0||bulkReason.trim().length<3}
      onClick={()=>void executeBulk("SEND_BACK",bulkReason)} >
      {bulkBusy?"Sending decisions…":"Confirm send back selected"}</Button>}
    {bulkAction==="VERIFY"&&<>
     <h3 className="font-semibold text-[16px] leading-[24px] text-[var(--lms-heading)]">Verify without opening</h3>
     <p className="text-sm leading-[22px]">Only do this when you have checked these students&apos; documents another way (for example against the college&apos;s own records). Each one is recorded with your name.</p>
     <label className="flex items-start gap-2 text-sm">
       <Checkbox checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/>
       I have checked their documents another way (for example the college&apos;s own records).
     </label>
     <p className="text-xs text-muted-foreground leading-[20px]">A missing marksheet or ID document blocks blind verification. The server rechecks document receipts before any decision.</p>
     <Button variant="secondary" type="button" disabled={bulkBusy||!acknowledged||(preview?.eligible.length??0)===0}
      onClick={()=>void executeBulk("VERIFY")}
      >{bulkBusy?"Saving reviews…":"Verify "+(preview?.eligible.length??0)+" without opening each"}</Button>
    </>}
    <Button variant="secondary" type="button" disabled={bulkBusy} onClick={()=>{setAcknowledged(false);setBulkAction(null);}} >Cancel preview</Button>
   </div>}
  </section>}
  <VerificationWorkspace key={activeTab+initialKind} rows={rows} counts={counts} legacyCollegeCopy hideHeader
   selectedKeys={new Set(selectedRows.map(verificationSelectionKey))} onSelectionChange={choose} selectionDisabled={bulkBusy} disableLocalSearch preserveServerOrder allowCollegeStudentLinks allowCollegeContactLinks
   initialTab={activeTab} initialKind={initialKind} sort={query.sort==="NAME"?"NAME":query.sort==="NEWEST"?"NEWEST":"OLDEST"}
   onTabChange={tab=>navigate({tab,page:"1",waitingState:tab==="WAITING"?query.waitingState??"ALL":"",ageBand:tab==="WAITING"?query.ageBand??"ANY":"",attention:tab!=="WAITING"&&["VERIFIED_DETAILS_CHANGED","WAITING_OVER_WEEK"].includes(query.attention)?"ALL":query.attention??"ALL"})}
   onKindChange={kind=>navigate({kind:kind==="ALL"?"":kind,page:"1",...(kind==="IDENTITY"?{marksheets:"ANY",attention:query.attention==="MISSING_MARKSHEET"?"ALL":query.attention}:{})})}
   onReview={row=>setSelected(row)}/>
  {bulkResult&&<section aria-label="Bulk review outcome" role="status" className="space-y-2 border-y border-[var(--lms-canvas-border)] py-3">
   <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Bulk review results</h2>
   <p className="text-sm leading-[22px]">{bulkResult.summary.succeeded} of {bulkResult.summary.attempted} succeeded; {bulkResult.summary.failed} could not be decided. Review the individual outcomes below.</p>
   <ul className="space-y-1 text-sm leading-[22px]">{bulkResult.labels.map(result=><li key={result.key}>
    {result.label} · {result.section}: {result.message}
   </li>)}</ul>
   <Button variant="secondary" type="button"  onClick={()=>router.refresh()}>Refresh queue</Button>
  </section>}
  {bulkError&&<Banner tone="error">Bulk review issue: {bulkError}. Check the per-row outcome before retrying; earlier successful decisions remain recorded.</Banner>}
  <section aria-label="Verification queue controls" className="grid min-w-0 gap-3 border-t border-[var(--lms-canvas-border)] pt-3 text-[13px] leading-[22px] sm:grid-cols-2 md:flex md:flex-wrap md:items-center">
   <label className="grid min-w-0 gap-1">Sort by <Select value={query.sort??"OLDEST"} onChange={event=>navigate({sort:event.target.value,page:"1"})} className="w-full md:w-auto">
    <option value="OLDEST">Oldest first</option><option value="NEWEST">Newest first</option><option value="NAME">Learner name A–Z</option>
   </Select></label>
   <label className="grid min-w-0 gap-1">Requests per page <Select value={pageSize} onChange={event=>navigate({pageSize:event.target.value,page:"1"})} className="w-full md:w-auto">
    <option value="10">10</option><option value="25">25</option><option value="50">50</option>
   </Select></label>
   <span className="min-w-0 break-words sm:col-span-2 md:col-span-1">Showing {rows.length} of {total} requests in the selected view</span>
   <ActionPagination label="Verification pagination" page={page}
    pageCount={Math.max(1,page+(hasMore?1:0))} hasMore={hasMore} disabled={bulkBusy}
    onPageChange={target=>navigate({page:String(target)})}/>
  </section>
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

  <details className="min-w-0 border-b border-border pb-3"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text md:min-h-9">The placement cell can verify profiles</summary><TpoVerificationSwitch key={String(tpoCanVerify)} initialEnabled={tpoCanVerify}/></details>
 </div>;
}
