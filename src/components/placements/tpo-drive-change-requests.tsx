"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {Disclosure} from "@/components/ui/disclosure";
import {StatusBadge} from "@/components/ui/status-badge";
type Party="TPO"|"COMPANY";
type Item={id:string;proposerParty:string;targetParty:string;mode:string;field:string;
 proposedValue:string;reason:string;status:string;createdByUserId:string;createdAt:string;updatedAt:string;
 decisionNote:string|null;messages:Array<{id:string;senderParty:string;body:string;sentAt:string}>};
const fields=[["DEADLINE","Application deadline"],["PAY","Pay / package"],["ELIGIBILITY","Eligibility"],["LOCATION","Location"],["ROUNDS","Interview rounds"],["OTHER","Other"]] as const;
export function TpoDriveChangeRequests({jobId,party,userId,requests}:{jobId:string;party:Party;userId:string;requests:Item[]}){
 const router=useRouter();const [mode,setMode]=useState<"SUGGEST"|"ASK">("SUGGEST");
 const [field,setField]=useState<(typeof fields)[number][0]>("DEADLINE");
 const [value,setValue]=useState("");const [reason,setReason]=useState("");
 const [notes,setNotes]=useState<Record<string,string>>({});
 const inFlightRef=useRef(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 const [confirmation,setConfirmation]=useState<{action:"ACCEPT"|"DECLINE"|"WITHDRAW";requestId:string;expectedUpdatedAt:string;note:string}|null>(null);
 async function send(body:Record<string,unknown>){
  if(inFlightRef.current||busy)return;
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
      response.status===403?"You do not have permission for this change.":"Could not save change request."));
   }
   const receipt=payload&&typeof payload==="object"&&!Array.isArray(payload)
     ?payload as Record<string,unknown>:null;
   const statuses:Record<string,string>={CREATE:"OPEN",COMMENT:"COMMENTED",ACCEPT:"ACCEPTED",ANSWER:"ANSWERED",DECLINE:"DECLINED",WITHDRAW:"WITHDRAWN"};
   if(!receipt||typeof receipt.id!=="string"||
     !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(receipt.id)||
     receipt.status!==statuses[String(body.action)]||
     (body.action!=="CREATE"&&body.action!=="COMMENT"&&receipt.id!==body.requestId))
     throw Error("Could not verify saved change request.");
   const publicStatus=receipt.status==="COMMENTED"?"updated":(receipt.status as string).toLowerCase();
   setSuccess("Change request "+publicStatus+".");
   setConfirmation(null);
   if(body.action==="CREATE"){setValue("");setReason("");}
   if(typeof body.requestId==="string")setNotes(previous=>({...previous,[body.requestId as string]:""}));
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not save change request.");}finally{inFlightRef.current=false;setBusy(false);}
 }
 return <div className="min-w-0 space-y-5">
  {error?<InlineNotice tone="error" message={error}/>:null}
  {success?<InlineNotice tone="success" message={success}/>:null}
  <Disclosure title={"Suggest a change or ask the "+(party==="TPO"?"company":"placement cell")} defaultOpen={requests.length===0} className="min-w-0 border-b border-border pb-3" contentClassName="min-w-0 space-y-3 pt-3">
   <p className="text-sm text-body leading-[22px]">Both sides can discuss, accept, answer or decline. Acceptance records agreement; the placement team must separately update the drive using the authorized edit action.</p>
   <div className="grid gap-3 min-[768px]:grid-cols-2">
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Request type
     <Select value={mode} onChange={e=>setMode(e.target.value as "SUGGEST"|"ASK")}
      className="min-h-11 min-[768px]:min-h-9"><option value="SUGGEST">Suggest a change</option><option value="ASK">Ask a question</option></Select></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Field
     <Select value={field} onChange={e=>setField(e.target.value as typeof field)}
      className="min-h-11 min-[768px]:min-h-9">
      {fields.map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select></label>
   </div>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Change or question
    <Textarea value={value} onChange={e=>setValue(e.target.value)} minLength={2} maxLength={2000} rows={3}
     className="min-h-11 min-[768px]:min-h-9"/></label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Why is this needed?
    <Textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={3} maxLength={1000} rows={2}
     className="min-h-11 min-[768px]:min-h-9"/></label>
   <Button type="button" disabled={busy||value.trim().length<2||reason.trim().length<3}
    onClick={()=>void send({action:"CREATE",field,mode,proposedValue:value.trim(),reason:reason.trim()})}
    variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9">
    {busy?"Saving…":"Send to "+(party==="TPO"?"company":"placement cell")}</Button>
  </Disclosure>
  <section className="space-y-3">
   <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Change requests · {requests.length}</h2>
   {!requests.length?<EmptyState title="No change requests for this drive."/>:requests.map(item=>
    <article key={item.id} className="space-y-3 border-b border-border py-5">
     <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="font-semibold">{item.field.replaceAll("_"," ")} · {item.mode.toLowerCase()}</h3>
      <StatusBadge tone={item.status==="ACCEPTED"?"success":item.status==="DECLINED"?"error":item.status==="OPEN"?"warning":"neutral"}>{item.status.replaceAll("_"," ")}</StatusBadge>
     </div>
     <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-[22px]">{item.proposedValue}</p>
     <p className="break-words [overflow-wrap:anywhere] text-sm text-body leading-[22px]">Why: {item.reason} · From {item.proposerParty==="TPO"?"placement cell":"company"}</p>
     {item.decisionNote?<Alert tone="info">Decision: {item.decisionNote}</Alert>:null}
     <Disclosure title={"Discussion ("+item.messages.length+")"} defaultOpen={item.status==="OPEN"&&item.targetParty===party} className="min-w-0 border-t border-border pt-2" contentClassName="min-w-0 space-y-2 pt-3">
      {item.messages.length===0?<p className="text-sm text-body leading-[22px]">No discussion yet.</p>:null}
      {item.messages.map(message=><p key={message.id} className="break-words [overflow-wrap:anywhere] border-b border-[var(--lms-canvas-border)] bg-transparent py-3 text-sm leading-[22px]">
       <strong>{message.senderParty==="TPO"?"Placement cell":"Company"}:</strong> {message.body}
      </p>)}
      <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reply or decision explanation
       <Textarea maxLength={2000} value={notes[item.id]??""} onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))}
        rows={2} className="min-h-11 min-[768px]:min-h-9"/></label>
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
       <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy||!(notes[item.id]??"").trim()}
        onClick={()=>void send({action:"COMMENT",requestId:item.id,body:(notes[item.id]??"").trim()})}
        variant="secondary">Reply</Button>
       {item.status==="OPEN"&&item.targetParty===party?(
        ["ACCEPT","ANSWER","DECLINE"] as const).map(action=>
         <Button key={action} type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy||(notes[item.id]??"").trim().length<3}
          onClick={()=>action==="ANSWER"?void send({action,requestId:item.id,expectedUpdatedAt:item.updatedAt,note:(notes[item.id]??"").trim()}):
           setConfirmation({action,requestId:item.id,expectedUpdatedAt:item.updatedAt,note:(notes[item.id]??"").trim()})}
          variant={action==="DECLINE"?"danger":"secondary"}>
          {action==="ACCEPT"?"Accept":action==="ANSWER"?"Answer":"Decline"}</Button>):null}
       {item.status==="OPEN"&&item.proposerParty===party&&item.createdByUserId===userId?
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy||(notes[item.id]??"").trim().length<3}
         onClick={()=>setConfirmation({action:"WITHDRAW",requestId:item.id,expectedUpdatedAt:item.updatedAt,note:(notes[item.id]??"").trim()})}
         variant="danger">Withdraw</Button>:null}
      </div>
     </Disclosure>
    </article>)}
  </section>
  <ConfirmDialog open={confirmation!==null} onOpenChange={open=>{if(!open&&!busy)setConfirmation(null);}}
   title={confirmation?.action==="ACCEPT"?"Accept":confirmation?.action==="DECLINE"?"Decline":"Withdraw"}
   confirmLabel={confirmation?.action==="ACCEPT"?"Accept":confirmation?.action==="DECLINE"?"Decline":"Withdraw"}
   confirmVariant={confirmation?.action==="ACCEPT"?"primary":"danger"} pending={busy}
   onConfirm={()=>{if(confirmation)void send({action:confirmation.action,requestId:confirmation.requestId,
     expectedUpdatedAt:confirmation.expectedUpdatedAt,note:confirmation.note});}}>
   <p className="text-sm text-body leading-[22px]">{confirmation?.action==="ACCEPT"?"Acceptance records agreement; the placement team must separately update the drive using the authorized edit action.":"This decision is recorded in the drive discussion. It does not apply a proposed drive change."}</p>
   {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </div>;
}
