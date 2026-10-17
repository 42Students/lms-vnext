"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function SuperAdminCompanyRestore({id,name}:{id:string;name:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 async function restore(){
  if(!confirm("Restore global company identity "+name+"? This does not reactivate archived college relationships."))return;
  setBusy(true);setError(null);
  try{
   const response=await fetch("/api/admin/companies/restore",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify({companyId:id,confirmed:true}),
   });
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(data?.error??"Could not restore company.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Company restore failed.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-1">
  <button type="button" disabled={busy} onClick={()=>void restore()}
   className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Restoring…":"Restore company"}
  </button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
