"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
 return <div className="mt-2 space-y-2 print:hidden">
  <Button type="button" variant="secondary" disabled={busy} loading={busy}
   onClick={()=>setConfirm(true)} className="min-h-11 md:min-h-9">
   {verified?"Unverify":"Verify"} company
  </Button>
  <ConfirmDialog open={confirm} onOpenChange={setConfirm}
   title={verified?"Remove global company verification?":"Verify company globally?"}
   description={(verified?"Unverify ":"Verify ")+name+" globally for 42?"}
   confirmLabel={verified?"Confirm unverify":"Confirm verify"} pending={busy}
   onConfirm={()=>void save()}/>
  {error?<Alert tone="error">{error}</Alert>:null}
 </div>;
}
