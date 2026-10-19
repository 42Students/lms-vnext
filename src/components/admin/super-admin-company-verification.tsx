"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
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
   className="space-y-2 border-l-2 border-border py-2 pl-4 text-sm text-body">
   <p>{verified?"Unverify":"Verify"} {name} globally for 42?</p>
   <Button type="button" disabled={busy} onClick={()=>void save()}
    className="min-h-11 sm:min-h-9">
    {busy?"Saving…":verified?"Confirm unverify":"Confirm verify"}</Button>
   <Button type="button" variant="secondary" disabled={busy} onClick={()=>setConfirm(false)}
    className="ml-2">Cancel</Button>
  </div>:
  <Button type="button" variant="secondary" disabled={busy} onClick={()=>setConfirm(true)}
   className="min-h-11 sm:min-h-9">
   {verified?"Unverify":"Verify"} company</Button>}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}
