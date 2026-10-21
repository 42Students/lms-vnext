"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {splitHrRecruiterName} from "@/modules/placements/hr-recruiter-name-fields-model";
import {hrProfileSaveErrorFeedback,hrProfileDetailsSaveReceiptSchema,recruiterProfileFieldErrors} from "@/modules/placements/recruiter-profile-details-model";
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
 const [fieldErrors,setFieldErrors]=useState<Partial<Record<keyof typeof saved,string>>>({});
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
   if(url.origin!==window.location.origin||(url.pathname===window.location.pathname&&url.search===window.location.search&&url.hash===window.location.hash))return;
   event.preventDefault();event.stopPropagation();
   setLeaveHref(url.pathname+url.search+url.hash);
  };
  window.addEventListener("beforeunload",warn);
  document.addEventListener("click",intercept,true);
  // Navigation API intercepts back/forward and programmatic same-document
  // navigation in supporting browsers. Link/unload protection remains the fallback.
  type NavigateEventLike=Event & {destination?:{url:string}};
  type NavigationLike={
   addEventListener:(type:string,listener:(event:NavigateEventLike)=>void)=>void;
   removeEventListener:(type:string,listener:(event:NavigateEventLike)=>void)=>void;
  };
  const navigation=(window as Window & {navigation?:NavigationLike}).navigation;
  const preventNavigation=(event:NavigateEventLike)=>{
   if(!event.cancelable||!event.destination?.url)return;
   const url=new URL(event.destination.url,window.location.href);
   if(url.origin!==window.location.origin)return;
   if(url.pathname===window.location.pathname&&
      url.search===window.location.search&&url.hash===window.location.hash)return;
   event.preventDefault();
   setLeaveHref(url.pathname+url.search+url.hash);
  };
  navigation?.addEventListener("navigate",preventNavigation);
  return ()=>{window.removeEventListener("beforeunload",warn);
   document.removeEventListener("click",intercept,true);
   navigation?.removeEventListener("navigate",preventNavigation);};
 },[dirty]);
 useEffect(()=>{
  if(feedback!=="Profile saved")return;
  const timer=window.setTimeout(()=>setFeedback(""),3000);
  return ()=>window.clearTimeout(timer);
 },[feedback]);
 function update(key:keyof typeof form,value:string){
  setForm(s=>({...s,[key]:value}));setFeedback("");
  setFieldErrors(previous=>({...previous,[key]:undefined}));
 }
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!dirty||busyRef.current)return;
  const errors=recruiterProfileFieldErrors(form);
  if(Object.keys(errors).length){
   setFieldErrors(errors);
   const first=(["firstName","lastName","title","phone"] as const)
     .find(key=>errors[key]);
   if(first)e.currentTarget.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
   setFeedback("Check the highlighted profile details.");
   return;
  }
  setFieldErrors({});
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
   if(!response.ok){
    const payload:unknown=await response.json().catch(()=>null);
    const code=payload && typeof payload==="object" && "error" in payload &&
      typeof payload.error==="string" ? payload.error : undefined;
    const errors=recruiterProfileFieldErrors(form,code);
    if(code==="INVALID_MOBILE")errors.phone="Check the mobile number.";
    setFieldErrors(errors);
    if(Object.keys(errors).length){
     const first=(["firstName","lastName","title","phone"] as const).find(key=>errors[key]);
     if(first)document.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
    }
    setFeedback(hrProfileSaveErrorFeedback(response.status));return;
   }
   const responseBody:unknown=await response.json().catch(()=>null);
   const receipt=hrProfileDetailsSaveReceiptSchema.safeParse(responseBody);
   if(!receipt.success)throw new Error("NO_CONFIRMED_PROFILE");
   const confirmed=receipt.data.profile;
   const name=splitHrRecruiterName(confirmed.displayName);
   const next={...name,title:confirmed.title??"",phone:confirmed.phone};
   setSaved(next);setForm(next);setFieldErrors({});
   setVersions({userUpdatedAt:confirmed.userUpdatedAt,profileUpdatedAt:confirmed.profileUpdatedAt});
   setFeedback("Profile saved");router.refresh();
  }catch{setFeedback("Could not save your profile. Your changes are still here; try again.");}
  finally{window.clearTimeout(timeout);busyRef.current=false;setBusy(false);}
 }
 return <form onSubmit={e=>void save(e)} className="min-w-0 space-y-4">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
   <p className="font-semibold">Recruiter contact details</p>
   {dirty?<span role="status" className="inline-flex w-fit items-center rounded-full border border-[var(--lms-warning-border)] bg-[var(--lms-warning-subtle)] px-3 py-1 text-xs font-semibold text-warning-text">Unsaved changes</span>:null}
  </div>
  <div className="grid min-w-0 gap-4 min-[768px]:grid-cols-2">
   {([["firstName","First name"],["lastName","Last name"],["title","Designation"],["phone","Mobile"]] as const).map(([key,label])=>
    <label key={key} className={`grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] ${key==="title"||key==="phone"?"min-[768px]:col-span-2":""}`}>
     {label}{key==="lastName"?<span className="ml-1 text-xs font-normal">(optional)</span>:null}
     <Input name={key} type={key==="phone"?"tel":"text"} autoComplete={key==="firstName"?"given-name":key==="lastName"?"family-name":key==="phone"?"tel":"organization-title"}
      value={form[key]} required={key==="firstName"} pattern={key==="phone"?"(?:[0-9]{10}|\\+91[0-9]{10})?":undefined}
      aria-invalid={Boolean(fieldErrors[key])} aria-describedby={fieldErrors[key]?`recruiter-profile-${key}-error`:undefined}
      disabled={busy||(key==="phone"&&!contactReady)} maxLength={key==="phone"?14:key==="title"?150:100}
      onChange={e=>update(key,e.target.value)}
      className="min-h-11 w-full min-[768px]:min-h-9"/>
     {key==="phone"?<span className="text-xs font-normal text-muted-foreground">
       Optional. Enter 10 digits, or +91 followed by 10 digits.
      </span>:null}
     {fieldErrors[key]?<span id={`recruiter-profile-${key}-error`} className="text-xs font-normal text-error">{fieldErrors[key]}</span>:null}
    </label>)}
  </div>
  {!contactReady?<div role="status" className="flex flex-wrap items-center gap-2 text-xs text-body">
   Mobile editing is temporarily unavailable. You can still save your name and designation.
   <Button type="button" variant="secondary" disabled={busy}
     onClick={()=>router.refresh()}>Retry contact details</Button>
  </div>:null}
  <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-4 min-[768px]:flex-row min-[768px]:items-center">
    <Button type="submit" loading={busy} disabled={busy||!dirty}
      className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">
      {busy?"Saving…":"Save changes"}</Button>
  </div>
  {feedback==="Profile saved"
    ? <div role="status" className="fixed right-6 top-20 z-50 rounded-lg border border-[var(--lms-success)] bg-white px-4 py-3 text-sm font-semibold text-success shadow-md">✓ Profile saved</div>
    : feedback ? <Alert tone="error" title="Profile was not saved"><span aria-hidden="true">!</span> {feedback}</Alert> : null}
  <ConfirmActionDialog open={leaveHref!==null} title="Discard your unsaved profile changes?"
   consequence="Your changes have not been saved." confirmLabel="Discard"
   onCancel={()=>setLeaveHref(null)} onConfirm={()=>{
    const href=leaveHref;setLeaveHref(null);setForm(saved);
    if(href)router.push(href);
   }}/>
 </form>;
}
