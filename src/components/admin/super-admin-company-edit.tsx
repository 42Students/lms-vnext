"use client";
import {useId,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";
type Company={id:string;name:string;website:string|null;industry:string|null;
 about:string|null;logoPublicUrl:string|null;updatedAt:string};
export function SuperAdminCompanyEdit({company}:{company:Company}){
 const router=useRouter(),{showToast}=useToast(),[open,setOpen]=useState(false),[error,setError]=useState("");
 const formId=useId(),[dirty,setDirty]=useState(false);
 const {askConfirm,dialog}=useConfirmFlow();
 function requestClose(){
  if(pending)return;
  if(!dirty){setOpen(false);return;}
  void askConfirm("Discard company changes? Keep editing to preserve your unsaved changes.")
   .then(confirmed=>{if(confirmed){setOpen(false);setDirty(false);}});
 }
 const {pending,run}=useGuardedAction();
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const values=new FormData(event.currentTarget);
  await run(async()=>{
   setError("");
   try{
    await apiFetch("/api/admin/companies/edit",{method:"PATCH",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({
      companyId:company.id,expectedUpdatedAt:company.updatedAt,
      name:String(values.get("name")??"").trim(),website:String(values.get("website")??"").trim(),
      industry:String(values.get("industry")??"").trim()||null,
      about:String(values.get("about")??"").trim()||null,
      logoPublicUrl:String(values.get("logoPublicUrl")??"").trim(),
     }),
    });
    setOpen(false);setDirty(false);
    showToast({tone:"success",title:"Saved. Every drive of this company shows the new name and logo."});
    router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Cannot update company. Retry.");}
  });
 }
 const cls="min-h-11 w-full md:min-h-9";
 return <>
  {dialog}
  <Button type="button" variant="secondary" className="mt-2 min-h-11 md:min-h-9 print:hidden"
   aria-label={"Edit company "+company.name}
   onClick={()=>{setDirty(false);setError("");setOpen(true);}}>Edit global company</Button>
  <Dialog open={open} onOpenChange={next=>next?setOpen(true):requestClose()}
   dismissible={!pending} className="max-w-[600px]" title={"Edit "+company.name}
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="secondary" disabled={pending} onClick={requestClose}>Cancel</Button>
    <Button type="submit" form={formId} loading={pending} disabled={pending}>
     {pending?"Saving…":"Save company"}
    </Button>
   </div>}>
   <form id={formId} onChange={()=>setDirty(true)} onSubmit={e=>void save(e)} className="space-y-3 print:hidden">
    {dirty?<p role="status" className="text-xs text-warning-text">You have unsaved company changes.</p>:null}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name
     <Input required minLength={2} maxLength={150} name="name" defaultValue={company.name} className={cls}/>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Website
     <Input type="url" name="website" placeholder="https://" defaultValue={company.website??""} className={cls}/>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Logo link
     <Input type="url" name="logoPublicUrl" placeholder="https://" defaultValue={company.logoPublicUrl??""} className={cls}/>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Industry
     <Input name="industry" maxLength={100} defaultValue={company.industry??""} className={cls}/>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">About
     <Textarea name="about" maxLength={2000} defaultValue={company.about??""} rows={3} className={cls}/>
    </label>
    <p className="text-xs text-muted-foreground">Global company edits update the canonical employer across linked college drives. Industry has a 100-character limit; About has a 2000-character limit.</p>
    {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
   </form>
  </Dialog>
 </>;
}
