"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
export function TpoCompanyTrustSwitch({companyId,initialTrusted,updatedAt}:{companyId:string;initialTrusted:boolean;updatedAt:string}){
 const router=useRouter(),pending=useRef(false);
 const [trusted,setTrusted]=useState(initialTrusted),[version,setVersion]=useState(updatedAt);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function toggle(){
  if(pending.current)return;
  pending.current=true;setBusy(true);setMessage("");
  const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch("/api/placements/tpo/companies/lifecycle",{
    method:"POST",credentials:"same-origin",signal:controller.signal,
    headers:{"content-type":"application/json"},
    body:JSON.stringify({companyId,expectedUpdatedAt:version,
     action:"EDIT_TRUST",confirmed:true,nextTrusted:!trusted,
     reason:"Changed company trust from its company page"}),
   });
   if(!response.ok)throw new Error("NOT_SAVED");
   const result=await response.json() as {updatedAt?:string;isTrusted?:boolean};
   if(typeof result.isTrusted!=="boolean"||!result.updatedAt)throw new Error("UNCONFIRMED");
   setTrusted(result.isTrusted);setVersion(result.updatedAt);
   setMessage(result.isTrusted?
    "College trust saved. Direct publishing still requires a verified company, a current recruiter grant and college policy approval.":
    "College trust removed. Future recruiter requests must follow the current review policy.");
   router.refresh();
  }catch{setMessage("Couldn't save. Refresh and try again.");}
  finally{window.clearTimeout(timer);pending.current=false;setBusy(false);}
 }
 return <div className="mt-4 space-y-2">
  <label className="flex min-h-11 md:min-h-9 items-center gap-3 text-sm font-semibold">
   <Checkbox checked={trusted} disabled={busy}
    onChange={()=>void toggle()} aria-label="Trusted company"/>
   Trusted
  </label>
  <p className="text-xs text-muted-foreground">Trust is a college decision, not platform verification. Direct publishing also requires an active recruiter grant and college policy approval.</p>
  {message?<p role={message.startsWith("Couldn't")?"alert":"status"} className="text-sm">{message}</p>:null}
 </div>;
}
