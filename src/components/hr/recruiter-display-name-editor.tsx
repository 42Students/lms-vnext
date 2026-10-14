"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
export function RecruiterDisplayNameEditor({initialName,updatedAt}:{
 initialName:string|null;updatedAt:string;
}) {
 const router=useRouter();
 const [name,setName]=useState(initialName??"");
 const [version,setVersion]=useState(updatedAt);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(saving)return;
  setSaving(true);setMessage("");
  try{
   const res=await fetch("/api/placements/recruiter/profile/name",{
    method:"PATCH",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({displayName:name,expectedUpdatedAt:version}),
   });
   const body=await res.json().catch(()=>null) as {
    profile?:{displayName:string|null;updatedAt:string};
   }|null;
   if(!res.ok||!body?.profile){
    setMessage(res.status===409?"Your name changed. Refresh to retry.":"Name could not be saved.");
    return;
   }
   setName(body.profile.displayName??"");setVersion(body.profile.updatedAt);
   setMessage("Display name saved.");router.refresh();
  }catch{setMessage("Network error while saving name.");}
  finally{setSaving(false);}
 }
 return <div>
  <form onSubmit={event=>void save(event)} className="grid gap-2">
   <label htmlFor="hr-display-name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
    Display name
   </label>
   <input id="hr-display-name" value={name} maxLength={160}
    onChange={event=>setName(event.target.value)}
    className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground" />
   <button type="submit" disabled={saving||name.trim().length<2}
    className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
    {saving?"Saving…":"Save name"}
   </button>
   {message?<p role="status" className="text-xs text-body">{message}</p>:null}
  </form>
 </div>;
}
