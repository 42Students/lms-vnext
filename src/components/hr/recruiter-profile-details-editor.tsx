"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
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
 const [pendingLeave,setPendingLeave]=useState<string|null>(null);
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
 useEffect(()=>{
  if(!dirty||busy)return;
  const intercept=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const target=event.target;
   if(!(target instanceof Element))return;
   const anchor=target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement)||anchor.target||anchor.hasAttribute("download"))return;
   const destination=new URL(anchor.href,window.location.href);
   if(destination.origin!==window.location.origin)return;
   if(destination.pathname===window.location.pathname&&destination.search===window.location.search&&destination.hash)return;
   event.preventDefault();event.stopPropagation();
   setPendingLeave(destination.pathname+destination.search+destination.hash);
  };
  document.addEventListener("click",intercept,true);
  return ()=>document.removeEventListener("click",intercept,true);
 },[dirty,busy]);
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
  <ConfirmActionDialog open={pendingLeave!==null}
   title="Discard your unsaved profile changes?"
   consequence="Your unsaved changes will be lost."
   confirmLabel="Discard"
   onCancel={()=>setPendingLeave(null)}
   onConfirm={()=>{const href=pendingLeave;setPendingLeave(null);if(href)router.push(href);}}/>
 </form>;
}
