"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {splitHrRecruiterName} from "@/modules/placements/hr-recruiter-name-fields-model";
export function RecruiterProfileDetailsEditor({initialName,initialTitle,initialPhone,
 userUpdatedAt,profileUpdatedAt,contactReady}:{
 initialName:string|null;initialTitle:string|null;initialPhone:string|null;
 userUpdatedAt:string;profileUpdatedAt:string;contactReady:boolean;
}){
 const router=useRouter();
 const originalName=splitHrRecruiterName(initialName);
 const [saved,setSaved]=useState({firstName:originalName.firstName,lastName:originalName.lastName,
  title:initialTitle??"",phone:initialPhone??""});
 const [form,setForm]=useState(saved),[versions,setVersions]=useState({userUpdatedAt,profileUpdatedAt});
 const [busy,setBusy]=useState(false),busyRef=useRef(false);
 const [feedback,setFeedback]=useState("");
 const dirty=Object.keys(saved).some(key=>{
  const field=key as keyof typeof saved;
  return saved[field]!==form[field];
 });
 useEffect(()=>{
  if(!dirty)return;
  const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 function update(key:keyof typeof form,value:string){setForm(s=>({...s,[key]:value}));setFeedback("");}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!dirty||busyRef.current)return;
  busyRef.current=true;setBusy(true);setFeedback("");
  const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch("/api/placements/recruiter/profile/details",{
    method:"PATCH",credentials:"same-origin",signal:controller.signal,
    headers:{"content-type":"application/json"},
    body:JSON.stringify({...form,expectedUserUpdatedAt:versions.userUpdatedAt,
     expectedProfileUpdatedAt:versions.profileUpdatedAt}),
   });
   if(!response.ok){setFeedback(response.status===409?
    "Your profile changed. Refresh before saving; your edits are still here.":
    "Could not save your profile. Your changes are still here; try again.");return;}
   const body=await response.json() as {profile?:{
    displayName:string;title:string|null;phone:string;
    userUpdatedAt:string;profileUpdatedAt:string;
   }};
   if(!body.profile)throw new Error("NO_CONFIRMED_PROFILE");
   const name=splitHrRecruiterName(body.profile.displayName);
   const next={...name,title:body.profile.title??"",phone:body.profile.phone};
   setSaved(next);setForm(next);
   setVersions({userUpdatedAt:body.profile.userUpdatedAt,profileUpdatedAt:body.profile.profileUpdatedAt});
   setFeedback("Profile saved");router.refresh();
  }catch{setFeedback("Profile was not saved. Your changes are still here; try again.");}
  finally{window.clearTimeout(timeout);busyRef.current=false;setBusy(false);}
 }
 return <form onSubmit={e=>void save(e)} className="sm:col-span-2 space-y-3">
  <div className="grid gap-3 sm:grid-cols-2">
   {([["firstName","First name"],["lastName","Last name"],["title","Designation"],["phone","Mobile"]] as const).map(([key,label])=>
    <label key={key} className="grid gap-1 text-sm text-body">{label}
     <input name={key} type={key==="phone"?"tel":"text"} autoComplete={key==="firstName"?"given-name":key==="lastName"?"family-name":key==="phone"?"tel":"organization-title"}
      value={form[key]} disabled={busy||(key==="phone"&&!contactReady)} maxLength={key==="phone"?14:key==="title"?160:100}
      onChange={e=>update(key,e.target.value)}
      className="min-h-11 rounded border border-border bg-surface px-3"/>
    </label>)}
  </div>
  {!contactReady?<p role="status" className="text-xs text-body">Mobile editing is temporarily unavailable. You can still save your name and designation.</p>:null}
  {dirty?<p role="status" className="text-sm font-semibold">Unsaved changes</p>:null}
  <button type="submit" disabled={busy||!dirty}
   className="min-h-11 rounded bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">
   {busy?"Saving…":"Save changes"}</button>
  {feedback?<p role={feedback==="Profile saved"?"status":"alert"} className="text-sm">{feedback}</p>:null}
 </form>;
}
