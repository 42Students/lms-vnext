"use client";
import Link from "next/link";
import {useRef,useState} from "react";
import {Input} from "@/components/ui/input";
import {driveChangeCommandSchema,DRIVE_CHANGE_EDITOR_OPTIONS,LEGACY_DRIVE_CHANGE_FIELD_LABELS} from "@/modules/placements/tpo-drive-change-request-model";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {Disclosure} from "@/components/ui/disclosure";
import {Dialog} from "@/components/ui/dialog";
import {StatusBadge} from "@/components/ui/status-badge";
import {useToast} from "@/components/ui/toast";
type Party="TPO"|"COMPANY";
type Item={id:string;proposerParty:string;targetParty:string;mode:string;field:string;legacyField?:string|null;
 proposedValue:string;reason:string;status:string;createdByUserId:string;createdByName?:string|null;
 createdAt:string;updatedAt:string;resolvedAt?:string|null;fieldLabel?:string|null;currentValue?:string|null;
 answerValue?:string|null;replyText?:string|null;
 decisionNote:string|null;messages:Array<{id:string;senderParty:string;body:string;sentAt:string}>};
function actionsFor(item:Item):readonly ("ACCEPT"|"ANSWER"|"DECLINE")[] {
 return item.mode==="ASK"?["ANSWER","DECLINE"]:["ACCEPT","DECLINE"];
}
/** Old LMS operators enter college-local dates, not browser-local timestamps. */
function istDateTimeToUtc(value:string):string {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return value;
 const date=new Date(value+":00+05:30");
 return Number.isFinite(date.getTime())?date.toISOString():value;
}
/** datetime-local expects an IST wall clock, not an offset UTC time. */
function minIstDateTime():string {
 const now=new Date(Date.now()+5.5*60*60*1000);
 return now.toISOString().slice(0,16);
}
function readableValue(field:string,value:string|null|undefined):string{
 if(!value)return "—";
 const cleaned=field==="DESCRIPTION"?value.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim():value;
 if(field==="DEADLINE"){
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toLocaleString("en-IN",{
   timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"
  })+" IST":value;
 }
 if(field==="WORK_MODE"||field==="MODE")return ({"ONSITE":"On campus","HYBRID":"Hybrid","REMOTE":"Remote"} as Record<string,string>)[cleaned]??cleaned;
 if(field==="JOB_TYPE")return ({"FULL_TIME":"Full-time","INTERNSHIP":"Internship","CONTRACT":"Contract"} as Record<string,string>)[cleaned]??cleaned;
 if(field==="CTC")return cleaned+" LPA";
 if(field==="STIPEND")return "₹"+cleaned+" a month";
 return cleaned;
}
function formatCreatedAt(value:string):string{
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toLocaleString("en-IN",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"
 })+" IST":"";
}
const fields=[["ROLE_TITLE","Role title"],["DESCRIPTION","Description"],["LOCATION","Location"],
 ["JOB_TYPE","Job type"],["WORK_MODE","Mode"],["DEADLINE","Application deadline"],
 ["CTC","CTC (LPA)"],["STIPEND","Monthly stipend"],["MIN_CGPA","Minimum CGPA"],
 ["BRANCHES","Branches (comma separated)"],["OTHER","Something else"],["ROUNDS","Interview rounds"],
 ["PAY","Pay / package"],["ELIGIBILITY","Eligibility"]] as const;
