"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
export function RecruiterDesignationEditor({initialTitle,updatedAt}:{initialTitle:string|null;updatedAt:string}) {
 const router=useRouter();
 const [title,setTitle]=useState(initialTitle??"");
 const [version,setVersion]=useState(updatedAt);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 async function save(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if(saving)return;
  setSaving(true);setError("");setSuccess("");
  try {
   const response=await fetch("/api/placements/recruiter/profile",{method:"PATCH",
      credentials:"same-origin",headers:{"content-type":"application/json"},
      body:JSON.stringify({title,expectedUpdatedAt:version})});
   const payload=await response.json().catch(()=>null) as {profile?:{title:string|null;updatedAt:string};error?:string}|null;
   if(!response.ok || !payload?.profile) {
     setError(response.status===409?"This profile changed since you opened it. Refresh before saving.":"Designation could not be saved.");
     return;
   }
   setTitle(payload.profile.title??"");setVersion(payload.profile.updatedAt);
   setSuccess("Designation saved.");router.refresh();
  }catch{setError("Could not save designation. Check your connection and try again.");}
  finally{setSaving(false);}
 }
 return <div className="sm:col-span-2">
  <form onSubmit={event=>void save(event)} className="space-y-2">
   <label htmlFor="hr-recruiter-designation" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Designation</label>
   <div className="flex flex-wrap gap-2">
    <Input id="hr-recruiter-designation" value={title} onChange={event=>setTitle(event.target.value)}
       maxLength={160} className="min-w-48 flex-1"/>
    <Button type="submit" disabled={saving||title.length>160}>
      {saving?"Saving…":"Save designation"}</Button>
   </div>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {success?<p role="status" className="text-sm text-muted-foreground">{success}</p>:null}
  </form>
 </div>;
}
