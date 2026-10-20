"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useGuardedAction} from "@/hooks/use-guarded-action";
type Company={id:string;name:string;website:string|null;industry:string|null;
 about:string|null;logoPublicUrl:string|null;updatedAt:string};
export function SuperAdminCompanyEdit({company}:{company:Company}){
 const router=useRouter(),[open,setOpen]=useState(false),[error,setError]=useState("");
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
    setOpen(false);router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Cannot update company. Retry.");}
  });
 }
 if(!open)return <Button type="button" variant="secondary" className="mt-2 min-h-11 md:min-h-9 print:hidden"
  onClick={()=>setOpen(true)}>Edit global company</Button>;
 const cls="min-h-11 w-full md:min-h-9";
 return <form onSubmit={e=>void save(e)} className="mt-3 space-y-3 border-b border-border pb-5 print:hidden">
  <h3 className="font-semibold text-foreground">Edit company</h3>
  <label className="grid gap-1 text-[13px] font-semibold text-body">Name<Input required minLength={2} maxLength={150}
   name="name" defaultValue={company.name} className={cls}/></label>
  <label className="grid gap-1 text-[13px] font-semibold text-body">Website (HTTPS)<Input type="url" name="website"
   defaultValue={company.website??""} className={cls}/></label>
  <label className="grid gap-1 text-[13px] font-semibold text-body">Industry<Input name="industry" maxLength={160}
   defaultValue={company.industry??""} className={cls}/></label>
  <label className="grid gap-1 text-[13px] font-semibold text-body">About<Textarea name="about" maxLength={3000}
   defaultValue={company.about??""} rows={3} className={cls}/></label>
  <label className="grid gap-1 text-[13px] font-semibold text-body">Public logo URL (HTTPS)<Input name="logoPublicUrl"
   type="url" defaultValue={company.logoPublicUrl??""} className={cls}/></label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <Button type="submit" className="min-h-11 md:min-h-9" disabled={pending}>
   {pending?"Saving…":"Save company"}</Button>
  <Button type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}
   className="ml-2 min-h-11 md:min-h-9">Cancel</Button>
 </form>;
}
