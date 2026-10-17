"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";

export function CollegeAdminLifecycleAction({membershipId,status,hasMentorRole}:{
 membershipId:string;status:string;hasMentorRole:boolean;
}){
 const router=useRouter();
 const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const action=status==="ACTIVE"?"SUSPEND":"REACTIVATE";
 async function submit(){
  if(busy||(action==="SUSPEND"&&hasMentorRole)||(action==="SUSPEND"&&reason.trim().length<3))return;
  if(!window.confirm(action==="SUSPEND"?
   "Suspend this administrator's college access and end their device sessions?":
   "Reactivate this administrator's college access?"))return;
  setBusy(true);setError("");
  try{
   await apiFetch("/api/people/"+encodeURIComponent(membershipId)+"/lifecycle",{
    method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify(action==="SUSPEND"?{action,reason:reason.trim()}:{action}),
   });
   setReason("");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to change access");}
  finally{setBusy(false);}
 }
 if(status!=="ACTIVE"&&status!=="SUSPENDED")return null;
 if(hasMentorRole&&action==="SUSPEND")return <p className="text-xs text-warning-text">Also assigned to mentoring. Review active project assignments before changing access.</p>;
 return <div className="min-w-44 space-y-2">
  {action==="SUSPEND"?<label className="grid gap-1 text-xs font-medium text-body">Suspension reason
   <input value={reason} maxLength={1000} onChange={event=>setReason(event.target.value)}
    className="min-h-10 rounded-md border border-border px-2 text-foreground" placeholder="Reason for suspension"/>
  </label>:null}
  <button type="button" disabled={busy||(action==="SUSPEND"&&reason.trim().length<3)}
   onClick={()=>void submit()} className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-primary-text disabled:opacity-50">
    {busy?"Saving…":action==="SUSPEND"?"Suspend":"Reactivate"}
  </button>
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
