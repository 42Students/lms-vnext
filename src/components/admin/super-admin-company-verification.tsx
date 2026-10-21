"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
export function SuperAdminCompanyVerification({companyId,name,verified}:{
 companyId:string;name:string;verified:boolean;
}){
 const {showToast}=useToast();
 const router=useRouter(),[confirm,setConfirm]=useState(false),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function save(){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   await apiFetch("/api/admin/companies/verification",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({companyId,verified:!verified}),
   });
   const legacyMessage=verified?"Removed from 42\'s list":"Verified by 42";
   setConfirm(false);setNotice(legacyMessage);
   showToast({tone:"success",title:legacyMessage});
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Verification unavailable. Please try again.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Company verification" aria-busy={busy} className="mt-2 min-w-0 space-y-2 print:hidden">
  <Button type="button" variant={verified?"secondary":"primary"} disabled={busy} loading={busy}
   onClick={()=>{setError("");setNotice("");setConfirm(true);}}
   className="min-h-11 w-full sm:min-h-9 sm:w-auto">
   {verified?"Unverify":"Verify"} company
  </Button>
  <ConfirmDialog open={confirm} onOpenChange={open=>{if(!busy)setConfirm(open);}}
   title={verified?"Remove global company verification?":"Verify company globally?"}
   description={(verified?"Unverify ":"Verify ")+name+" globally for 42? Canonical company verification is separate from email-domain verification and recruiter grants."}
   confirmLabel={verified?"Confirm unverify":"Confirm verify"} confirmVariant={verified?"danger":"primary"}
   pending={busy} onConfirm={()=>void save()}>
   <div className="min-w-0 space-y-3">
    <p className="m-0 break-words text-sm leading-5 text-body"><strong className="font-semibold text-foreground">{name}</strong> · {verified?"Verified → Unverified":"Unverified → Verified"}</p>
    <Alert tone="info">The canonical company identity is shared across linked college relationships. This change does not automatically verify unverified email domains or grant recruiters access.</Alert>
    {error?<Alert tone="error">{error}</Alert>:null}
   </div>
  </ConfirmDialog>
  {error&&!confirm?<Alert tone="error">{error}</Alert>:null}
  {notice&&!confirm?<Alert tone="success">{notice}</Alert>:null}
 </section>;
}
