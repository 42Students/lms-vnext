"use client";
import Link from "next/link";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useToast} from "@/components/ui/toast";
import {COLLEGE_APPLICATION_STAGES,COLLEGE_APPLICATION_TRANSITIONS,collegeStageMoveFeedback} from "@/modules/placements/college-stage-action-model";
import {driveApplicationsHref,type DriveApplicationsQuery} from "@/modules/placements/college-drive-applications-model";
import {CollegeApplicationDetailDrawer,type CollegeApplicationDetail} from "./college-application-detail-drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, applicationStatusTone } from "@/components/ui/status-badge";
type Row={id:string;name:string|null;email:string|null;collegeName:string;ageDays:number;
 source:string;submittedAt:Date|string;rollNumber:string|null;roleTitle:string;
 status:string;screening:string|null;screeningScore?:number|null;partialScore?:number|null;
 stage:string;previousStage:string|null;stageVersion:number|null;
 allowedNextStages?:readonly string[];stageMovedByName?:string|null;stageMovedAt?:string|null;};
const transitions=COLLEGE_APPLICATION_TRANSITIONS;
const istDateTime=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
const istDay=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"});
function stageAge(row:Row){
 const start=new Date(row.stageMovedAt??row.submittedAt).getTime();
 if(!Number.isFinite(start))return null;
 return Math.max(0,Math.floor((Date.now()-start)/86400000));
}
const stageLabel=(stage:string)=>stage.replaceAll("_"," ").toLowerCase()
 .replace(/(^|\s)\S/g,match=>match.toUpperCase());
