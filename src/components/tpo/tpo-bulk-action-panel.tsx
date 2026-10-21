"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ScrollCue} from "@/components/ui/scroll-cue";

import {useRef,useState} from "react";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import {apiFetch} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {TpoBulkActionPreview} from "@/components/tpo/tpo-bulk-action-preview";
import {TpoSelectedReviewQueue} from "@/components/tpo/tpo-selected-review-queue";
import {tpoBulkActionLabel} from "@/modules/placements/tpo-bulk-workflow-model";
import {TPO_INELIGIBLE_REASONS} from "@/modules/placements/tpo-ineligible-reasons";
import {suggestTpoBulkAction,type TpoBulkActionCount} from "@/modules/placements/tpo-bulk-action-suggestion-model";
import {tpoReviewOneByOneHref} from "@/modules/placements/tpo-bulk-follow-up-model";
import type {BulkOutcome,BulkPreviewRow} from "@/modules/placements/tpo-bulk-action-model";
import {groupTpoBulkExceptions} from "@/modules/placements/tpo-bulk-exception-groups";
import {selectTpoBulkPage,toggleTpoBulkRow,canSelectTpoBulkRow,isTpoBulkPageSelected,isTpoBulkPreviewCurrent,canActOnEntireTpoView,TPO_BULK_UI_LIMIT,TPO_BULK_VIEW_LIMIT,
  type TpoBulkUiRow,matchTpoBulkRollNumbers} from "@/modules/placements/tpo-bulk-ui-model";

