"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Dialog} from "@/components/ui/dialog";
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
 return <div className="mt-2 flex flex-wrap gap-2">
  {canDone?<Button variant="secondary" type="button" disabled={busy}
   
   onClick={()=>setConfirmation("DONE")}>Mark done</Button>:null}
  {canCancel?<Button variant="secondary" type="button" disabled={busy}
   
   onClick={()=>setConfirmation("CANCEL")}>Cancel ask</Button>:null}
  {<Dialog open={Boolean(confirmation)} onOpenChange={next=>{if(!next&&!busy)setConfirmation(null);}} dismissible={!busy} role="alertdialog"
   title={confirmation==="DONE"?"Mark the ask done":"Cancel this ask?"} className="max-w-md">
   {confirmation==="DONE"?<label className="grid gap-1 text-xs">A note goes into the conversation as your reply (optional)
    <Textarea rows={2} maxLength={2000} disabled={busy} value={note}
     onChange={event=>setNote(event.target.value)} className="w-full"/>
   </label>:null}
   {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
   <Button variant="primary" type="button" disabled={busy} onClick={()=>void submit()}
    >
    {busy?"Saving…":confirmation==="DONE"?"Mark done":"Cancel the ask"}</Button>
   <Button variant="ghost" className="underline" type="button" disabled={busy} onClick={()=>setConfirmation(null)}
    >{confirmation==="CANCEL"?"Keep it":"Not now"}</Button>
  </Dialog>}
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
 return <section aria-label="Asks here" className="space-y-3 border-t border-border pt-4">
  <h2 className="font-semibold">Asks here</h2>
  <p className="text-xs text-muted-foreground">Ask one teammate to do something, with an optional due date.</p>
  <form onSubmit={event=>void create(event)} className="grid gap-3">
   <p className="text-sm">Ask {recipientName}</p>
   {recipientAwayLabel?<p role="status" className="text-xs text-warning-text">{recipientName.split(" ")[0]} is away until {recipientAwayLabel}.</p>:null}
   <label className="grid gap-1 text-sm">What needs doing?
    <Input required maxLength={200} disabled={busy} value={title}
     onChange={event=>{setTitle(event.target.value);key.current=null;}}
     className="min-h-11 sm:min-h-9 w-full"/>
   </label>
   <label className="grid gap-1 text-sm">By (optional, IST)
    <Input type="datetime-local" disabled={busy} value={due}
     onChange={event=>{setDue(event.target.value);key.current=null;}}
     className="min-h-11 sm:min-h-9 w-full"/>
   </label>
   {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
   <Button type="submit" disabled={busy||!title.trim()||!recipientId}
    >
    {busy?"Sending…":"Ask someone"}</Button>
  </form>
  <ul className="space-y-2">{items.map(ask=>{
   const overdue=ask.status==="OPEN"&&ask.dueAt&&new Date(ask.dueAt).getTime()<serverNowMs;
   const label=ask.status==="OPEN"&&overdue?"Overdue":ask.status==="OPEN"?"Open":ask.status==="DONE"?"Done":"Cancelled";
   return <li key={ask.id} id={"team-ask-"+ask.id} className="border-b border-border py-3 text-sm">
    <p className="font-semibold">{ask.title}</p>
    <p className="mt-1 text-xs text-muted-foreground">
     Ask · {ask.assigneeMembershipId===actorId?"you":recipientName}
     {ask.dueAt?" · by "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(ask.dueAt))+" IST":""}
     {" · "+label}
    </p>
    {ask.doneNote?<p className="mt-1 text-xs">{ask.doneNote}</p>:null}
    <AskActions threadId={threadId} ask={ask} ownId={actorId}/>
   </li>;
  })}</ul>
  {items.length===0?<p className="text-sm text-muted-foreground">No asks here yet.</p>:null}
  {items.length===200?<p role="status" className="text-xs text-muted-foreground">Showing the 200 most recent asks.</p>:null}
 </section>;
}
