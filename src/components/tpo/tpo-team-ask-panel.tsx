"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Alert } from "@/components/ui/alert";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Dialog} from "@/components/ui/dialog";
import {Disclosure} from "@/components/ui/disclosure";
type Ask={
 id:string;title:string;status:string;dueAt:string|null;doneNote:string|null;
 askerMembershipId:string;assigneeMembershipId:string;
};
function AskActions({threadId,ask,ownId}:{threadId:string;ask:Ask;ownId:string}){
 const router=useRouter(),pending=useRef(false);
 const [confirmation,setConfirmation]=useState<"DONE"|"CANCEL"|null>(null);
 const [note,setNote]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const canDone=ask.status==="OPEN"&&ask.assigneeMembershipId===ownId;
 const canCancel=ask.status==="OPEN"&&ask.askerMembershipId===ownId;
 async function submit(){
  if(!confirmation||pending.current)return;
  pending.current=true;setBusy(true);setError("");
  try{
   await apiFetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+
    "/asks/"+encodeURIComponent(ask.id),{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:confirmation,expectedStatus:"OPEN",...(confirmation==="DONE"?{note:note.trim()}:{})}),
   });
   setConfirmation(null);router.refresh();
  }catch{setError("Could not update this ask. Your note is still here. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
  {canDone?<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy}
   
   onClick={()=>{setError("");setConfirmation("DONE");}}>Mark done</Button>:null}
  {canCancel?<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy}
   
   onClick={()=>{setError("");setConfirmation("CANCEL");}}>Cancel ask</Button>:null}
  <Dialog open={Boolean(confirmation)} onOpenChange={next=>{if(!next&&!busy){setConfirmation(null);setError("");}}} dismissible={!busy} role="alertdialog"
   title={confirmation==="DONE"?"Mark the ask done":"Cancel this ask?"} className="max-w-md"
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy} onClick={()=>{setConfirmation(null);setError("");}}>
     {confirmation==="CANCEL"?"Keep it":"Not now"}
    </Button>
    <Button variant={confirmation==="CANCEL"?"danger":"primary"} loading={busy} disabled={busy} type="button" onClick={()=>void submit()} className="min-h-11 w-full sm:w-auto md:min-h-9">
     {busy?"Saving…":confirmation==="DONE"?"Mark done":"Cancel the ask"}
    </Button>
   </div>}>
   {confirmation==="DONE"?<label className="grid min-w-0 gap-1 text-sm">A note goes into the conversation as your reply (optional)
    <Textarea rows={2} maxLength={2000} disabled={busy} value={note}
     onChange={event=>{setNote(event.target.value);setError("");}} className="w-full min-w-0"/>
   </label>:null}
   {error?<InlineNotice tone="error" message={error}/>:null}
  </Dialog>
 </div>;
}
export function TpoTeamAskPanel({threadId,actorId,recipientId,recipientName,recipientAwayLabel,items,serverNowMs,highlightAskId}:{
 threadId:string;actorId:string;recipientId:string;recipientName:string;recipientAwayLabel:string|null;items:Ask[];serverNowMs:number;highlightAskId?:string;
}){
 const router=useRouter(),pending=useRef(false),key=useRef<string|null>(null);
 const [title,setTitle]=useState(""),[due,setDue]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  if(!highlightAskId)return;
  const element=document.getElementById("team-ask-"+highlightAskId);
  element?.scrollIntoView({behavior:"smooth",block:"center"});
 },[highlightAskId]);
 async function create(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending.current||!title.trim()||title.trim().length>200)return;
  const dueAt=due?new Date(due+"+05:30"):null;
  if(dueAt&&!Number.isFinite(dueAt.getTime())){setError("Choose a valid date and time.");return;}
  pending.current=true;setBusy(true);setError("");
  if(!key.current)key.current=crypto.randomUUID();
  try{
   await apiFetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/asks",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({assigneeMembershipId:recipientId,requestKey:key.current,
     title:title.trim(),dueAt:dueAt?.toISOString()??null}),
   });
   key.current=null;setTitle("");setDue("");router.refresh();
  }catch{setError("Could not send the ask. Your draft is still here. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <section aria-label="Asks here" className="min-w-0 space-y-3 border-t border-border pt-4">
  <h2 className="font-semibold">Asks here</h2>
  <p className="text-xs text-muted-foreground">Ask one teammate to do something, with an optional due date.</p>
  <Disclosure title="New ask" defaultOpen={items.length===0} className="border-t border-border" contentClassName="px-2 pb-3">
  <form onSubmit={event=>void create(event)} className="grid min-w-0 gap-3">
   <p className="break-words text-sm">Ask {recipientName}</p>
   {recipientAwayLabel?<Alert tone="warning">{recipientName.split(" ")[0]} is away until {recipientAwayLabel}.</Alert>:null}
   <label className="grid min-w-0 gap-1 text-sm">What needs doing?
    <Input required maxLength={200} disabled={busy} value={title}
     onChange={event=>{setTitle(event.target.value);key.current=null;setError("");}}
     className="min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>
   <label className="grid min-w-0 gap-1 text-sm">By (optional, IST)
    <Input type="datetime-local" disabled={busy} value={due}
     onChange={event=>{setDue(event.target.value);key.current=null;setError("");}}
     className="min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>
   {error?<InlineNotice tone="error" message={error}/>:null}
   <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={busy} disabled={busy||!title.trim()||!recipientId}
    >
    {busy?"Sending…":"Ask someone"}</Button>
  </form>
  </Disclosure>
  <ul className="min-w-0 divide-y divide-border">{items.map(ask=>{
   const overdue=ask.status==="OPEN"&&ask.dueAt&&new Date(ask.dueAt).getTime()<serverNowMs;
   const label=ask.status==="OPEN"&&overdue?"Overdue":ask.status==="OPEN"?"Open":ask.status==="DONE"?"Done":"Cancelled";
   return <li key={ask.id} id={"team-ask-"+ask.id} className="min-w-0 py-3 text-sm">
    <p className="min-w-0 break-words font-semibold">{ask.title}</p>
    <p className="mt-1 text-xs text-muted-foreground">
     Ask · {ask.assigneeMembershipId===actorId?"you":recipientName}
     {ask.dueAt?" · by "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(ask.dueAt))+" IST":""}
     {" · "+label}
    </p>
    {ask.doneNote?<p className="mt-1 break-words text-xs">{ask.doneNote}</p>:null}
    <AskActions threadId={threadId} ask={ask} ownId={actorId}/>
   </li>;
  })}</ul>
  {items.length===0?<p role="status" className="py-3 text-sm text-muted-foreground">No asks here yet.</p>:null}
  {items.length===200?<Alert tone="warning">Showing the 200 most recent asks.</Alert>:null}
 </section>;
}
