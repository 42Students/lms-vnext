"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
type Draft={id:string;title:string;description:string;updatedAt:string;
 locations:string[];openings:number|null;minimumAnnualCtcInr:number|null;maximumAnnualCtcInr:number|null;
 fixedCtcLpa:string|null;variableCtcLpa:string|null;stipendPerMonthInr:number|null;isDream:boolean};
function optionalNumber(v:FormDataEntryValue|null){const s=String(v??"").trim();return s===""?null:Number(s);}
export function TpoDriveEditForm({job}:{job:Draft}){
 const router=useRouter();const [pending,setPending]=useState(false);const [error,setError]=useState<string|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const fields=new FormData(event.currentTarget);
  if(!window.confirm("Save the draft changes with an immutable TPO audit event?"))return;
  setPending(true);setError(null);
  try{
   const response=await fetch("/api/placements/tpo/jobs/"+job.id+"/edit",{
    method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true,expectedUpdatedAt:job.updatedAt,
     reason:String(fields.get("reason")??""),title:String(fields.get("title")??""),
     description:String(fields.get("description")??""),
     locations:String(fields.get("locations")??"").split(",").map(x=>x.trim()).filter(Boolean),
     openings:optionalNumber(fields.get("openings")),
     minimumAnnualCtcInr:optionalNumber(fields.get("minimumAnnualCtcInr")),
     maximumAnnualCtcInr:optionalNumber(fields.get("maximumAnnualCtcInr")),
     fixedCtcLpa:optionalNumber(fields.get("fixedCtcLpa")),
     variableCtcLpa:optionalNumber(fields.get("variableCtcLpa")),
     stipendPerMonthInr:optionalNumber(fields.get("stipendPerMonthInr")),
     isDream:fields.get("isDream")==="on",
    }),
   });
   if(!response.ok){const result=await response.json().catch(()=>null) as {error?:string}|null;
    throw Error(result?.error??"Draft changed; refresh before retrying.");}
   router.push("/tpo/placements/jobs/"+job.id);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Draft edit failed");}finally{setPending(false);}
 }
 const cls="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground";
 return <form onSubmit={e=>void submit(e)} className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <label className="block text-sm font-semibold text-body">Title<input required name="title" defaultValue={job.title} minLength={2} maxLength={200} className={cls}/></label>
  <label className="block text-sm font-semibold text-body">Description<textarea required name="description" defaultValue={job.description} maxLength={20000} rows={5} className={cls}/></label>
  <label className="block text-sm font-semibold text-body">Locations (comma-separated)<input name="locations" defaultValue={job.locations.join(", ")} className={cls}/></label>
  <div className="grid gap-4 sm:grid-cols-3">
   <label className="block text-sm font-semibold text-body">Openings<input type="number" min={1} max={100000} name="openings" defaultValue={job.openings??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Minimum annual CTC (INR)<input type="number" min={0} max={100000000} name="minimumAnnualCtcInr" defaultValue={job.minimumAnnualCtcInr??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Maximum annual CTC (INR)<input type="number" min={0} max={100000000} name="maximumAnnualCtcInr" defaultValue={job.maximumAnnualCtcInr??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Fixed CTC (LPA)
    <input name="fixedCtcLpa" type="number" min={0} max={1000} step="0.01" defaultValue={job.fixedCtcLpa??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Variable CTC (LPA)
    <input name="variableCtcLpa" type="number" min={0} max={1000} step="0.01" defaultValue={job.variableCtcLpa??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Stipend per month (INR)
    <input name="stipendPerMonthInr" type="number" min={0} max={10000000} step={1}
      defaultValue={job.stipendPerMonthInr??""} className={cls}/></label>
  </div>
  <label className="flex items-center gap-3 text-sm font-semibold text-body">
    <input type="checkbox" name="isDream" defaultChecked={job.isDream} className="h-4 w-4 accent-primary"/>
    Dream drive — held-offer limit exception
  </label>
  <label className="block text-sm font-semibold text-body">Reason for edit (audited)<textarea required name="reason" minLength={10} maxLength={1000} rows={2} className={cls}/></label>
  <p className="text-xs text-body">Only active-season draft drives can be edited. A changed version must be refreshed before another save.</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">{pending?"Saving…":"Review and save draft"}</button>
 </form>;
}
