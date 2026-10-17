"use client";
import {useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {collegeSignInMethodSchema} from "@/modules/colleges/signin-methods-model";
import type {z} from "zod";
type Method=z.infer<typeof collegeSignInMethodSchema>;
const choices:{value:Method;label:string;hint:string}[]=[
 {value:"EMAIL_AND_PHONE",label:"Email and phone (default)",hint:"Email first; phone also available"},
 {value:"PHONE_AND_EMAIL",label:"Phone and email",hint:"Phone first; email also available"},
 {value:"EMAIL_ONLY",label:"Email only",hint:"Only email one-time codes on this college host"},
 {value:"PHONE_ONLY",label:"Phone only",hint:"Only phone one-time codes on this college host"},
];
export function CollegeSigninMethodForm({collegeId,method,version,ready}:{collegeId:string;method:Method;version:number;ready:boolean}){
 const router=useRouter(),[selection,setSelection]=useState<Method>(method);
 const {pending:saving,run:guardedRun}=useGuardedAction({busyLabel:"Saving..."});
 const [message,setMessage]=useState("");
 async function save(){
  if(!ready||saving||selection===method)return;
  if(!window.confirm("Change allowed sign-in methods for this college? Current sessions stay signed in."))return;
  setMessage("");
  await guardedRun(async()=>{
    try {
      await apiFetch<void>("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/signin",{
        method:"PUT",headers:{"content-type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({collegeId,method:selection,expectedVersion:version}),
      });
      setMessage("Sign-in settings saved");router.refresh();
    }catch(error){
      setMessage(error instanceof FriendlyFetchError && error.status===409
        ?"Settings changed elsewhere. Refresh before retrying."
        :error instanceof Error?error.message:"Could not save sign-in settings.");
    }
  });
 }
 return <section aria-label="College sign-in methods" className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="font-semibold">Sign-in method</h2>
  <fieldset disabled={!ready||saving} className="grid gap-3">
   <legend className="sr-only">Sign-in method</legend>
   {choices.map(choice=><label key={choice.value} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-border p-3">
    <input type="radio" name="signin-method" value={choice.value}
     checked={selection===choice.value} onChange={()=>setSelection(choice.value)}/>
    <span><strong className="block text-sm">{choice.label}</strong><span className="text-xs text-muted-foreground">{choice.hint}</span></span>
   </label>)}
  </fieldset>
  <button type="button" disabled={!ready||saving||selection===method} onClick={()=>void save()}
   className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
   {saving?"Saving…":"Save sign-in settings"}
  </button>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  {!ready?<p role="status" className="text-sm text-warning-text">Sign-in method storage is unavailable; changes are disabled.</p>:null}
 </section>;
}
