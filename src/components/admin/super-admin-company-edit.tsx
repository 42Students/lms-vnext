"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";
type Company={id:string;name:string;website:string|null;industry:string|null;
 about:string|null;logoPublicUrl:string|null;updatedAt:string};
export function SuperAdminCompanyEdit({company}:{company:Company}){
 const router=useRouter(),{showToast}=useToast(),[open,setOpen]=useState(false),[error,setError]=useState("");
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
    setOpen(false);
    showToast({tone:"success",title:"Saved. Every drive of this company shows the new name and logo."});
    router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Cannot update company. Retry.");}
  });
 }
 if(!open)return <Button type="button" variant="secondary" className="mt-2 min-h-11 md:min-h-9 print:hidden"
  onClick={()=>setOpen(true)}>Edit global company</Button>;
 const cls="min-h-11 w-full md:min-h-9";
 return <form onSubmit={e=>void save(e)} className="mt-3 space-y-3 border-b border-border pb-5 print:hidden">
  <h3 className="font-semibold text-[var(--lms-heading)]">Edit company</h3>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name<Input required minLength={2} maxLength={150}
   name="name" defaultValue={company.name} className={cls}/></label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Website (HTTPS)<Input type="url" name="website"
   defaultValue={company.website??""} className={cls}/></label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Industry<Input name="industry" maxLength={100}
   defaultValue={company.industry??""} className={cls}/></label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">About<Textarea name="about" maxLength={2000}
   defaultValue={company.about??""} rows={3} className={cls}/></label>
  <p className="m-0 text-xs text-muted-foreground">Legacy limits: industry 100 characters, description 2000 characters. Shared company edits update the canonical employer across its linked college drives.</p>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Public logo URL (HTTPS)<Input name="logoPublicUrl"
   type="url" defaultValue={company.logoPublicUrl??""} className={cls}/></label>
  {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
  <Button type="submit" className="min-h-11 md:min-h-9" loading={pending} disabled={pending}>
   {pending?"Saving…":"Save company"}</Button>
  <Button type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}
   className="ml-2 min-h-11 md:min-h-9">Cancel</Button>
 </form>;
}
