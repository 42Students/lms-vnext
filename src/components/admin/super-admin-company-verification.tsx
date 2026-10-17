"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
export function SuperAdminCompanyVerification({companyId,name,verified}:{
 companyId:string;name:string;verified:boolean;
}){
 const router=useRouter(),[confirm,setConfirm]=useState(false),
  [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function save(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   await apiFetch("/api/admin/companies/verification",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({companyId,verified:!verified}),
   });
   setConfirm(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Verification unavailable. Please try again.");}
  finally{setBusy(false);}
 }
 return <div className="mt-2 space-y-2">
  {confirm?<div role="group" aria-label="Confirm global company verification"
   className="space-y-2 rounded border border-border p-3 text-sm">
   <p>{verified?"Unverify":"Verify"} {name} globally for 42?</p>
   <button type="button" disabled={busy} onClick={()=>void save()}
    className="min-h-10 rounded bg-primary px-3 font-semibold text-on-primary disabled:opacity-50">
    {busy?"Saving…":verified?"Confirm unverify":"Confirm verify"}</button>
   <button type="button" disabled={busy} onClick={()=>setConfirm(false)}
    className="ml-2 min-h-10 rounded border border-border px-3">Cancel</button>
  </div>:
  <button type="button" disabled={busy} onClick={()=>setConfirm(true)}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">
   {verified?"Unverify":"Verify"} company</button>}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
