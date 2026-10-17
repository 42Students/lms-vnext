"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
export function SuperAdminCollegeCompanyCreate({collegeId}:{collegeId:string}){
 const router=useRouter(),[open,setOpen]=useState(false),[error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const values=new FormData(event.currentTarget);
  await run(async()=>{setError("");
   try{
    await apiFetch("/api/placements/companies",{method:"POST",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({collegeId,name:String(values.get("name")??"").trim(),
      websiteUrl:String(values.get("websiteUrl")??"").trim()||undefined,
      primaryDomain:String(values.get("primaryDomain")??"").trim()||undefined}),
    });
    setOpen(false);router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Could not create company. Retry.");}
  });
 }
 return <section className="rounded-xl border border-border bg-surface p-4">
  <h2 className="text-base font-semibold">This college&apos;s companies</h2>
  {!open?<button type="button" onClick={()=>setOpen(true)}
   className="mt-2 min-h-10 rounded bg-primary px-4 font-semibold text-on-primary">
   Add company</button>:
   <form onSubmit={e=>void submit(e)} className="mt-3 grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-sm">Company name<input name="name" required minLength={2}
     maxLength={200} className="min-h-10 rounded border border-border bg-surface p-2"/></label>
    <label className="grid gap-1 text-sm">Company domain<input name="primaryDomain" maxLength={255}
     placeholder="example.com" className="min-h-10 rounded border border-border bg-surface p-2"/></label>
    <label className="grid gap-1 text-sm sm:col-span-2">Website (HTTPS preferred)
     <input name="websiteUrl" type="url" className="min-h-10 rounded border border-border bg-surface p-2"/></label>
    {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
    <div className="flex gap-3 sm:col-span-2">
     <button type="submit" disabled={pending} className="min-h-10 rounded bg-primary px-4 text-on-primary disabled:opacity-50">
      {pending?"Saving…":"Create company"}</button>
     <button type="button" disabled={pending} onClick={()=>setOpen(false)}
      className="min-h-10 rounded border border-border px-4">Cancel</button>
    </div>
   </form>}
 </section>;
}
export function SuperAdminCollegeCompanyRelationshipActions({relationshipId,name,trusted,status,driveCount,companyStatus}:{
 relationshipId:string;name:string;trusted:boolean;status:string;driveCount:number;companyStatus:string;
}){
 const router=useRouter(),[confirm,setConfirm]=useState(false),[error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 async function trust(){
  await run(async()=>{setError("");
   try{await apiFetch("/api/placements/companies/"+encodeURIComponent(relationshipId),{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({isTrusted:!trusted}),
   });router.refresh();}
   catch(e){setError(e instanceof Error?e.message:"Could not change college trust.");}
  });
 }
 async function change(){
  await run(async()=>{setError("");
   try{await apiFetch("/api/admin/companies/relationships",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({relationshipId,
     action:status==="ACTIVE"?"ARCHIVE":"RESTORE",confirmed:true}),
   });setConfirm(false);router.refresh();}
   catch(e){setError(e instanceof Error?e.message:"Could not update company. Retry.");}
  });
 }
 const archive=status==="ACTIVE";
 return <div className="mt-2 space-y-2 text-sm">
  <div className="flex flex-wrap gap-2">
   {archive?<button type="button" disabled={pending} onClick={()=>void trust()}
    className="min-h-10 rounded border border-border px-3 text-primary-text">
    {trusted?"Mark not trusted":"Mark trusted"}</button>:null}
   <button type="button" disabled={pending||(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
    title={archive&&driveCount>0?"Cannot delete a company with drives":undefined}
    onClick={()=>setConfirm(true)}
    className="min-h-10 rounded border border-border px-3 text-primary-text disabled:opacity-50">
    {archive?"Delete company":"Restore company"}</button>
  </div>
  {confirm?<div role="group" aria-label="Confirm company change" className="space-y-2 border border-border p-3">
   <p>{archive?"Delete":"Restore"} {name} for this college? The global company record will be kept.</p>
   <button type="button" disabled={pending} onClick={()=>void change()}
    className="min-h-10 rounded bg-primary px-3 text-on-primary">
    Confirm {archive?"delete":"restore"}</button>
   <button type="button" disabled={pending} onClick={()=>setConfirm(false)}
    className="ml-2 min-h-10 rounded border border-border px-3">Cancel</button>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