type Action="ELIGIBLE"|"INELIGIBLE"|"CLEAR_OVERRIDE"|"SHORTLISTED"|"REJECTED"|"ADD_NOTE"|"SEND_MESSAGE"|"MOVE_TEST"|"MOVE_INTERVIEW";
type PreviewPlan={
 target:"STUDENTS"|"APPLICATIONS";jobId?:string;action:Action;note:string;ids:string[];
};
type PreviewResponse={rows:BulkPreviewRow[];previewToken:string;counts:{ready:number;skipped:number}};
export function TpoBulkActionPanel({target,jobId,rows,allRows,viewCount=rows.length}:{target:"STUDENTS"|"APPLICATIONS";
 jobId?:string;rows:readonly TpoBulkUiRow[];allRows?:readonly TpoBulkUiRow[];viewCount?:number}){
 const router=useRouter();
 const [localSelection,setLocalSelection]=useState<string[]>([]);
 const shared=useTpoStudentsSelection();
 const selected=shared?.selected??localSelection;
 const setSelected=shared?.setSelected??setLocalSelection;
 const [action,setAction]=useState<Action>(target==="STUDENTS"?"ELIGIBLE":"SHORTLISTED");
 const [note,setNote]=useState("");
 const [pastedRolls,setPastedRolls]=useState("");
 const [rollFeedback,setRollFeedback]=useState("");
 const [copyFeedback,setCopyFeedback]=useState("");
 const [shareCopyFeedback,setShareCopyFeedback]=useState("");
 const [preview,setPreview]=useState<PreviewResponse|null>(null);
 const [plan,setPlan]=useState<PreviewPlan|null>(null);
 const [outcomes,setOutcomes]=useState<BulkOutcome[]>([]);
 const [runAuditId,setRunAuditId]=useState<string|null>(null);
 const [undoNotice,setUndoNotice]=useState("");
 const [actionCounts,setActionCounts]=useState<TpoBulkActionCount[]>([]);
 const [busy,setBusy]=useState(false);
 // React state updates are async: lock before the first network call so a rapid double-click cannot replay a mutation.
 const actionInFlightRef=useRef(false);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 const [companyShareUrl,setCompanyShareUrl]=useState<string|null>(null);
 const [shareDays,setShareDays]=useState(2);
 const [shareConfirmOpen,setShareConfirmOpen]=useState(false);
 const [acknowledged,setAcknowledged]=useState(false);
 const [error,setError]=useState("");
 const availableRows=allRows??rows;
 const labelsById=new Map(availableRows.map(row=>[row.id,row.label]));
 const exceptionGroups=groupTpoBulkExceptions(outcomes,labelsById);
 const previewWithNames=preview?.rows.map((row,index)=>({...row,
   label:labelsById.get(row.id)??"Selected row "+(index+1),
 }))??[];
 const permitted=new Set(availableRows.map(row=>row.id));
 const safeSelected=selected.filter(id=>permitted.has(id));
 function invalidate(){setAcknowledged(false);setPreview(null);setPlan(null);setOutcomes([]);setActionCounts([]);setError("");setRunAuditId(null);setUndoNotice("");}
 async function post(path:string,payload:unknown):Promise<unknown>{
  return apiFetch("/api/placements/tpo/bulk-actions/"+path,{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
  });
 }
 async function startPreview(choice:Action=action){
  if(actionInFlightRef.current||busy||safeSelected.length===0)return;
  if(target==="APPLICATIONS"&&note.trim().length<10){
   setError("Provide at least 10 characters of screening context.");return;
  }
  if(target==="STUDENTS"&&choice==="INELIGIBLE"&&note.trim().length<3){
   setError("Give a reason of at least 3 characters for ineligibility.");return;
  }
  const next:PreviewPlan={
    target,...(target==="APPLICATIONS"?{jobId}:{}),
    action:choice,note:target==="APPLICATIONS"||choice==="INELIGIBLE"?note.trim():"",ids:safeSelected.slice(0,TPO_BULK_UI_LIMIT),
  };
  actionInFlightRef.current=true;setBusy(true);invalidate();
  try{
   const result=await post("preview",next) as PreviewResponse;
   if(!Array.isArray(result.rows)||!result.previewToken)throw new Error("Could not read the preview. Please try again.");
   setAction(choice);setPreview(result);setPlan(next);
  }catch(cause){setError(cause instanceof Error?cause.message:"Preview unavailable. Refresh the roster and try again.");}
  finally{actionInFlightRef.current=false;setBusy(false);}
 }
 async function compareActions(){
  if(actionInFlightRef.current||busy||safeSelected.length===0||safeSelected.length>TPO_BULK_UI_LIMIT)return;
  if(target==="APPLICATIONS"&&note.trim().length<10){
   setError("Provide at least 10 characters of screening context.");return;
  }
  actionInFlightRef.current=true;setBusy(true);invalidate();
  try{
   const checks=await Promise.all(options.filter(option=>option.value!=="INELIGIBLE"||note.trim().length>=3).map(async option=>{
    const result=await post("preview",{
     target,...(target==="APPLICATIONS"?{jobId}:{}),
     action:option.value,note:target==="APPLICATIONS"||option.value==="INELIGIBLE"?note.trim():"",ids:safeSelected,
    }) as PreviewResponse;
    if(!Array.isArray(result.rows)||!result.previewToken)throw new Error("Could not verify action counts.");
    return {action:option.value,label:option.label,ready:result.counts.ready,
     skipped:result.counts.skipped,reasonSamples:[...new Set(result.rows.filter(row=>row.status==="skipped")
      .map(row=>row.reason).filter((v):v is string=>Boolean(v)))].slice(0,3)};
   }));
   setActionCounts(checks);
  }catch(cause){setError(cause instanceof Error?cause.message:"Action counts unavailable. Try again.");}
  finally{actionInFlightRef.current=false;setBusy(false);}
 }
 async function shareSelected(){
  if(actionInFlightRef.current||busy||target!=="APPLICATIONS"||!jobId||safeSelected.length===0)return;
  actionInFlightRef.current=true;setBusy(true);setError("");setCompanyShareUrl(null);
  try{
   const data=await apiFetch<{token:string}>("/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/company-shares",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({expiresInDays:shareDays,selectedApplicationIds:safeSelected}),
   });
   setCompanyShareUrl(new URL("/company-share/"+encodeURIComponent(data.token),window.location.origin).href);
   setShareCopyFeedback("");
   setShareConfirmOpen(false);
   router.refresh();
  }catch(error){setError(error instanceof Error?error.message:"Could not share selected candidates.");}
  finally{actionInFlightRef.current=false;setBusy(false);}
 }
 async function confirm(){
  if(actionInFlightRef.current||busy||!plan||!preview||preview.counts.ready===0||
     !isTpoBulkPreviewCurrent(plan.ids,[...permitted]))return;
  actionInFlightRef.current=true;setBusy(true);setError("");
  try{
   const response=await post("confirm",{
     ...plan,selections:preview.rows.map(row=>({id:row.id,version:row.version})),
     previewToken:preview.previewToken,confirmed:true,acknowledged,
   }) as {outcomes:BulkOutcome[];runAuditId?:string|null;summaryWarning?:string|null;summaryRecorded?:boolean};
   if(!Array.isArray(response.outcomes))throw new Error("Could not confirm the outcomes. Please refresh and try again.");
   setOutcomes(response.outcomes);
   setRunAuditId(response.runAuditId??null);
   // The optional aggregate event is written after independently committed rows.
   if(response.summaryRecorded===false)setError(response.summaryWarning??
    "Some changes were saved. Refresh and review the student history before retrying.");
   // A partially committed batch must leave skipped/failed students selected
   // for inspection. Only confirmed updated rows can be removed safely.
   const completed=new Set(response.outcomes.filter(row=>row.status==="updated").map(row=>row.id));
   setSelected(current=>current.filter(id=>!completed.has(id)));
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Confirmation failed. Preview again before retrying.");setPreview(null);setPlan(null);}
  finally{actionInFlightRef.current=false;setBusy(false);}
 }
 const options=target==="STUDENTS"
  ?([{value:"ELIGIBLE",label:"Mark eligible"},{value:"INELIGIBLE",label:"Make ineligible"},{value:"CLEAR_OVERRIDE",label:"Clear direct override"}] as const)
  :([{value:"SHORTLISTED",label:"Shortlist for review"},{value:"REJECTED",label:"Reject with candidate message"},{value:"ADD_NOTE",label:"Add a note"},{value:"SEND_MESSAGE",label:"Send a message"},{value:"MOVE_TEST",label:"Move to test round"},{value:"MOVE_INTERVIEW",label:"Move to interview round"}] as const);
 const suggested=suggestTpoBulkAction(actionCounts);
 async function undoLastRun(){
  if(!runAuditId||busy||actionInFlightRef.current)return;
  actionInFlightRef.current=true;setBusy(true);setUndoNotice("");setError("");
  try{
   const result=await apiFetch<{restored:number}>("/api/placements/tpo/bulk-actions/undo",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({confirmed:true,runAuditId}),
   });
   setUndoNotice("Undid "+result.restored+" student decision(s).");
   setRunAuditId(null);router.refresh();
  }catch{
   setError("This batch cannot be undone. A decision may have changed or the undo window expired.");
  }finally{actionInFlightRef.current=false;setBusy(false);}
 }
 if(rows.length===0)return null;
 return <section aria-label={target==="STUDENTS"?"Bulk student actions":"Bulk application actions"}
   className="min-w-0 space-y-4 border-y border-border py-4">
  <div><h2 className="font-semibold text-foreground">Actions · {target==="STUDENTS"?"Students":"Applications"}</h2>
   <p className="mt-1 text-sm text-body">
    Select eligible rows or act on all matching records in this filtered view (in verified batches of up to 200 per preview).
    Confirmation rechecks permission and versions; existing decisions are audited.
   </p></div>
  <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
   <p role="status" aria-live="polite" className="min-w-0 break-words text-sm text-body">Selected {safeSelected.length} of {viewCount} matching records (up to 200 processed in each confirmed batch).</p>
   <Button variant="secondary" type="button" className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9" disabled={busy||!canActOnEntireTpoView(viewCount,allRows)}
   onClick={()=>{setSelected(allRows!.map(row=>row.id));invalidate();}}
   >
   Act on all {viewCount} in this view
   </Button>
  </div>
  {viewCount>TPO_BULK_VIEW_LIMIT?<p role="status" className="text-sm text-warning-text">
    More than 5,000 records match. Narrow filters to enable an exact selection. No unpreviewed row is changed.
   </p>:null}
  {safeSelected.length>TPO_BULK_UI_LIMIT?<p role="status" className="text-sm text-body">
    {safeSelected.length} selected. Preview and confirm the next {Math.min(200,safeSelected.length)} rows;
    remaining rows stay selected for the following batch. Each batch must be reviewed and confirmed separately.
   </p>:null}
  {target==="STUDENTS"?<Disclosure title="Select by roll number" className="min-w-0 border-t border-border print:hidden" contentClassName="space-y-2 px-2 pb-3">
   <label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Paste roll numbers (comma, whitespace or line separated)
     <Textarea value={pastedRolls} onChange={event=>setPastedRolls(event.target.value)}
      rows={2} maxLength={40000} placeholder="23CS001, 23CS002" />
   </label>
   <Button variant="secondary" type="button" disabled={busy||!pastedRolls.trim()} 
     onClick={()=>{
      const matched=matchTpoBulkRollNumbers(availableRows,pastedRolls);
      setSelected(current=>selectTpoBulkPage([...current,...matched.ids]));
      setRollFeedback(matched.ids.length+" roll numbers matched in the currently authorized selection view; "+matched.unmatched.length+" not found here.");
      invalidate();
     }}>Select matching rolls</Button>
   {rollFeedback?<p role="status" className="text-xs text-muted-foreground">{rollFeedback}</p>:null}
   <p className="text-xs text-muted-foreground">Rolls outside these loaded rows cannot be selected by pasting. Use whole-batch search to locate them first.</p>
  </Disclosure>:null}
  <ScrollCue axis="y" label="Select applicants" className="min-w-0 border-y border-border" viewportClassName="max-h-64 space-y-0 p-2">
   <label className="flex min-h-11 items-center gap-2 p-2 text-sm">
    <Checkbox  disabled={busy} checked={isTpoBulkPageSelected(rows.map(row=>row.id),safeSelected)}
     onChange={e=>{const pageIds=rows.map(row=>row.id);setSelected(current=>e.target.checked?
      selectTpoBulkPage([...current.filter(id=>permitted.has(id)),...pageIds]):
      current.filter(id=>!pageIds.includes(id)));invalidate();}}/>
    Select current-page rows
   </label>
   {rows.map(row=><label key={row.id} className="flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] p-2 text-sm hover:bg-muted">
    <Checkbox  disabled={busy||!canSelectTpoBulkRow(safeSelected,row.id)} checked={safeSelected.includes(row.id)}
      onChange={e=>{setSelected(current=>toggleTpoBulkRow(current,row.id,e.target.checked));invalidate();}}/>
    <span className="min-w-0 break-words">{row.label}</span>
   </label>)}
  </ScrollCue>
  <Disclosure title="Selection tools" className="print:hidden" contentClassName="px-2 pb-3">
   <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
   <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={busy||safeSelected.length===0}
     onClick={()=>{setSelected([]);invalidate();}}
     >
     Clear selection
   </Button>
   {target==="STUDENTS"?<Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={busy||safeSelected.length===0}
    onClick={async()=>{
      try{
       await navigator.clipboard.writeText(safeSelected.map(id=>labelsById.get(id)??id).join("\n"));
       setCopyFeedback(safeSelected.length+" selected student rows copied.");
      }catch{setCopyFeedback("Could not copy selected student rows. Check browser clipboard permission.");}
    }}
    >Copy selected rows</Button>:null}
   {preview&&!busy?<Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={invalidate}
     >
     Cancel preview
   </Button>:null}
   </div>
  </Disclosure>
  {copyFeedback?<p role="status" className="text-xs text-muted-foreground">{copyFeedback}</p>:null}
  {runAuditId&&target==="STUDENTS"?<Button variant="secondary" type="button" disabled={busy||guardedPending}
   
   onClick={()=>void runGuarded(undoLastRun)}>Undo last student batch (five minutes)</Button>:null}
  {undoNotice?<p role="status" aria-live="polite" className="text-sm">{undoNotice}</p>:null}
  <div className="grid gap-3 md:grid-cols-2 print:hidden">
   <label className="min-w-0 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Action
    <Select className="mt-[6px] min-h-11 w-full md:min-h-9" value={action} disabled={busy}
      onChange={e=>{setAction(e.target.value as Action);invalidate();}}
      >
     {options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
    </Select>
   </label>
   {(target==="APPLICATIONS"||(target==="STUDENTS"&&action==="INELIGIBLE"))?<label className="min-w-0 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">{target==="STUDENTS"?"Ineligibility reason (required)":"Review context / private note / message"}
    {target==="STUDENTS"?<div className="mb-2 mt-2 flex flex-wrap gap-2" role="group" aria-label="Ineligibility reason presets">
      {TPO_INELIGIBLE_REASONS.map(preset=><Button variant="secondary" type="button" key={preset}
       disabled={busy} onClick={()=>{setNote(preset);invalidate();}}
       >{preset}</Button>)}
      <Button variant="secondary" type="button" disabled={busy} onClick={()=>{setNote("");invalidate();}}
       >Other</Button>
    </div>:null}
    <Textarea className="mt-[6px] w-full min-w-0" value={note} disabled={busy} maxLength={target==="STUDENTS"?200:1000} rows={2}
      onChange={e=>{setNote(e.target.value);invalidate();}}
      />
   </label>:null}
  </div>
  {target==="APPLICATIONS"?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-2 text-xs text-warning-text">
    Shortlist, Reject, Test and Interview stage moves are recorded separately for each applicant.
    Stage moves require a scheduled target round; they cannot be blindly undone after confirmation.
    To correct a result, open the applicant and record a new reviewed decision.
   </p>:null}
  <section aria-label="Actions window" className="min-w-0 space-y-3 border-t border-border pt-4">
   <h3 className="font-semibold">Actions</h3>
   <p className="text-sm text-body">Check how many selected rows can receive each action before you confirm any change.</p>
   {target==="STUDENTS"&&note.trim().length<3?<p className="text-xs text-muted-foreground">To include “Make ineligible” in the action counts, enter an ineligibility reason of at least 3 characters. No eligibility is changed while checking counts.</p>:null}
   <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy||safeSelected.length===0}
     onClick={()=>void compareActions()}
     >
     Check action counts
   </Button>
   {target==="APPLICATIONS"&&jobId&&safeSelected.length>0?<Disclosure title="Other actions" className="min-w-0 border-b border-border" contentClassName="min-w-0 space-y-2 px-2 pb-3">
     <p className="text-xs text-muted-foreground">Share only this selection using an expiring link. Every selected application is rechecked for a current shortlist before issuance. Review one by one opens each candidate&apos;s authorized detail.</p>
     <label className="flex flex-wrap items-center gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Link expires in
      <Select value={shareDays} onChange={event=>setShareDays(Number(event.target.value))}
        disabled={busy} >
       {[1,2,3,4,5,6,7].map(day=><option key={day} value={day}>{day} day{day===1?"":"s"}</option>)}
      </Select>
     </label>
     {safeSelected.length>200?<p role="status" className="text-xs text-warning-text">Select at most 200 currently shortlisted applications for one company link. Other rows are not shared.</p>:null}
     <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap print:hidden">
       <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={busy||safeSelected.length===0||safeSelected.length>200} onClick={()=>setShareConfirmOpen(true)}
        >
         Share {safeSelected.length} selected with the company
       </Button>
       <TpoSelectedReviewQueue jobId={jobId} rows={safeSelected.map(id=>({id,label:labelsById.get(id)??"Selected applicant"}))}/>
     </div>
     <Dialog open={shareConfirmOpen} onOpenChange={open=>{if(!busy&&!guardedPending)setShareConfirmOpen(open);}}
       title="Share selected applicants with the company"
       description={"Share exactly "+safeSelected.length+" currently shortlisted applications with the company? Anyone holding the link can view them until it expires."}
       footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
         <Button variant="secondary" className="w-full sm:w-auto" disabled={busy||guardedPending} onClick={()=>setShareConfirmOpen(false)}>Cancel</Button>
         <Button className="w-full sm:w-auto" loading={busy||guardedPending} disabled={!safeSelected.length||safeSelected.length>200}
          onClick={()=>void runGuarded(shareSelected)}>Confirm share</Button>
        </div>}>
        <p className="text-sm">Each application is checked again by the server. The private URL is shown only after sharing succeeds.</p>
      </Dialog>
      {companyShareUrl?<div className="min-w-0 space-y-2 border-b border-border py-3">
      <p className="text-xs font-semibold">Copy this URL now. The secret cannot be recovered later.</p>
      <Input className="w-full min-w-0" aria-label="Selected applicant share URL" readOnly value={companyShareUrl}
       onFocus={e=>e.currentTarget.select()} />
      <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
       onClick={()=>void navigator.clipboard.writeText(companyShareUrl).then(
        ()=>setShareCopyFeedback("Link copied."),()=>setShareCopyFeedback("Select the link field and copy it manually."))}>Copy link</Button>
      {shareCopyFeedback?<p role="status" className="max-w-[65ch] break-words text-xs text-body">{shareCopyFeedback}</p>:null}
     </div>:null}
     {safeSelected.length>1?<Disclosure title={`Review selected applicants individually (${safeSelected.length})`} className="text-sm">
       <ScrollCue axis="y" label="Selected applicant review links" viewportClassName="max-h-40"><ol className="mt-2 space-y-2">
         {safeSelected.map((id,index)=><li key={id}>
           <Link href={tpoReviewOneByOneHref(jobId,id)} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 focus-visible:underline">
             Applicant {index+1}
           </Link>
         </li>)}
       </ol></ScrollCue>
     </Disclosure>:null}
   </Disclosure>:null}
   {actionCounts.length>0?<div className="grid min-w-0 gap-0 overflow-hidden border-y border-border md:grid-cols-2">
     {safeSelected.length>200?<p className="col-span-full text-xs text-muted-foreground">Action counts apply to the next 200 selected records. Recheck each subsequent batch.</p>:null}
     {actionCounts.map(count=><div key={count.action} className="min-w-0 border-b border-r border-border px-3 py-3 text-sm last:border-r-0">
       <p className="font-semibold">{count.label}</p>
       <p>{count.ready} ready · {count.skipped} left out</p>
       {count.reasonSamples.map(reason=><p key={reason} className="mt-1 text-xs text-muted-foreground">{reason}</p>)}
     </div>)}
   </div>:null}
   {suggested?<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
     <p className="text-sm font-semibold">Suggested: {suggested.label}</p>
     <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy} onClick={()=>void startPreview(suggested.action as Action)}
       >Do it</Button>
   </div>:null}
  </section>
  {!preview&&outcomes.length===0?<Button variant="primary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={busy||safeSelected.length===0}
    onClick={()=>void startPreview()}
    >
    {busy?"Checking…":"Preview next "+Math.min(TPO_BULK_UI_LIMIT,safeSelected.length)+" selected"}
  </Button>:null}
  {preview&&plan&&!isTpoBulkPreviewCurrent(plan.ids,[...permitted])?
    <p role="status" className="text-sm text-warning">The roster changed. Select and preview these rows again.</p>:null}
  {preview&&plan&&["INELIGIBLE","REJECTED","SEND_MESSAGE","MOVE_TEST","MOVE_INTERVIEW"].includes(plan.action)?(
    <label className="flex min-h-11 items-start gap-3 border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm">
     <Checkbox  checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}
      disabled={busy||outcomes.length>0} className="mt-1"/>
     I understand this bulk action may change eligibility, reject applications, advance applicants to a scheduled round or notify students. I have reviewed the preview and left-out rows.
    </label>
  ):null}
  {preview&&plan&&isTpoBulkPreviewCurrent(plan.ids,[...permitted])?<TpoBulkActionPreview rows={previewWithNames} outcomes={outcomes}
    busy={busy||guardedPending||outcomes.length>0||(["INELIGIBLE","REJECTED","SEND_MESSAGE","MOVE_TEST","MOVE_INTERVIEW"].includes(plan.action)&&!acknowledged)} actionLabel={tpoBulkActionLabel(plan.action)} onConfirm={()=>void runGuarded(confirm)}/>:null}
  {outcomes.length>0&&target==="APPLICATIONS"?
    <p role="status" className="text-xs text-muted-foreground">
      Application decisions and messages are committed individually. Undo is unavailable for this batch; review each applicant to correct a decision.
    </p>:null}
  {outcomes.length>0?<div className="min-w-0 space-y-2 border-b border-border py-3">
    <p role="status" className="text-sm font-semibold">
     {outcomes.filter(item=>item.status==="updated").length} updated ·
     {" "}{outcomes.filter(item=>item.status!=="updated").length} not applied
    </p>
    {exceptionGroups.length>0?<div aria-label="Not applied by reason" className="min-w-0 space-y-2 border-b border-border py-3">
     <h3 className="text-sm font-semibold">Not applied by reason</h3>
     <ul className="space-y-2 text-sm">{exceptionGroups.map(group=><li key={group.reason}>
      <p className="font-semibold">{group.reason} ({group.count})</p>
      <p className="break-words text-body">{group.names.join(", ")}{group.count>group.names.length?", and "+(group.count-group.names.length)+" more":""}</p>
     </li>)}</ul>
    </div>:null}
    {safeSelected.length>0?<Button variant="primary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={busy} onClick={()=>void startPreview(plan?.action??action)}
     >
     Preview next batch ({Math.min(TPO_BULK_UI_LIMIT,safeSelected.length)} of {safeSelected.length} remaining)
    </Button>:null}
   {outcomes.some(item=>item.status!=="updated")?<div className="flex flex-wrap gap-2 print:hidden">
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>{
       const ids=outcomes.filter(item=>item.status!=="updated").map(item=>item.id);
       setSelected(ids);setPreview(null);setPlan(null);setOutcomes([]);setActionCounts([]);setError("");
     }} >
      Retry skipped/failed (preview again)
     </Button>
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>{
       const lines=outcomes.filter(item=>item.status!=="updated").map(item=>
        (labelsById.get(item.id)??item.id)+" — "+(item.reason??item.status));
       void navigator.clipboard.writeText(lines.join("\n")).then(
        ()=>setError("Failed-row details copied."),
        ()=>setError("Could not copy failed-row details."),
       );
     }} >
      Copy failed
     </Button>
    </div>:null}
   </div>:null}
  {error?<div className="min-w-0"><InlineNotice tone="error" message={error}/></div>:null}
 </section>;
}