export function TpoDriveChangeRequests({jobId,party,requests,initialField,openInitially=false}:{
 jobId:string;party:Party;userId:string;requests:Item[];
 initialField?:"ROUNDS"|"BRANCHES"|"CTC"|"OTHER";openInitially?:boolean;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [fieldError,setFieldError]=useState("");
 const [mode,setMode]=useState<"SUGGEST"|"ASK">(openInitially?"ASK":"SUGGEST");
 const [field,setField]=useState<(typeof fields)[number][0]|"">(initialField??"");
 const [composerOpen,setComposerOpen]=useState(openInitially);
 const [discardComposer,setDiscardComposer]=useState(false);
 const [value,setValue]=useState("");const [reason,setReason]=useState("");
 const [notes,setNotes]=useState<Record<string,string>>({});
 const inFlightRef=useRef(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 const [confirmation,setConfirmation]=useState<{action:"ACCEPT"|"ANSWER"|"DECLINE"|"WITHDRAW";requestId:string;expectedUpdatedAt:string;field:string;note:string}|null>(null);
 const createRequest={action:"CREATE",field,mode:field==="OTHER"?"ASK":mode,
  proposedValue:field==="OTHER"?"":field==="DEADLINE"&&mode==="SUGGEST"&&value
   ?istDateTimeToUtc(value):value.trim(),reason:reason.trim()};
 const canSubmitRequest=driveChangeCommandSchema.safeParse(createRequest).success;
 async function send(body:Record<string,unknown>){
  if(inFlightRef.current||busy)return;
  const validation=driveChangeCommandSchema.safeParse(body);
  if(!validation.success){
    const message=validation.error.issues[0]?.message??"Check the field and value.";
    setFieldError(body["action"]==="CREATE"?message:"");
    setError(message);
    return;
  }
  setFieldError("");
  inFlightRef.current=true;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/placements/jobs/"+encodeURIComponent(jobId)+"/change-requests",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(body),
   });
   const payload:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const reason=payload&&typeof payload==="object"&&!Array.isArray(payload)?
      payload as {error?:unknown;message?:unknown}:null;
    const safe=typeof reason?.message==="string"&&reason.message.length<=240&&
      !/[<>\\r\\n]/.test(reason.message)?reason.message:null;
    throw Error(safe??(response.status===409?"This change request has changed. Refresh and retry.":
      response.status===401?"Sign in again before saving this change.":response.status===403?"You do not have permission for this change.":response.status===422||response.status===400?"Check the requested field and value.":"That didn't work. Please retry."));
   }
   const receipt=payload&&typeof payload==="object"&&!Array.isArray(payload)
     ?payload as Record<string,unknown>:null;
   const statuses:Record<string,string>={CREATE:"OPEN",COMMENT:"COMMENTED",ACCEPT:"ACCEPTED",ANSWER:"ANSWERED",DECLINE:"DECLINED",WITHDRAW:"WITHDRAWN"};
   if(!receipt||typeof receipt["id"]!=="string"||
     !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(receipt["id"])||
     receipt["status"]!==statuses[String(body["action"])]||
     (body["action"]!=="CREATE"&&body["action"]!=="COMMENT"&&receipt["id"]!==body["requestId"]))
     throw Error("Could not verify saved change request.");
   const status=String(body["action"]);
   const message=status==="CREATE"?"Sent. The drive stays in review while they answer.":
     status==="ACCEPT"?"Accepted and applied":
     status==="ANSWER"?"Answered":status==="DECLINE"?"Declined":
     status==="WITHDRAW"?"Withdrawn":"Reply added to this change request.";
   setSuccess(message);
   showToast({tone:"success",title:message});
   setConfirmation(null);
   if(body["action"]==="CREATE"){setValue("");setReason("");setField("");setMode("SUGGEST");setComposerOpen(false);}
   if(typeof body["requestId"]==="string")setNotes(previous=>({...previous,[body["requestId"] as string]:""}));
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"That didn't work. The request was not saved.");}finally{inFlightRef.current=false;setBusy(false);}
 }
 return <div className="min-w-0 space-y-5">
  {error?<InlineNotice tone="error" message={error}/>:null}
  {success?<InlineNotice tone="success" message={success}/>:null}
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="font-semibold text-[var(--lms-heading)]">Change requests</h2>
   <Button type="button" disabled={busy} onClick={()=>{setError("");setComposerOpen(true);}}>Request a change</Button>
  </div>
  <Dialog open={composerOpen} title="Request a change" dismissible={!busy}
   onOpenChange={open=>{
    if(open){setComposerOpen(true);return;}
    if(busy)return;
    if(value.trim()||reason.trim()||field){setDiscardComposer(true);return;}
    setComposerOpen(false);
   }}>
   <div className="min-w-0 space-y-3">
   <p className="text-sm text-body leading-[22px]">Both sides can discuss, accept, answer or decline. Accepting a proposal applies the agreed value to the drive; answering a named field updates it too.</p>
   <div className="grid gap-3 min-[768px]:grid-cols-2">
    {field&&field!=="OTHER"?<label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">How
     <Select value={mode}
      onChange={e=>{setMode(e.target.value as "SUGGEST"|"ASK");setValue("");setFieldError("");}}
      className="min-h-11 min-[768px]:min-h-9"><option value="SUGGEST">Propose</option><option value="ASK">Ask</option></Select></label>:null}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">What should change
     <Select value={field} onChange={e=>{setField(e.target.value as typeof field);setValue("");setFieldError("");}}
      className="min-h-11 min-[768px]:min-h-9">
      <option value="">Choose a field</option>{fields.map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select></label>
   </div>
   {field&&field!=="OTHER"?<label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
    {mode==="ASK"?"Your question":"New value"}
    {mode==="SUGGEST"&&field==="DEADLINE"?
      <Input type="datetime-local" value={value} onChange={e=>setValue(e.target.value)}
       onFocus={e=>{e.currentTarget.min=minIstDateTime();}}
       className="min-h-11 min-[768px]:min-h-9"/>:
     mode==="SUGGEST"&&["CTC","STIPEND","MIN_CGPA","PAY"].includes(field)?
      <Input type="number" min={0} max={field==="MIN_CGPA"?10:field==="CTC"?1000:undefined}
       step="0.01" value={value} onChange={e=>setValue(e.target.value)}
       className="min-h-11 min-[768px]:min-h-9"/>:
     mode==="SUGGEST"&&(field==="WORK_MODE"||field==="JOB_TYPE")?
      <Select value={value} onChange={e=>setValue(e.target.value)}
       className="min-h-11 min-[768px]:min-h-9">
       <option value="">Choose an option</option>
       {(field==="WORK_MODE"?DRIVE_CHANGE_EDITOR_OPTIONS.WORK_MODE:
         DRIVE_CHANGE_EDITOR_OPTIONS.JOB_TYPE).map(option=>
          <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>:
      <Textarea value={value} onChange={e=>{setValue(e.target.value);setFieldError("");}} minLength={2}
       maxLength={field==="ROLE_TITLE"||field==="LOCATION"?255:2000}
       rows={field==="DESCRIPTION"?5:3}
       className="min-h-11 min-[768px]:min-h-9"/>}
    </label>:null}
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
    {field==="OTHER"?"Say what should change":"Why is this needed? (optional)"}
    <Textarea value={reason} onChange={e=>{setReason(e.target.value);setFieldError("");}}
     minLength={field==="OTHER"?3:undefined}
     maxLength={1000} rows={2} className="min-h-11 min-[768px]:min-h-9"/></label>
   {fieldError?<p role="alert" className="text-xs text-error">{fieldError}</p>:null}
   <Button type="button" disabled={busy||!canSubmitRequest}
    onClick={()=>void send(createRequest)}
    variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9">
    {busy?"Sending…":"Send"}</Button>
   <Button type="button" variant="secondary" disabled={busy} onClick={()=>{
    if(value.trim()||reason.trim()||field)setDiscardComposer(true);else setComposerOpen(false);
   }}>Cancel</Button>
   </div>
  </Dialog>
  <ConfirmDialog open={discardComposer} onOpenChange={setDiscardComposer}
    title="Discard this request?" confirmLabel="Discard" cancelLabel="Keep editing"
    onConfirm={()=>{setDiscardComposer(false);setComposerOpen(false);setValue("");setReason("");setField("");setMode("SUGGEST");}}>
    Your unsent request details will be lost.
  </ConfirmDialog>
  {(["COMPANY","TPO"] as const).map(proposer=><section key={proposer} className="space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h3 className="text-base font-semibold text-[var(--lms-heading)]">
      {proposer==="COMPANY"?"Company requests":"Institutional requests (yours)"}
    </h3>
    <span className="text-xs text-muted-foreground">{requests.filter(item=>item.proposerParty===proposer).length}</span>
   </div>
   {!requests.some(item=>item.proposerParty===proposer)?
    <EmptyState title={proposer==="COMPANY"?
     "No requests from the company. The drive stays where it is until you both agree to a change.":
     "No institutional requests yet. Request a change and the company can reply here."}/>:
    requests.filter(item=>item.proposerParty===proposer).map(item=>
    <article id={"change-request-"+item.id} key={item.id} className="scroll-mt-24 space-y-3 border-b border-border py-5">
     <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="font-semibold">{LEGACY_DRIVE_CHANGE_FIELD_LABELS[item.field as keyof typeof LEGACY_DRIVE_CHANGE_FIELD_LABELS]??(item.legacyField??item.field).replaceAll("_"," ")} · {item.mode==="SUGGEST"?"propose":item.mode.toLowerCase()}</h3>
      <StatusBadge tone={item.status==="ACCEPTED"?"success":item.status==="DECLINED"?"error":item.status==="OPEN"?"warning":"neutral"}>{item.status==="OPEN"?"Waiting":item.status==="DECLINED"||item.status==="REPLIED"?"Declined":item.status==="ANSWERED"?"Answered":item.status.replaceAll("_"," ")}</StatusBadge>
     </div>
     {item.mode==="SUGGEST"?<p className="whitespace-pre-wrap break-words text-sm leading-[22px]">
       {readableValue(item.legacyField??item.field,item.currentValue)} <span aria-hidden="true">→</span> {readableValue(item.legacyField??item.field,item.proposedValue)}
      </p>:<p className="whitespace-pre-wrap break-words text-sm leading-[22px]">
       Question: {readableValue(item.field,item.proposedValue)}
      </p>}
     <p className="text-xs text-muted-foreground">
       {item.createdByName??(item.proposerParty==="TPO"?"Placement cell":"Company")} · {formatCreatedAt(item.createdAt)}
     </p>
     <p className="break-words [overflow-wrap:anywhere] text-sm text-body leading-[22px]">
     {item.reason==="No reason provided"?"Reason not provided":"Why: "+item.reason}
     {" · From "}{item.createdByName??(item.proposerParty==="TPO"?"placement cell":"company")}</p>
     {(item.answerValue??item.replyText??item.decisionNote)?
      <Alert tone="info">{item.answerValue?"Answer: ":item.replyText?"Declined: ":"Decision: "}
       {item.answerValue??item.replyText??item.decisionNote}</Alert>:null}
     {item.resolvedAt?<p className="text-xs text-body">
      Resolved {new Date(item.resolvedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST
     </p>:null}
     <Link href={party==="TPO"
       ?"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/discussion?requestId="+encodeURIComponent(item.id)
       :"/recruiter/drives/"+encodeURIComponent(jobId)+"/messages?requestId="+encodeURIComponent(item.id)}
       className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2">
       Discuss in drive conversation
     </Link>
     <Disclosure title={"Discussion ("+item.messages.length+")"} defaultOpen={item.status==="OPEN"&&item.targetParty===party} className="min-w-0 border-t border-border pt-2" contentClassName="min-w-0 space-y-2 pt-3">
      {item.messages.length===0?<p className="text-sm text-body leading-[22px]">No discussion yet.</p>:null}
      {item.messages.map(message=><p key={message.id} className="break-words [overflow-wrap:anywhere] border-b border-[var(--lms-canvas-border)] bg-transparent py-3 text-sm leading-[22px]">
       <strong>{message.senderParty==="TPO"?"Placement cell":"Company"}:</strong> {message.body}
      </p>)}
      <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
       {item.mode==="ASK"&&item.targetParty===party?"Answer or discussion reply":"Reply or decision explanation"}
       {item.mode==="ASK"&&item.targetParty===party&&
        ["DEADLINE"].includes(item.legacyField??item.field)?
        <Input type="datetime-local" value={notes[item.id]??""}
         onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))}
         onFocus={e=>{e.currentTarget.min=minIstDateTime();}}
         className="min-h-11 min-[768px]:min-h-9"/>:
       item.mode==="ASK"&&item.targetParty===party&&
        ["WORK_MODE","MODE","JOB_TYPE"].includes(item.legacyField??item.field)?
        <Select value={notes[item.id]??""}
         onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))}
         className="min-h-11 min-[768px]:min-h-9">
         <option value="">Choose an answer</option>
         {((item.legacyField??item.field)==="JOB_TYPE"?
           DRIVE_CHANGE_EDITOR_OPTIONS.JOB_TYPE:DRIVE_CHANGE_EDITOR_OPTIONS.WORK_MODE)
           .map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>:
        <Textarea maxLength={2000} value={notes[item.id]??""}
         onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))}
         rows={2} className="min-h-11 min-[768px]:min-h-9"/>}
      </label>
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
       <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy||!(notes[item.id]??"").trim()}
        onClick={()=>void send({action:"COMMENT",requestId:item.id,body:(notes[item.id]??"").trim()})}
        variant="secondary">Reply</Button>
       {item.status==="OPEN"&&item.targetParty===party?
        actionsFor(item).map(action=>
         <Button key={action} type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
          disabled={busy||(action==="ANSWER"&&(notes[item.id]??"").trim().length<1)}
          onClick={()=>setConfirmation({action,requestId:item.id,expectedUpdatedAt:item.updatedAt,field:item.legacyField??item.field,note:(item.legacyField??item.field)==="DEADLINE"&&action==="ANSWER"?istDateTimeToUtc(notes[item.id]??""):(notes[item.id]??"").trim()})}
          variant={action==="DECLINE"?"danger":"secondary"}>
          {action==="ACCEPT"?"Accept":action==="ANSWER"?"Answer":"Decline"}</Button>):null}
       {item.status==="OPEN"&&item.proposerParty===party?
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy}
         onClick={()=>setConfirmation({action:"WITHDRAW",requestId:item.id,expectedUpdatedAt:item.updatedAt,field:item.legacyField??item.field,note:(notes[item.id]??"").trim()})}
         variant="danger">Withdraw</Button>:null}
      </div>
     </Disclosure>
    </article>)}
  </section>)}
  <ConfirmDialog open={confirmation!==null} onOpenChange={open=>{if(!open&&!busy)setConfirmation(null);}}
   title={confirmation?.action==="ACCEPT"?"Accept":confirmation?.action==="ANSWER"?"Answer":confirmation?.action==="DECLINE"?"Decline":"Withdraw"}
   confirmLabel={confirmation?.action==="ACCEPT"?"Accept":confirmation?.action==="ANSWER"?"Answer":confirmation?.action==="DECLINE"?"Decline":"Withdraw"}
   confirmVariant={confirmation?.action==="ACCEPT"||confirmation?.action==="ANSWER"?"primary":"danger"} pending={busy}
   confirmDisabled={Boolean(confirmation&&(confirmation.action==="DECLINE"||confirmation.action==="ANSWER")&&!confirmation.note.trim())}
   onConfirm={()=>{if(confirmation)void send({action:confirmation.action,requestId:confirmation.requestId,
     expectedUpdatedAt:confirmation.expectedUpdatedAt,note:confirmation.note});}}>
   <p className="text-sm text-body leading-[22px]">{confirmation?.action==="ACCEPT"?"Accepting immediately applies this change to the drive.":"This decision is recorded in the drive discussion. Answering a named field updates the drive; declining or withdrawing does not."}</p>
   {confirmation?.action==="ANSWER"?
    <div className="mt-3 min-w-0 space-y-1 text-sm">
     <p className="font-semibold">Answer to apply</p>
     <p className="whitespace-pre-wrap break-words rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
      {readableValue(confirmation.field,confirmation.note)}
     </p>
     <p className="text-xs text-muted-foreground">To change this answer, cancel and edit the field above before confirming.</p>
    </div>:null}
   {confirmation?.action==="DECLINE"?
    <label className="mt-3 grid gap-1 text-sm font-semibold">Why decline?
     <Textarea rows={3} maxLength={1000} value={confirmation.note}
      onChange={e=>setConfirmation(previous=>previous?{...previous,note:e.target.value}:null)}/>
    </label>:null}
   {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </div>;
}
