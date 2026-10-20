"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
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
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 const [confirmation,setConfirmation]=useState<{action:"ACCEPT"|"DECLINE"|"WITHDRAW";requestId:string;expectedUpdatedAt:string;note:string}|null>(null);
 async function send(body:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/placements/jobs/"+encodeURIComponent(jobId)+"/change-requests",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(body),
   });
   const payload=await response.json().catch(()=>null) as {status?:string}|null;
   if(!response.ok)throw Error("Could not save change request.");
   const publicStatus=payload?.status&&/^(OPEN|ACCEPTED|ANSWERED|DECLINED|WITHDRAWN|CANCELLED)$/i.test(payload.status)
     ?payload.status.toLowerCase():"updated";
   setSuccess("Change request "+publicStatus+".");
   setConfirmation(null);
   if(body.action==="CREATE"){setValue("");setReason("");}
   if(typeof body.requestId==="string")setNotes(previous=>({...previous,[body.requestId as string]:""}));
   router.refresh();
  }catch{setError("Could not save change request.");}finally{setBusy(false);}
 }
 return <div className="space-y-6">
  <section className="space-y-3 border-b border-border pb-6">
   <h2 className="text-lg font-semibold">Suggest a change or ask the {party==="TPO"?"company":"placement cell"}</h2>
   <p className="text-sm text-body">Both sides can discuss, accept, answer or decline. Acceptance records agreement; the placement team must separately update the drive using the authorized edit action.</p>
   <div className="grid gap-3 min-[768px]:grid-cols-2">
    <label className="grid gap-1 text-sm">Request type
     <Select value={mode} onChange={e=>setMode(e.target.value as "SUGGEST"|"ASK")}
      className="min-h-11 min-[768px]:min-h-9"><option value="SUGGEST">Suggest a change</option><option value="ASK">Ask a question</option></Select></label>
    <label className="grid gap-1 text-sm">Field
     <Select value={field} onChange={e=>setField(e.target.value as typeof field)}
      className="min-h-11 min-[768px]:min-h-9">
      {fields.map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select></label>
   </div>
   <label className="grid gap-1 text-sm">Change or question
    <Textarea value={value} onChange={e=>setValue(e.target.value)} minLength={2} maxLength={2000} rows={3}
     className="min-h-11 min-[768px]:min-h-9"/></label>
   <label className="grid gap-1 text-sm">Why is this needed?
    <Textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={3} maxLength={1000} rows={2}
     className="min-h-11 min-[768px]:min-h-9"/></label>
   <Button type="button" disabled={busy||value.trim().length<2||reason.trim().length<3}
    onClick={()=>void send({action:"CREATE",field,mode,proposedValue:value.trim(),reason:reason.trim()})}
    variant="primary">
    {busy?"Saving…":"Send to "+(party==="TPO"?"company":"placement cell")}</Button>
  </section>
  <section className="space-y-3">
   <h2 className="text-lg font-semibold">Change requests · {requests.length}</h2>
   {!requests.length?<EmptyState title="No change requests for this drive."/>:requests.map(item=>
    <article key={item.id} className="space-y-3 border-b border-border py-5">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold">{item.field.replaceAll("_"," ")} · {item.mode.toLowerCase()}</h3>
      <strong className="inline-flex min-h-[22px] items-center rounded-[6px] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] px-2 text-xs font-semibold">{item.status.replaceAll("_"," ")}</strong>
     </div>
     <p className="whitespace-pre-wrap text-sm">{item.proposedValue}</p>
     <p className="text-sm text-body">Why: {item.reason} · From {item.proposerParty==="TPO"?"placement cell":"company"}</p>
     {item.decisionNote?<Alert tone="info">Decision: {item.decisionNote}</Alert>:null}
     <div className="space-y-2 border-t border-border pt-3">
      <h4 className="text-sm font-semibold">Discussion</h4>
      {item.messages.map(message=><p key={message.id} className="border-b border-[var(--lms-canvas-border)] bg-transparent py-3 text-sm">
       <strong>{message.senderParty==="TPO"?"Placement cell":"Company"}:</strong> {message.body}
      </p>)}
      <label className="grid gap-1 text-sm">Reply or decision explanation
       <Textarea maxLength={2000} value={notes[item.id]??""} onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))}
        rows={2} className="min-h-11 min-[768px]:min-h-9"/></label>
      <div className="flex flex-wrap gap-2">
       <Button type="button" disabled={busy||!(notes[item.id]??"").trim()}
        onClick={()=>void send({action:"COMMENT",requestId:item.id,body:(notes[item.id]??"").trim()})}
        variant="secondary">Reply</Button>
       {item.status==="OPEN"&&item.targetParty===party?(
        ["ACCEPT","ANSWER","DECLINE"] as const).map(action=>
         <Button key={action} type="button" disabled={busy||(notes[item.id]??"").trim().length<3}
          onClick={()=>action==="ANSWER"?void send({action,requestId:item.id,expectedUpdatedAt:item.updatedAt,note:(notes[item.id]??"").trim()}):
           setConfirmation({action,requestId:item.id,expectedUpdatedAt:item.updatedAt,note:(notes[item.id]??"").trim()})}
          variant={action==="DECLINE"?"danger":"secondary"}>
          {action==="ACCEPT"?"Accept":action==="ANSWER"?"Answer":"Decline"}</Button>):null}
       {item.status==="OPEN"&&item.proposerParty===party&&item.createdByUserId===userId?
        <Button type="button" disabled={busy||(notes[item.id]??"").trim().length<3}
         onClick={()=>setConfirmation({action:"WITHDRAW",requestId:item.id,expectedUpdatedAt:item.updatedAt,note:(notes[item.id]??"").trim()})}
         variant="danger">Withdraw</Button>:null}
      </div>
     </div>
    </article>)}
  </section>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {success?<InlineNotice tone="success" message={success}/>:null}
  <ConfirmDialog open={confirmation!==null} onOpenChange={open=>{if(!open&&!busy)setConfirmation(null);}}
   title={confirmation?.action==="ACCEPT"?"Accept":confirmation?.action==="DECLINE"?"Decline":"Withdraw"}
   confirmLabel={confirmation?.action==="ACCEPT"?"Accept":confirmation?.action==="DECLINE"?"Decline":"Withdraw"}
   confirmVariant={confirmation?.action==="ACCEPT"?"primary":"danger"} pending={busy}
   onConfirm={()=>{if(confirmation)void send({action:confirmation.action,requestId:confirmation.requestId,
     expectedUpdatedAt:confirmation.expectedUpdatedAt,note:confirmation.note});}}>
   <p className="text-sm text-body">Acceptance records agreement; the placement team must separately update the drive using the authorized edit action.</p>
   {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </div>;
}
