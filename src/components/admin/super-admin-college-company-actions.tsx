"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Disclosure} from "@/components/ui/disclosure";
import {useToast} from "@/components/ui/toast";
export function SuperAdminCollegeCompanyCreate({collegeId}:{collegeId:string}){
 const router=useRouter(),[open,setOpen]=useState(false),[error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 const {showToast}=useToast();
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const values=new FormData(event.currentTarget);
  const name=String(values.get("name")??"").trim();
  const websiteUrl=String(values.get("websiteUrl")??"").trim();
  const primaryDomain=String(values.get("primaryDomain")??"").trim();
  setError("");
  if(!name){setError("Company name is required");return;}
  if(name.length<2||name.length>150){
   setError("Company name must be between 2 and 150 characters");return;
  }
  if(websiteUrl){
   try{
    const url=new URL(websiteUrl);
    if(url.protocol!=="https:"||url.username||url.password){
     setError("Company website must be a valid https link");return;
    }
   }catch{setError("Must be a valid URL");return;}
  }
  if(!primaryDomain&&!websiteUrl){
   setError("Add the company's website or a company email domain");return;
  }
  await run(async()=>{setError("");
   try{
    await apiFetch("/api/placements/companies",{method:"POST",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({collegeId,name,
      websiteUrl:websiteUrl||undefined,primaryDomain:primaryDomain||undefined}),
    });
    setOpen(false);showToast({tone:"success",title:"Company created"});router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Could not create company. Retry.");}
  });
 }
 return <section className="min-w-0 border-b border-border pb-5">
  <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
   <h2 className="text-base font-semibold text-foreground">This college&apos;s companies</h2>
   {!open?<Button type="button" onClick={()=>{setError("");setOpen(true);}}
    className="min-h-11 w-full sm:w-auto md:min-h-9 print:hidden">Add company</Button>:null}
  </div>
  {open?
   <form noValidate onSubmit={e=>void submit(e)} className="mt-3 grid min-w-0 gap-3 border-t border-border pt-3 md:grid-cols-2 print:hidden">
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company name<Input name="name" required minLength={2}
     maxLength={150} className="min-h-11 w-full md:min-h-9"/></label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company domain<Input name="primaryDomain" maxLength={255}
     placeholder="example.com" className="min-h-11 w-full md:min-h-9"/></label>
    <label className="grid gap-[6px] md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Website (HTTPS)
     <Input name="websiteUrl" type="url" maxLength={500} placeholder="https://..." className="min-h-11 w-full md:min-h-9"/>
     <span className="text-xs font-normal text-muted-foreground">One company identity per verified domain. Use an HTTPS website or enter the company domain above.</span>
    </label>
    {error?<Alert tone="error" className="md:col-span-2">{error}</Alert>:null}
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center md:col-span-2">
     <Button type="submit" loading={pending} disabled={pending} className="min-h-11 w-full sm:w-auto md:min-h-9">
      {pending?"Saving…":"Create company"}</Button>
     <Button type="button" variant="secondary" disabled={pending} onClick={()=>{setOpen(false);setError("");}}
      className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel</Button>
    </div>
   </form>:null}
 </section>;
}
export function SuperAdminCollegeCompanyRelationshipActions({relationshipId,name,trusted,status,driveCount,companyStatus}:{
 relationshipId:string;name:string;trusted:boolean;status:string;driveCount:number;companyStatus:string;
}){
 const router=useRouter(),[confirm,setConfirm]=useState(false),[error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 const {showToast}=useToast();
 async function trust(){
  await run(async()=>{setError("");
   try{await apiFetch("/api/placements/companies/"+encodeURIComponent(relationshipId),{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({isTrusted:!trusted}),
   });showToast({tone:"success",title:"Company updated"});router.refresh();}
   catch(e){setError(e instanceof Error?e.message:"Could not change college trust.");}
  });
 }
 async function change(){
  await run(async()=>{setError("");
   try{await apiFetch("/api/admin/companies/relationships",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({relationshipId,
     action:status==="ACTIVE"?"ARCHIVE":"RESTORE",confirmed:true}),
   });setConfirm(false);
   showToast({tone:"success",title:archive?"Company deleted":"Company restored",
    description:archive?"Removed from this college; the global company record is retained.":undefined});
   router.refresh();}
   catch(e){setError(e instanceof Error?e.message:"Could not update company. Retry.");}
  });
 }
 const archive=status==="ACTIVE";
 return <Disclosure title="Manage company relationship" className="mt-2 print:hidden" contentClassName="space-y-2 pt-2">
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
   {archive?<Button type="button" variant="secondary" disabled={pending} onClick={()=>void trust()}
    className="min-h-11 w-full sm:w-auto md:min-h-9">
    {trusted?"Mark not trusted":"Mark trusted"}</Button>:null}
   <Button type="button" variant={archive?"danger":"secondary"} disabled={pending||(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
    title={archive&&driveCount>0?"Cannot delete a company with drives":undefined}
    onClick={()=>{setError("");setConfirm(true);}}
    className="min-h-11 w-full sm:w-auto md:min-h-9">
    {archive?"Delete company":"Restore company"}</Button>
  </div>
  {archive&&driveCount>0?<p className="text-xs leading-5 text-muted-foreground">Cannot delete a company with drives</p>:null}
  <ConfirmDialog open={confirm} onOpenChange={next=>{if(!pending)setConfirm(next);}}
   title={(archive?"Delete ":"Restore ")+name+" for this college?"}
   description="The global company record will be kept."
   confirmLabel={archive?"Confirm delete":"Confirm restore"}
   confirmVariant={archive?"danger":"primary"} pending={pending}
   confirmDisabled={(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
   onConfirm={()=>void change()}>
   {error?<Alert tone="error">{error}</Alert>:null}
  </ConfirmDialog>
  {error?<Alert tone="error">{error}</Alert>:null}
 </Disclosure>;
}