export function CollegeApplicationPipelineControls({jobId,rows,total,query,basePath="/college/placements",initialDetailId=null,legacyShortlisted=false}:{jobId:string;rows:Row[];total:number;query:DriveApplicationsQuery;basePath?: "/college/placements"|"/admin/placements";initialDetailId?:string|null;legacyShortlisted?:boolean}){
 const router=useRouter();
 const {showToast}=useToast();
 // A late network reply from the previous selected college must not open a
 // drawer or change row selections in the new workspace.
 const scopeEpoch=useRef(0);
 const savingRef=useRef(false);
 const activeScope=jobId+"|"+basePath;
 const filterScope=JSON.stringify({...query,page:1});
 const [failedDetailId,setFailedDetailId]=useState<string|null>(null);
 const [selected,setSelected]=useState<string[]>([]);
 const [showLegacyExtraColumns,setShowLegacyExtraColumns]=useState(false);
 const [allMatching,setAllMatching]=useState(false);
 const [detailId,setDetailId]=useState<string|null>(null);
 const [detailPayload,setDetailPayload]=useState<CollegeApplicationDetail|null>(null);
 const [target,setTarget]=useState<string>("SHORTLISTED");
 const [reason,setReason]=useState("");
 const [assessmentUrl,setAssessmentUrl]=useState("");
 const [saveAssessmentUrlToJob,setSaveAssessmentUrlToJob]=useState(true);
 const [action,setAction]=useState<"MOVE"|"REINSTATE"|"CORRECT">("MOVE");
 const [notifyLearnerInApp,setNotifyLearnerInApp]=useState(true);
 const [dialog,setDialog]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [transitionWarning,setTransitionWarning]=useState<{id:string;message:string}|null>(null);
 const [staleConflict,setStaleConflict]=useState(false);
 type MoveOutcome={applicationId:string;status:string;reason?:string;
  undoEventId?:string;undoUntil?:string;stageVersion?:number};
 const [outcome,setOutcome]=useState<{moved:number;skipped:number;
  results:MoveOutcome[]}|null>(null);
 const [undoBusyId,setUndoBusyId]=useState<string|null>(null);
 // A stale write must wait for the next authorized server snapshot.
 useEffect(()=>{setStaleConflict(false);},[rows]);
 useEffect(()=>{
  scopeEpoch.current+=1;
  setSelected([]);setAllMatching(false);setDetailId(null);setDetailPayload(null);
  setDialog(false);setConfirmDiscard(false);setBusy(false);setError("");setOutcome(null);setFailedDetailId(null);
  setAssessmentUrl("");setSaveAssessmentUrlToJob(true);
 },[activeScope]);
 useEffect(()=>{
  // Reject late drawer replies after filter changes, but preserve explicit
  // selected application UUIDs across pages/filters of this same drive.
  // Mutations revalidate every selected UUID against current server eligibility.
  scopeEpoch.current+=1;
  setAllMatching(false);setDetailId(null);setDetailPayload(null);
  setFailedDetailId(null);setDialog(false);setConfirmDiscard(false);setError("");setOutcome(null);
  setAssessmentUrl("");setSaveAssessmentUrlToJob(true);
 },[filterScope]);
 useEffect(()=>{
  // The detail API separately rechecks selected-college access.
  if(initialDetailId)void openDetail(initialDetailId);
 },[activeScope,initialDetailId,filterScope]);
 const eligible=rows.filter(r=>r.status==="SUBMITTED");
 const allPage=eligible.length>0&&eligible.every(r=>selected.includes(r.id));
 const selectedCount=allMatching?total:selected.length;
 const rowMap=useMemo(()=>new Map(rows.map(r=>[r.id,r])),[rows]);
 function toggle(id:string){setAllMatching(false);setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 async function openDetail(id:string){
  const epoch=scopeEpoch.current;
  setError("");setFailedDetailId(null);
  try{
   const body=await apiFetch<CollegeApplicationDetail>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+
    "/applications/"+encodeURIComponent(id),{cache:"no-store"});
   if(scopeEpoch.current!==epoch)return;
   if(!body?.application||body.application.id!==id)
    throw Error("Could not load this application. Please try again.");
   setDetailPayload(body);
   setDetailId(id);
  }catch(reason){
   if(scopeEpoch.current!==epoch)return;
   setFailedDetailId(id);
   setError(reason instanceof Error?reason.message:friendlyApiError({}));
  }
 }
 function selectRow(row:Row,next:string){
  if(next!=="REINSTATE"&&next!=="CORRECT_APPLIED"&&
    !(row.allowedNextStages??transitions[row.stage]??[]).includes(next)){
    setTransitionWarning({id:row.id,message:"Cannot move from "+stageLabel(row.stage)+" to "+stageLabel(next)});
    return;
  }
  setTransitionWarning(null);
  const correction=next==="CORRECT_APPLIED";
  setAllMatching(false);setSelected([row.id]);setTarget(correction?"APPLIED":next);
  setAction(correction?"CORRECT":next==="REINSTATE"?"REINSTATE":"MOVE");
  setReason("");setOutcome(null);setError("");setAssessmentUrl("");
  setSaveAssessmentUrlToJob(true);setDialog(true);
 }
 function closeMoveDialog(){
  if(busy)return;
  // The optional reject explanation must survive Escape, overlay click and
  // Close until the operator explicitly confirms discarding it.
  if(!outcome&&(reason.trim()||assessmentUrl.trim())){
   setConfirmDiscard(true);return;
  }
  setDialog(false);setError("");setOutcome(null);
 }
 function discardMoveDraft(){
  setConfirmDiscard(false);setDialog(false);setReason("");
  setAssessmentUrl("");setError("");setOutcome(null);
 }
 function chooseBulk(next:string){
  setAction(next==="REINSTATE"?"REINSTATE":"MOVE");setTarget(next);setReason("");
  setAssessmentUrl("");setSaveAssessmentUrlToJob(true);
  setOutcome(null);setError("");setDialog(true);
 }
 async function save(){
  if(!selectedCount||(action==="CORRECT"&&reason.trim().length<10)||busy||savingRef.current)return;
  const assessment=assessmentUrl.trim();
  if(action==="MOVE"&&target==="ASSESSMENT"&&assessment){
   try{
    const url=new URL(assessment);
    if(!["http:","https:"].includes(url.protocol)||!url.hostname||url.username||url.password||assessment.length>2048)
     throw Error("Invalid assessment URL");
   }catch{
    setError("Must be a valid URL starting with http:// or https://");return;
   }
  }
  if(staleConflict){router.refresh();return;}
  savingRef.current=true;
  const epoch=scopeEpoch.current;
  setBusy(true);setError("");setOutcome(null);
  try{
   const payload=await apiFetch<{moved?:number;skipped?:number;results?:MoveOutcome[]}>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/pipeline",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,applicationIds:allMatching?[]:selected,
      matchingFilter:allMatching?query:undefined,stage:action!=="REINSTATE"?target:undefined,
      reason:reason.trim(),notifyByEmail:false,notifyLearnerInApp,confirmed:true,
      ...(action==="MOVE"&&target==="ASSESSMENT"&&assessment?{
       assessmentUrl:assessment,saveAssessmentUrlToJob,
      }:{}),
     }),
   });
   if(scopeEpoch.current!==epoch)return;
   const moved=payload.moved??0,skipped=payload.skipped??0;
   setOutcome({moved,skipped,results:payload.results??[]});
   setAllMatching(false);
   setSelected(payload.results?.filter(r=>r.status==="skipped").map(r=>r.applicationId).slice(0,100)??[]);
   const held=payload.results?.filter(item=>item.undoEventId).length??0;
   const feedback=collegeStageMoveFeedback(action,target,moved,skipped);
   showToast({tone:skipped?"info":"success",
    title:feedback.title,
    description:held?held+" learner notifications are held for 30 seconds for safe undo. Other updates are notified in-app.":
     skipped?"Review skipped applicants and retry after refreshing.":notifyLearnerInApp?"Candidates were notified in-app.":"No learner notification was requested."});
   router.refresh();
  }catch(e){
   if(scopeEpoch.current!==epoch)return;
   if(e instanceof FriendlyFetchError&&e.status===409){
    setStaleConflict(true);
    setError("Application status has changed since this page loaded. Refresh the current stages before retrying.");
   }else{
    const message=e instanceof Error?e.message:friendlyApiError({});
    setError(collegeStageMoveFeedback(action,target,0,0).failurePrefix+message);
   }
  }finally{
   savingRef.current=false;
   if(scopeEpoch.current===epoch)setBusy(false);
  }
 }
 async function undoMove(item:MoveOutcome){
  if(!item.undoEventId||!item.undoUntil||!item.stageVersion||undoBusyId||busy)return;
  if(Date.now()>=Date.parse(item.undoUntil)){
   setError("Too late to undo: the students have already been told");return;
  }
  const epoch=scopeEpoch.current;
  setUndoBusyId(item.applicationId);setError("");
  try{
   await apiFetch<{undone:boolean;stage:string}>(
    "/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/pipeline/undo",{
     method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify({applicationId:item.applicationId,undoEventId:item.undoEventId,
      expectedStageVersion:item.stageVersion,confirmed:true}),
    });
   if(scopeEpoch.current!==epoch)return;
   setOutcome(old=>old?{...old,moved:Math.max(0,old.moved-1),
    results:old.results.map(row=>row.applicationId===item.applicationId?{
     ...row,status:"undone",undoEventId:undefined,undoUntil:undefined,
    }:row)}:null);
   showToast({tone:"success",title:"Stage change undone",
    description:"The delayed learner notification was cancelled before delivery."});
   router.refresh();
  }catch(cause){
   if(scopeEpoch.current!==epoch)return;
   setError(cause instanceof Error?cause.message:"Could not undo stage change.");
  }finally{
   if(scopeEpoch.current===epoch)setUndoBusyId(null);
  }
 }
 const filtered=Boolean(query.q||query.status!=="ALL"||query.source!=="ALL"||
  query.stage!=="ALL"||query.screening!=="ALL"||query.departmentId||
  query.programId||query.cohortId||query.appliedFrom||query.appliedTo);
 const clearHref=basePath+"/jobs/"+encodeURIComponent(jobId)+"/applications";
 const sortHref=(column:string,next:"ascending"|"descending")=>{
  const sort=column==="age"?(next==="ascending"?"AGE_ASC":"AGE_DESC"):
   next==="ascending"?"SCORE_ASC":"SCORE_DESC";
  return driveApplicationsHref(jobId,{...query,page:1,sort}).replace("/college/placements/",basePath+"/");
 };
 const dialogTitle=action==="REINSTATE"?"Reinstate application?":
  target==="REJECTED"?"Reject application?":"Move applications to "+stageLabel(target);
 const columns:DataTableColumn<Row>[]=[
  {key:"name",header:"Learner Name",mobilePriority:"primary",
   cell:row=><span className="font-semibold text-foreground">{row.name?.trim()||"—"}</span>},
  {key:"selected",header:"Select",mobilePriority:"action",cell:row=>
   <label className="inline-flex min-h-11 items-center gap-2 text-sm">
    <Checkbox aria-label={"Select "+(row.name??row.id)}
     disabled={row.status!=="SUBMITTED"||busy||allMatching}
     checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/> Select</label>},

  {key:"email",header:"Email",mobilePriority:"secondary",cell:row=>row.email?.trim()||"—"},
  {key:"college",header:"College",mobilePriority:"secondary",cell:row=>row.collegeName?.trim()||"—"},
  {key:"roll",header:"Roll",mobilePriority:"secondary",cell:row=>row.rollNumber?.trim()||"—"},
  {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>row.roleTitle?.trim()||"—"},
  {key:"source",header:"Source",mobilePriority:"secondary",cell:row=><StatusBadge tone="info">{row.source==="EXTERNAL"?"External":row.source==="INTERNAL"?"Internal":row.source||"—"}</StatusBadge>},
  {key:"date",header:"Applied Date",mobilePriority:"secondary",
   cell:row=>Number.isFinite(new Date(row.submittedAt).getTime())?istDay.format(new Date(row.submittedAt)):"—"},
  {key:"age",header:"Age",mobilePriority:"secondary",sortable:true,
   sortDirection:query.sort==="AGE_DESC"?"descending":!query.sort||query.sort==="AGE_ASC"?"ascending":"none",cell:row=>{
   const days=stageAge(row);
   return <span title={row.stageMovedAt?"Time since most recent stage change":"Time since application"}
     className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--lms-info)]"/>
     {days===null?"—":days+"d"}</span>;
  }},

  {key:"status",header:"Current Status",mobilePriority:"secondary",cell:row=>
   <span className="inline-flex flex-col items-start gap-1">
    <StatusBadge tone={applicationStatusTone(row.stage)}>{stageLabel(row.stage)}</StatusBadge>
    {row.stageMovedAt&&Number.isFinite(Date.parse(row.stageMovedAt))?
     <span className="text-xs text-muted-foreground" title="Last stage change">{istDateTime.format(new Date(row.stageMovedAt))} IST</span>:null}
   </span>},
  {key:"screening",header:"Screening",mobilePriority:"secondary",cell:row=>row.screening?<StatusBadge tone={applicationStatusTone(row.screening)}>{stageLabel(row.screening)}</StatusBadge>:"—"},
  {key:"score",header:"Match Score",mobilePriority:"secondary",sortable:true,
   sortDirection:query.sort==="SCORE_DESC"?"descending":query.sort==="SCORE_ASC"?"ascending":"none",cell:row=>{
   const score=row.screeningScore;
   if(score===null||score===undefined||!Number.isFinite(score))return "—";
   const percent=Math.max(0,Math.min(100,Math.round(score)));
   const tone=percent>=70?"bg-[#f9f0ff] text-[#722ed1]":
    percent>=40?"bg-[#e6fffb] text-[#08979c]":"bg-surface-secondary text-muted-foreground";
   return <span className="inline-flex flex-wrap items-center gap-1.5">
    <span className={"rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums "+tone}>{percent}%</span>
    {row.partialScore!==null&&row.partialScore!==undefined?
     <span className="text-xs text-muted-foreground">Partial</span>:null}
   </span>;
  }},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:row=>
   <div className="flex min-w-[210px] flex-wrap items-center gap-2">
    <Button type="button" variant="secondary" onClick={()=>void openDetail(row.id)}
     aria-label={"View Details for "+(row.name||"learner")} disabled={busy}
     className="min-h-11 text-xs md:min-h-9">View Details</Button>
    {legacyShortlisted&&row.stage==="ASSESSMENT"&&
      (row.allowedNextStages??transitions[row.stage]??[]).includes("INTERVIEW")?
      <Link href={basePath+"/jobs/"+encodeURIComponent(jobId)+"/interviews?applicationId="+encodeURIComponent(row.id)}
       className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-primary-text underline md:min-h-9">
       Mark Passed · Schedule Interview</Link>:null}
    {legacyShortlisted&&row.stage==="INTERVIEW"&&
      (row.allowedNextStages??transitions[row.stage]??[]).includes("OFFERED")?
      <Button type="button" variant="secondary" disabled={busy} onClick={()=>selectRow(row,"OFFERED")}
       className="min-h-11 text-xs md:min-h-9">Move to Offered</Button>:null}
    {legacyShortlisted&&row.stage==="OFFERED"&&
      (row.allowedNextStages??transitions[row.stage]??[]).includes("HIRED")?
      <Button type="button" variant="secondary" disabled={busy} onClick={()=>selectRow(row,"HIRED")}
       className="min-h-11 text-xs md:min-h-9">Mark Hired</Button>:null}
    {row.stage==="INTERVIEW"&&basePath==="/college/placements"?
     <Link href={basePath+"/jobs/"+encodeURIComponent(jobId)+"/interviews?applicationId="+encodeURIComponent(row.id)}
      className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-primary-text underline md:min-h-9">
      Schedule Interview</Link>:null}
    {transitionWarning?.id===row.id?<span role="alert" className="text-xs text-warning-text">{transitionWarning.message}</span>:null}
    {row.stage==="REJECTED"?
     <Button type="button" disabled={busy||row.status!=="SUBMITTED"}
      aria-label={"Reinstate "+(row.name||"learner")} variant="secondary"
      onClick={()=>selectRow(row,"REINSTATE")} className="min-h-11 text-xs md:min-h-9">Reinstate</Button>:
     <Select aria-label={"Move "+(row.name||"learner")+" to"} value=""
      disabled={busy||row.status!=="SUBMITTED"}
      onChange={event=>{if(event.target.value)selectRow(row,event.target.value);}}
      className="min-h-11 min-w-32 max-w-full text-sm md:min-h-9">
      <option value="">Move to...</option>
      {(row.allowedNextStages??transitions[row.stage]??[]).filter(stage=>
        stage!=="REJECTED"&&!(legacyShortlisted&&row.stage==="ASSESSMENT"&&stage==="INTERVIEW"))
       .map(stage=><option key={stage} value={stage}>{stageLabel(stage)}</option>)}
     </Select>}
    {row.status==="SUBMITTED"&&row.stage==="SHORTLISTED"?
      <Button type="button" variant="secondary" disabled={busy}
       aria-label={"Correct "+(row.name||"learner")+" to Applied"}
       onClick={()=>selectRow(row,"CORRECT_APPLIED")}
       className="min-h-11 text-xs md:min-h-9">Correct to Applied…</Button>:null}
    {row.status==="SUBMITTED"&&(row.allowedNextStages??transitions[row.stage]??[]).includes("REJECTED")?
     <Button type="button" variant="danger" disabled={busy}
      aria-label={"Reject "+(row.name||"learner")}
      onClick={()=>selectRow(row,"REJECTED")} className="min-h-11 text-xs md:min-h-9">
      {legacyShortlisted&&row.stage==="ASSESSMENT"?"Mark Failed":"Reject"}</Button>:null}
   </div>},
 ];
 return <section className="space-y-4">
  <div className="grid min-w-0 grid-cols-1 items-center gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] text-sm md:grid-cols-2 lg:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]">
   <label className="flex items-center gap-2"><Checkbox checked={allPage}
    disabled={busy||!eligible.length} onChange={e=>{setAllMatching(false);setSelected(e.target.checked?eligible.map(r=>r.id):[]);}} />
    Select all {eligible.length} on this page</label>
   <strong role="status" aria-live="polite">{selectedCount} selected</strong>
   {total>eligible.length?<Button type="button" disabled={busy||total>3000}
    variant="secondary" onClick={()=>{setAllMatching(true);setSelected([]);}} >
    Select all {total.toLocaleString("en-IN")} matching this filter</Button>:null}
   {allMatching?<Button type="button" variant="secondary" onClick={()=>{setAllMatching(false);setSelected([]);}}
    >Clear selection</Button>:null}
   {total>3000?<span className="text-error">Narrow filters to 3,000 or fewer applicants before bulk actions.</span>:null}
   <Select aria-label="Bulk application action" value={target} onChange={e=>setTarget(e.target.value)}
    className="min-h-11 w-full text-base sm:text-sm md:min-h-9">
    {COLLEGE_APPLICATION_STAGES.filter(s=>s!=="APPLIED").map(stage=><option key={stage} value={stage}>
      {stage==="SHORTLISTED"?"Shortlist":stage==="REJECTED"?"Reject":
       stage==="ASSESSMENT"?"Move to Assessment":stage==="INTERVIEW"?"Move to Interview":
       stage==="WAITLISTED"?"Move to Waitlisted":stage==="OFFERED"?"Move to Offered":
       stage==="HIRED"?"Mark Hired":stage}</option>)}
   </Select>
   <Button type="button" disabled={!selectedCount||busy} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>chooseBulk(target)}
    >
    Update {selectedCount} selected</Button>
   <span className="text-body sm:col-span-2 lg:col-span-5">Changes are tracked with per-row results. Students receive in-app notifications; email is not available.</span>
  </div>
  {legacyShortlisted&&selectedCount>0&&
   ["ASSESSMENT","INTERVIEW","OFFERED"].includes(query.stage)?
   <div aria-label="Stage-specific bulk actions" className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
    <span className="mr-1 text-xs font-semibold text-body">{stageLabel(query.stage)} · {selectedCount} selected</span>
    {query.stage==="ASSESSMENT"?<>
     <Button type="button" variant="secondary" disabled={busy||staleConflict}
       onClick={()=>chooseBulk("INTERVIEW")}>Mark Passed ({selectedCount})</Button>
     <Button type="button" variant="danger" disabled={busy||staleConflict}
       onClick={()=>chooseBulk("REJECTED")}>Mark Failed ({selectedCount})</Button>
    </>:query.stage==="INTERVIEW"?<>
     <Button type="button" variant="secondary" disabled={busy||staleConflict}
       onClick={()=>chooseBulk("OFFERED")}>Move to Offered ({selectedCount})</Button>
     <Button type="button" variant="danger" disabled={busy||staleConflict}
       onClick={()=>chooseBulk("REJECTED")}>Reject ({selectedCount})</Button>
    </>:<>
     <Button type="button" variant="secondary" disabled={busy||staleConflict}
       onClick={()=>chooseBulk("HIRED")}>Mark Hired ({selectedCount})</Button>
     <Button type="button" variant="danger" disabled={busy||staleConflict}
       onClick={()=>chooseBulk("REJECTED")}>Reject ({selectedCount})</Button>
    </>}
    <Button type="button" variant="secondary" disabled={busy}
      onClick={()=>router.refresh()}>Refresh applications</Button>
    {query.stage==="OFFERED"?<p className="basis-full text-xs text-warning">
     Hired requires a released accepted offer and verified joining; updating a display stage never creates either record.
    </p>:null}
   </div>:null}

  {error&&!dialog?<div className="flex flex-wrap items-center gap-3 rounded-[var(--lms-control-radius)] border border-error p-3 text-sm">
   <span role="alert" className="min-w-0 flex-1">{error}</span>
   {failedDetailId?<Button type="button" variant="secondary" disabled={busy}
    onClick={()=>void openDetail(failedDetailId)}>Retry details</Button>:null}
   <Button type="button" variant="secondary" onClick={()=>router.refresh()}>Reload applications</Button>
  </div>:null}
  {legacyShortlisted?<label className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-body">
   <Checkbox checked={showLegacyExtraColumns} disabled={busy}
     onChange={event=>setShowLegacyExtraColumns(event.currentTarget.checked)} aria-label="Show Roll, Role and Screening columns"/>
   Show additional Roll, Role and Screening columns
  </label>:null}
  <DataTable columns={legacyShortlisted?
    (["name","email","college","source","status","date","age","score","actions","selected",
      ...(showLegacyExtraColumns?["roll","role","screening"]:[])] as string[])
      .map(key=>columns.find(col=>col.key===key))
      .filter((col):col is DataTableColumn<Row>=>col!==undefined)
    :columns} rows={rows} getRowKey={row=>row.id}
   caption="Applications pipeline" mobileMode="scroll" sortHref={sortHref}
   empty={<EmptyState title={filtered?"No applications match these filters.":"No applications yet."}
    description={filtered?"Try another search or clear the filters.":"Applicants will appear here when students apply for this drive."}
    action={filtered?<Link href={clearHref} className="inline-flex min-h-11 items-center font-semibold text-link underline">Clear filters</Link>:undefined}/>}/>
  {detailId?<CollegeApplicationDetailDrawer key={detailId} jobId={jobId}
    applicationId={detailId} initialDetail={detailPayload??undefined} basePath={basePath}
    onClose={()=>{setDetailId(null);setDetailPayload(null);}}/>:null}
  <Dialog open={dialog} onOpenChange={next=>{if(!next)closeMoveDialog();}} title={dialogTitle} dismissible={!busy} footer={<div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:min-h-11 [&>button]:w-full md:[&>button]:min-h-9 md:[&>button]:w-auto">
    <Button type="button" disabled={busy} variant="secondary" onClick={closeMoveDialog}>Close</Button>
    <Button type="button" variant={target==="REJECTED"?"danger":"primary"}
      disabled={busy||staleConflict||(action==="CORRECT"&&reason.trim().length<10)||!selectedCount}
      onClick={()=>void save()}>{busy?"Updating…":action==="REINSTATE"?"Reinstate "+selectedCount+" application(s)":
       target==="REJECTED"?"Reject "+selectedCount+" application(s)":"Confirm "+selectedCount+" application(s)"}</Button>
   </div>}>
    <p className="text-base font-semibold">{dialogTitle}</p>
    <p className="text-sm text-body leading-[22px]">{selectedCount} application(s) chosen. {action==="REINSTATE"?"Reinstate restores the previous stage while preserving recorded rejection history.":target==="REJECTED"?"Reject may include an optional reason and is reversible only through Reinstate.":"Outcomes requiring real offers and joining confirmations cannot be fabricated from a pipeline change."}
      Learner in-app notification is optional. Every change is audited, and changes that violate screening rules are reported as skipped.</p>
    {selected.length>5?<p id="pipeline-selected-scroll-cue" className="text-xs text-muted-foreground leading-5">More selected learners below ↓</p>:null}
   <ul tabIndex={0} role="region" aria-label="Selected applications" aria-describedby={selected.length>5?"pipeline-selected-scroll-cue":undefined}
    className="max-h-28 overflow-y-auto overscroll-contain pb-4 text-sm [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1rem),transparent_100%)]">{selected.slice(0,8).map(id=>
      <li key={id}>{rowMap.get(id)?.name??id}</li>)}
     {selected.length>8?<li>and {selected.length-8} more</li>:null}</ul>
    <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
      {action==="CORRECT"?"Reason (required for correction)":"Reason (optional)"}
      <Textarea rows={3} required={action==="CORRECT"} minLength={action==="CORRECT"?10:undefined}
       maxLength={target==="REJECTED"?500:1000}
       placeholder={target==="REJECTED"?"e.g. Does not meet requirements":"Optional details for the audit history"}
       value={reason} onChange={e=>setReason(e.target.value)}
       className="w-full text-base sm:text-sm"/></label>
    {action==="MOVE"&&target==="ASSESSMENT"?<div className="space-y-2">
      <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
       Assessment URL (optional)
       <Input type="url" maxLength={2048} placeholder="https://..."
        value={assessmentUrl} onChange={event=>setAssessmentUrl(event.target.value)}
        disabled={busy} className="w-full text-base sm:text-sm"/>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-body">
       <Checkbox checked={saveAssessmentUrlToJob} disabled={busy||!assessmentUrl.trim()}
        onChange={event=>setSaveAssessmentUrlToJob(event.target.checked)}/>
       Save link to job
      </label>
      <p className="text-xs text-muted-foreground">The secure link is stored for successfully moved candidates. Saving it to the job also updates its assessment metadata.</p>
     </div>:null}
    {target==="INTERVIEW"?<p className="text-sm text-body">Moving a candidate to Interview does not schedule an appointment. Use Schedule Interview in the applicant row after the update.</p>:null}
    {target==="OFFERED"||target==="HIRED"?<p className="text-sm text-body">An existing issued offer is required for Offered, and accepted offer plus confirmed joining are required for Hired. This action does not create an offer or joining outcome.</p>:null}
    <label className="flex min-h-11 items-start gap-2 text-sm text-body">
     <Checkbox checked={notifyLearnerInApp} disabled={busy}
      onChange={event=>setNotifyLearnerInApp(event.target.checked)}/>
     Notify learners in-app after applying the stage change
    </label>
    <label className="flex min-h-11 items-start gap-2 text-xs text-muted-foreground">
     <Checkbox checked={false} disabled aria-label="Notify candidates by email (unavailable)"/>
     <span><strong className="block text-foreground">Notify candidates by email (not available)</strong>
      In-app notifications use the independent choice above. Email requires an approved placement-stage template,
      recipient preference and suppression checks, and a durable audited outbox. The stage move
      never silently sends unapproved email.</span>
    </label>
    {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
    {staleConflict?<Button type="button" variant="secondary" disabled={busy}
      onClick={()=>router.refresh()}>Refresh current stages before retrying</Button>:null}
    {outcome&&outcome.results.length>5?<p id="pipeline-outcome-scroll-cue" className="text-xs text-muted-foreground leading-5">More outcomes below ↓</p>:null}
    {outcome?<div role="status" tabIndex={0} aria-label="Bulk application outcomes" aria-describedby={outcome.results.length>5?"pipeline-outcome-scroll-cue":undefined}
     className="max-h-36 overflow-y-auto overscroll-contain rounded border border-border p-3 pb-5 text-sm [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1rem),transparent_100%)]">
     <p className="font-semibold">{outcome.moved} updated, {outcome.skipped} skipped.</p>
     {outcome.results.filter(r=>r.status==="skipped").map(r=><p key={r.applicationId}>{rowMap.get(r.applicationId)?.name??r.applicationId}: {r.reason}</p>)}
     {outcome.results.filter(r=>r.status==="undone").map(r=><p key={r.applicationId}
      className="text-success">{rowMap.get(r.applicationId)?.name??r.applicationId}: Change undone before notification.</p>)}
     {outcome.results.filter(r=>r.undoEventId&&r.undoUntil&&r.stageVersion)
      .map(r=><div key={r.applicationId} className="flex flex-wrap items-center gap-3 border-b border-border py-2">
       <span className="min-w-0 flex-1">{rowMap.get(r.applicationId)?.name??r.applicationId}:
        Stage updated. Undo before the notification is delivered.</span>
       <Button type="button" variant="secondary" disabled={busy||Boolean(undoBusyId)}
        onClick={()=>void undoMove(r)}>
        {undoBusyId===r.applicationId?"Undoing…":"Undo stage change"}
       </Button>
      </div>)}
    </div>:null}
  </Dialog>
  <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
    title="Discard unsaved application change?"
    description="The reason, assessment URL and unsubmitted selections in this dialog will be lost."
    confirmLabel="Discard changes" confirmVariant="danger"
    onConfirm={discardMoveDraft}/>
 </section>;
}
