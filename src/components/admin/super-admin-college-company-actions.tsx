"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
   className="mt-2 min-h-11 md:min-h-9 print:hidden">
   Add company</Button>:
   <form onSubmit={e=>void submit(e)} className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 print:hidden">
    <label className="grid gap-1 text-sm">Company name<Input name="name" required minLength={2}
     maxLength={200} className="min-h-11 w-full md:min-h-9"/></label>
    <label className="grid gap-1 text-sm">Company domain<Input name="primaryDomain" maxLength={255}
     placeholder="example.com" className="min-h-11 w-full md:min-h-9"/></label>
    <label className="grid gap-1 text-sm md:col-span-2">Website (HTTPS preferred)
     <Input name="websiteUrl" type="url" className="min-h-11 w-full md:min-h-9"/></label>
    {error?<Alert tone="error" className="md:col-span-2">{error}</Alert>:null}
    <div className="flex flex-wrap gap-3 md:col-span-2">
     <Button type="submit" loading={pending} disabled={pending} className="min-h-11 md:min-h-9">
      {pending?"Saving…":"Create company"}</Button>
     <Button type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}
      className="min-h-11 md:min-h-9">Cancel</Button>
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
 return <div className="mt-2 space-y-2 text-sm print:hidden">
  <div className="flex flex-wrap gap-2">
   {archive?<Button type="button" variant="secondary" disabled={pending} onClick={()=>void trust()}
    className="min-h-11 md:min-h-9">
    {trusted?"Mark not trusted":"Mark trusted"}</Button>:null}
   <Button type="button" variant={archive?"danger":"secondary"} disabled={pending||(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
    title={archive&&driveCount>0?"Cannot delete a company with drives":undefined}
    onClick={()=>setConfirm(true)}
    className="min-h-11 md:min-h-9">
    {archive?"Delete company":"Restore company"}</Button>
  </div>
  <ConfirmDialog open={confirm} onOpenChange={setConfirm}
   title={(archive?"Delete ":"Restore ")+name+" for this college?"}
   description="The global company record will be kept."
   confirmLabel={archive?"Confirm delete":"Confirm restore"}
   confirmVariant={archive?"danger":"primary"} pending={pending}
   confirmDisabled={(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
   onConfirm={()=>void change()}/>
  {error?<Alert tone="error">{error}</Alert>:null}
 </div>;
}
