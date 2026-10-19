"use client";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
export function TpoCompanyTeamComposer({companyId,actorUserId}:{
 companyId:string;actorUserId:string;
}){
 const router=useRouter(),pending=useRef(false),key=useRef<string|null>(null);
 const storageKey="tpo-company-team:"+actorUserId+":"+companyId;
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  const t=window.setTimeout(()=>{
   try{const saved=sessionStorage.getItem(storageKey);
    if(saved&&saved.length<=4000)setBody(saved);
    key.current=sessionStorage.getItem(storageKey+":key");
   }catch{/* A browser may disable session storage. */}
  },0);
  return ()=>window.clearTimeout(t);
 },[storageKey]);
 function update(value:string){
  setBody(value);key.current=null;setError("");
  try{
   if(value)sessionStorage.setItem(storageKey,value);
   else sessionStorage.removeItem(storageKey);
   sessionStorage.removeItem(storageKey+":key");
  }catch{/* Draft protection remains best effort. */}
 }
 useEffect(()=>{
  if(!body.trim())return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[body]);
 async function submit(){
  if(pending.current||busy||!body.trim())return;
  pending.current=true;setBusy(true);setError("");
  try{
   if(!key.current)key.current=crypto.randomUUID();
   const idempotencyKey=key.current;
   try{sessionStorage.setItem(storageKey+":key",idempotencyKey);}catch{/* Optional. */}
   await apiFetch("/api/placements/tpo/companies/"+encodeURIComponent(companyId)+"/team",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({body:body.trim(),idempotencyKey}),
   });
   update("");router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Message not sent. Your draft is still here; try again.");
  }finally{pending.current=false;setBusy(false);}
 }
 return <form className="space-y-3" onSubmit={event=>{event.preventDefault();void submit();}}>
  <label className="grid gap-1 text-sm text-body">Message
   <Textarea required maxLength={4000} rows={4} value={body} disabled={busy}
    onChange={event=>update(event.target.value)}
    />
  </label>
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
  <p className="text-xs text-muted-foreground">Only active placement-team members in this college can read and reply.</p>
  <Button type="submit" disabled={busy||!body.trim()}
   >
   {busy?"Sending…":"Send"}
  </Button>
 </form>;
}
