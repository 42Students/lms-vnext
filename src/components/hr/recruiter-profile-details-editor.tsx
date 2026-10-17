"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {splitHrRecruiterName} from "@/modules/placements/hr-recruiter-name-fields-model";
import {recruiterMobileNumberValid} from "@/modules/placements/recruiter-profile-details-service-client";

type Fields={firstName:string;lastName:string;designation:string;mobile:string};
type SavedResponse={profile:{displayName:string|null;phoneE164:string|null;title:string|null;
 userUpdatedAt:string;profileUpdatedAt:string}};
const field="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground";
export function RecruiterProfileDetailsEditor({initialName,initialTitle,initialMobile,email,
 userUpdatedAt,profileUpdatedAt}:{
 initialName:string|null;initialTitle:string|null;initialMobile:string|null;email:string|null;
 userUpdatedAt:string;profileUpdatedAt:string;
}){
 const router=useRouter();
 const initial=()=>({...splitHrRecruiterName(initialName),designation:initialTitle??"",
  mobile:initialMobile??""});
 const [fields,setFields]=useState<Fields>(initial);
 const [saved,setSaved]=useState<Fields>(initial);
 const [versions,setVersions]=useState({userUpdatedAt,profileUpdatedAt});
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [leaveHref,setLeaveHref]=useState<string|null>(null);
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const dirty=Object.keys(fields).some(key=>fields[key as keyof Fields]!==saved[key as keyof Fields]);
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  const protectLink=(event:MouseEvent)=>{
   const target=event.target;
   if(!(target instanceof Element))return;
   const anchor=target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement))return;
   const url=new URL(anchor.href,window.location.href);
   if(url.origin!==window.location.origin||url.pathname===window.location.pathname)return;
   event.preventDefault();event.stopPropagation();
   setLeaveHref(url.pathname+url.search+url.hash);
  };
  window.addEventListener("beforeunload",warn);
  document.addEventListener("click",protectLink,true);
  return ()=>{window.removeEventListener("beforeunload",warn);
   document.removeEventListener("click",protectLink,true);};
 },[dirty]);
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!dirty||pending)return;
  if(!fields.firstName.trim()){setError("First name is required");return;}
  if(!recruiterMobileNumberValid(fields.mobile)){
   setError("Enter a valid 10-digit mobile number, or leave it blank");return;
  }
  setError("");setNotice("");
  try{
   await run(async()=>{
    const data=await apiFetch<SavedResponse>("/api/placements/recruiter/profile/details",{
     method:"PATCH",headers:{"content-type":"application/json"},credentials:"same-origin",
     body:JSON.stringify({...fields,...versions}),timeoutMs:25000,
    });
    const name=splitHrRecruiterName(data.profile.displayName);
    const next={...name,designation:data.profile.title??"",mobile:data.profile.phoneE164??""};
    setFields(next);setSaved(next);
    setVersions({userUpdatedAt:data.profile.userUpdatedAt,profileUpdatedAt:data.profile.profileUpdatedAt});
    setNotice("Profile saved");router.refresh();
   });
  }catch(reason){
   setError(reason instanceof FriendlyFetchError&&reason.status===409
    ?"Profile was not saved. Your profile changed since you opened it. Refresh and try again."
    :"Could not save your profile. Your changes are still here; try again.");
  }
 }
 function change(key:keyof Fields,value:string){setFields(previous=>({...previous,[key]:value}));}
 return <div className="space-y-3">
  <form onSubmit={event=>void save(event)} className="space-y-4">
   <dl className="grid gap-4 sm:grid-cols-2">
    <div><dt><label htmlFor="recruiter-first-name" className="text-xs font-medium uppercase text-muted-foreground">First name</label></dt>
     <dd><input id="recruiter-first-name" value={fields.firstName} required maxLength={100}
       onChange={event=>change("firstName",event.target.value)} className={field}/></dd></div>
    <div><dt><label htmlFor="recruiter-last-name" className="text-xs font-medium uppercase text-muted-foreground">Last name</label></dt>
     <dd><input id="recruiter-last-name" value={fields.lastName} maxLength={100}
       onChange={event=>change("lastName",event.target.value)} className={field}/></dd></div>
    <div><dt className="text-xs font-medium uppercase text-muted-foreground">Work email</dt>
     <dd className="mt-1 text-sm text-foreground">{email??"Not provided"}</dd>
     <p className="mt-1 text-xs text-muted-foreground">You sign in with this, so it can&apos;t be changed here. A different company means a new work email and a new account.</p></div>
    <div><dt><label htmlFor="recruiter-designation" className="text-xs font-medium uppercase text-muted-foreground">Designation</label></dt>
     <dd><input id="recruiter-designation" value={fields.designation} maxLength={160}
       onChange={event=>change("designation",event.target.value)} className={field}/></dd></div>
    <div><dt><label htmlFor="recruiter-mobile" className="text-xs font-medium uppercase text-muted-foreground">Mobile</label></dt>
     <dd><input id="recruiter-mobile" type="tel" inputMode="tel" value={fields.mobile} maxLength={30}
       onChange={event=>change("mobile",event.target.value)} className={field}/></dd>
     <p className="mt-1 text-xs text-muted-foreground">Only for the placement cell to call you. You never sign in with it.</p></div>
   </dl>
   {dirty?<span role="status" className="text-xs font-semibold text-warning-text">Unsaved changes</span>:null}
   <button type="submit" disabled={!dirty||pending} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {pending?"Saving…":"Save changes"}</button>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  </form>
  <ConfirmActionDialog open={leaveHref!==null} title="Discard your unsaved profile changes?"
   consequence="Your changes have not been saved." confirmLabel="Discard"
   onCancel={()=>setLeaveHref(null)} onConfirm={()=>{
    const href=leaveHref;setLeaveHref(null);setSaved(fields);
    if(href)router.push(href);
   }}/>
 </div>;
}
