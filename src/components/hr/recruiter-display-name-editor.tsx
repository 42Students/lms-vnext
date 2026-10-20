"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
 return <div className="min-w-0">
  <form onSubmit={event=>void save(event)} className="grid min-w-0 gap-3 sm:grid-cols-2">
   <label htmlFor="hr-first-name" className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-start-1 sm:row-start-1">First name<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span></label>
   <Input id="hr-first-name" value={firstName} maxLength={100} required
    onChange={event=>setFirstName(event.target.value)}
    className="min-w-0 w-full sm:col-start-1 sm:row-start-2"/>
   <label htmlFor="hr-last-name" className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-start-2 sm:row-start-1">Last name</label>
   <Input id="hr-last-name" value={lastName} maxLength={100}
    onChange={event=>setLastName(event.target.value)}
    className="min-w-0 w-full sm:col-start-2 sm:row-start-2"/>
   <Button type="submit" loading={saving} disabled={saving||(firstName===savedName.firstName&&lastName===savedName.lastName)||!hrRecruiterNameFieldsSchema.safeParse({firstName,lastName}).success}
    className="min-h-11 w-full sm:col-start-1 sm:w-auto md:min-h-9">
    {saving?"Saving…":"Save name"}
   </Button>
   <Button type="button" disabled={saving||(firstName===savedName.firstName&&lastName===savedName.lastName)}
     onClick={()=>{setFirstName(savedName.firstName);setLastName(savedName.lastName);setMessage("");}}
     variant="secondary" className="min-h-11 w-full sm:col-start-2 sm:w-auto md:min-h-9">
     Cancel unsaved changes
   </Button>
   {message?<p role={message==="Display name saved."?"status":"alert"} className="min-w-0 break-words text-sm text-body sm:col-span-2">{message}</p>:null}
  </form>
 </div>;
}
