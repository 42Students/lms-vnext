"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
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
 if(!open)return <button type="button" className="mt-2 min-h-10 rounded border border-border px-3 font-semibold text-primary-text"
  onClick={()=>setOpen(true)}>Edit global company</button>;
 const cls="min-h-10 w-full rounded border border-border bg-surface p-2";
 return <form onSubmit={e=>void save(e)} className="mt-3 space-y-3 rounded border border-border p-3">
  <h3 className="font-semibold">Edit company</h3>
  <label className="grid gap-1 text-sm">Name<input required minLength={2} maxLength={150}
   name="name" defaultValue={company.name} className={cls}/></label>
  <label className="grid gap-1 text-sm">Website (HTTPS)<input type="url" name="website"
   defaultValue={company.website??""} className={cls}/></label>
  <label className="grid gap-1 text-sm">Industry<input name="industry" maxLength={160}
   defaultValue={company.industry??""} className={cls}/></label>
  <label className="grid gap-1 text-sm">About<textarea name="about" maxLength={3000}
   defaultValue={company.about??""} rows={3} className={cls}/></label>
  <label className="grid gap-1 text-sm">Public logo URL (HTTPS)<input name="logoPublicUrl"
   type="url" defaultValue={company.logoPublicUrl??""} className={cls}/></label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <button type="submit" disabled={pending} className="min-h-10 rounded bg-primary px-4 text-on-primary disabled:opacity-50">
   {pending?"Saving…":"Save company"}</button>
  <button type="button" disabled={pending} onClick={()=>setOpen(false)}
   className="ml-2 min-h-10 rounded border border-border px-4">Cancel</button>
 </form>;
}
