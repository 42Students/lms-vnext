"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
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
 return <section className="border-b border-border pb-5">
  <h2 className="text-base font-semibold text-foreground">This college&apos;s companies</h2>
  {!open?<Button type="button" onClick={()=>setOpen(true)}
   className="mt-2 min-h-11 sm:min-h-9">
   Add company</Button>:
   <form onSubmit={e=>void submit(e)} className="mt-3 grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-[13px] font-semibold text-body">Company name<Input name="name" required minLength={2}
     maxLength={200} className="min-h-11 w-full sm:min-h-9"/></label>
    <label className="grid gap-1 text-[13px] font-semibold text-body">Company domain<Input name="primaryDomain" maxLength={255}
     placeholder="example.com" className="min-h-11 w-full sm:min-h-9"/></label>
    <label className="grid gap-1 text-sm sm:col-span-2">Website (HTTPS preferred)
     <Input name="websiteUrl" type="url" className="min-h-11 w-full sm:min-h-9"/></label>
    {error?<p role="alert" className="text-sm text-error sm:col-span-2">{error}</p>:null}
    <div className="flex gap-3 sm:col-span-2">
     <Button type="submit" disabled={pending} className="min-h-11 sm:min-h-9">
      {pending?"Saving…":"Create company"}</Button>
     <Button type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}
      className="min-h-11 sm:min-h-9">Cancel</Button>
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
   {archive?<Button type="button" variant="secondary" disabled={pending} onClick={()=>void trust()}
    className="min-h-11 sm:min-h-9">
    {trusted?"Mark not trusted":"Mark trusted"}</Button>:null}
   <Button type="button" variant={archive?"danger":"secondary"} disabled={pending||(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
    title={archive&&driveCount>0?"Cannot delete a company with drives":undefined}
    onClick={()=>setConfirm(true)}
    className="min-h-11 sm:min-h-9">
    {archive?"Delete company":"Restore company"}</Button>
  </div>
  {confirm?<div role="group" aria-label="Confirm company change" className="space-y-2 border-l-2 border-border py-2 pl-4">
   <p>{archive?"Delete":"Restore"} {name} for this college? The global company record will be kept.</p>
   <Button type="button" variant={archive?"danger":"primary"} disabled={pending} onClick={()=>void change()}
    className="min-h-11 sm:min-h-9">
    Confirm {archive?"delete":"restore"}</Button>
   <Button type="button" variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}
    className="ml-2 min-h-10">Cancel</Button>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
