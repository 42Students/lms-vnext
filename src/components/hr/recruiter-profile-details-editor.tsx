"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {splitHrRecruiterName} from "@/modules/placements/hr-recruiter-name-fields-model";
import {hrProfileSaveErrorFeedback,hrProfileDetailsSaveReceiptSchema} from "@/modules/placements/recruiter-profile-details-model";
export function RecruiterProfileDetailsEditor({initialName,initialTitle,initialPhone,
 userUpdatedAt,profileUpdatedAt,contactReady}:{
 initialName:string|null;initialTitle:string|null;initialPhone:string|null;
 userUpdatedAt:string;profileUpdatedAt:string;contactReady:boolean;
}){
 const router=useRouter();
 const {run:runGuarded}=useGuardedAction({timeoutMs:13000});
 const originalName=splitHrRecruiterName(initialName);
 const [saved,setSaved]=useState({firstName:originalName.firstName,lastName:originalName.lastName,
  title:initialTitle??"",phone:initialPhone??""});
 const [form,setForm]=useState(saved),[versions,setVersions]=useState({userUpdatedAt,profileUpdatedAt});
 const [busy,setBusy]=useState(false),busyRef=useRef(false);
 const [feedback,setFeedback]=useState("");
 const [leaveHref,setLeaveHref]=useState<string|null>(null);
 const dirty=Object.keys(saved).some(key=>{
  const field=key as keyof typeof saved;
  return saved[field]!==form[field];
 });
 useEffect(()=>{
  if(!dirty)return;
  const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};
  const intercept=(event:MouseEvent)=>{
   const target=event.target;
   if(!(target instanceof Element))return;
   const anchor=target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement))return;
   if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
   const url=new URL(anchor.href,window.location.href);
   if(url.origin!==window.location.origin||url.pathname===window.location.pathname)return;
   event.preventDefault();event.stopPropagation();
   setLeaveHref(url.pathname+url.search+url.hash);
  };
  window.addEventListener("beforeunload",warn);
  document.addEventListener("click",intercept,true);
  return ()=>{window.removeEventListener("beforeunload",warn);
   document.removeEventListener("click",intercept,true);};
 },[dirty]);
 function update(key:keyof typeof form,value:string){setForm(s=>({...s,[key]:value}));setFeedback("");}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!dirty||busyRef.current)return;
  busyRef.current=true;setBusy(true);setFeedback("");
  const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
   const response=await runGuarded(()=>fetch("/api/placements/recruiter/profile/details",{
    method:"PATCH",credentials:"same-origin",redirect:"error",signal:controller.signal,
    headers:{"content-type":"application/json"},
    body:JSON.stringify({...form,expectedUserUpdatedAt:versions.userUpdatedAt,
     expectedProfileUpdatedAt:versions.profileUpdatedAt}),
   }));
   if(!response)throw new Error("PROFILE_REQUEST_UNCONFIRMED");
   if(!response.ok){setFeedback(hrProfileSaveErrorFeedback(response.status));return;}
   const responseBody:unknown=await response.json().catch(()=>null);
   const receipt=hrProfileDetailsSaveReceiptSchema.safeParse(responseBody);
   if(!receipt.success)throw new Error("NO_CONFIRMED_PROFILE");
   const confirmed=receipt.data.profile;
   const name=splitHrRecruiterName(confirmed.displayName);
   const next={...name,title:confirmed.title??"",phone:confirmed.phone};
   setSaved(next);setForm(next);
   setVersions({userUpdatedAt:confirmed.userUpdatedAt,profileUpdatedAt:confirmed.profileUpdatedAt});
   setFeedback("Profile saved");router.refresh();
  }catch{setFeedback("Could not save your profile. Your changes are still here; try again.");}
  finally{window.clearTimeout(timeout);busyRef.current=false;setBusy(false);}
 }
 return <form onSubmit={e=>void save(e)} className="sm:col-span-2 space-y-3">
  <div className="grid gap-3 sm:grid-cols-2">
   {([["firstName","First name"],["lastName","Last name"],["title","Designation"],["phone","Mobile"]] as const).map(([key,label])=>
    <label key={key} className="grid gap-1 text-sm text-body">{label}
     <Input name={key} type={key==="phone"?"tel":"text"} autoComplete={key==="firstName"?"given-name":key==="lastName"?"family-name":key==="phone"?"tel":"organization-title"}
      value={form[key]} disabled={busy||(key==="phone"&&!contactReady)} maxLength={key==="phone"?14:key==="title"?160:100}
      onChange={e=>update(key,e.target.value)}
      className="w-full"/>
    </label>)}
  </div>
  {!contactReady?<p role="status" className="text-xs text-body">Mobile editing is temporarily unavailable. You can still save your name and designation.</p>:null}
  {dirty?<p role="status" className="text-sm font-semibold">Unsaved changes</p>:null}
  <Button type="submit" disabled={busy||!dirty}
   >
   {busy?"Saving…":"Save changes"}</Button>
  {feedback?<p role={feedback==="Profile saved"?"status":"alert"} className="text-sm">{feedback}</p>:null}
  <ConfirmActionDialog open={leaveHref!==null} title="Discard your unsaved profile changes?"
   consequence="Your changes have not been saved." confirmLabel="Discard"
   onCancel={()=>setLeaveHref(null)} onConfirm={()=>{
    const href=leaveHref;setLeaveHref(null);setForm(saved);
    if(href)router.push(href);
   }}/>
 </form>;
}
