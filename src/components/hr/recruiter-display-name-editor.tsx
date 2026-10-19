"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {splitHrRecruiterName,hrRecruiterNameFieldsSchema,joinHrRecruiterName} from "@/modules/placements/hr-recruiter-name-fields-model";
export function RecruiterDisplayNameEditor({initialName,updatedAt}:{
 initialName:string|null;updatedAt:string;
}) {
 const router=useRouter();
 const [firstName,setFirstName]=useState(()=>splitHrRecruiterName(initialName).firstName);
 const [lastName,setLastName]=useState(()=>splitHrRecruiterName(initialName).lastName);
 const [savedName,setSavedName]=useState(()=>splitHrRecruiterName(initialName));
 const [version,setVersion]=useState(updatedAt);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{
  if(firstName===savedName.firstName&&lastName===savedName.lastName)return;
  const onUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",onUnload);
  return ()=>window.removeEventListener("beforeunload",onUnload);
 },[firstName,lastName,savedName]);
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(saving)return;
  const valid=hrRecruiterNameFieldsSchema.safeParse({firstName,lastName});
  if(!valid.success){setMessage(valid.error.issues[0]?.message??"Check your name.");return;}
  setSaving(true);setMessage("");
  try{
   const res=await fetch("/api/placements/recruiter/profile/name",{
    method:"PATCH",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({displayName:joinHrRecruiterName(firstName,lastName),expectedUpdatedAt:version}),
   });
   const body=await res.json().catch(()=>null) as {
    profile?:{displayName:string|null;updatedAt:string};
   }|null;
   if(!res.ok||!body?.profile){
    setMessage(res.status===409?"Your name changed. Refresh to retry.":"Name could not be saved.");
    return;
   }
   const parts=splitHrRecruiterName(body.profile.displayName);
   setFirstName(parts.firstName);setLastName(parts.lastName);setVersion(body.profile.updatedAt);setSavedName(parts);
   setMessage("Display name saved.");router.refresh();
  }catch{setMessage("Network error while saving name.");}
  finally{setSaving(false);}
 }
 return <div>
  <form onSubmit={event=>void save(event)} className="grid gap-2">
   <label htmlFor="hr-first-name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">First name</label>
   <input id="hr-first-name" value={firstName} maxLength={100} required
    onChange={event=>setFirstName(event.target.value)}
    className="min-h-9 w-full rounded-[9px] border border-border bg-surface px-3 text-sm text-foreground"/>
   <label htmlFor="hr-last-name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last name</label>
   <input id="hr-last-name" value={lastName} maxLength={100}
    onChange={event=>setLastName(event.target.value)}
    className="min-h-9 w-full rounded-[9px] border border-border bg-surface px-3 text-sm text-foreground"/>
   <button type="submit" disabled={saving||(firstName===savedName.firstName&&lastName===savedName.lastName)||!hrRecruiterNameFieldsSchema.safeParse({firstName,lastName}).success}
    className="min-h-9 rounded-[9px] bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
    {saving?"Saving…":"Save name"}
   </button>
   <button type="button" disabled={saving||(firstName===savedName.firstName&&lastName===savedName.lastName)}
     onClick={()=>{setFirstName(savedName.firstName);setLastName(savedName.lastName);setMessage("");}}
     className="min-h-10 rounded-[9px] border border-border px-3 text-sm font-semibold text-body disabled:opacity-40">
     Cancel unsaved changes
   </button>
   {message?<p role="status" className="text-xs text-body">{message}</p>:null}
  </form>
 </div>;
}
