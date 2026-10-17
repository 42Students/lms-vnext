"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {tpoDriveFormErrorMessage} from "@/modules/placements/tpo-drive-form-error-copy";
type Draft={id:string;title:string;description:string;updatedAt:string;
 locations:string[];openings:number|null;minimumAnnualCtcInr:number|null;maximumAnnualCtcInr:number|null;
 fixedCtcLpa:string|null;variableCtcLpa:string|null;stipendPerMonthInr:number|null;isDream:boolean};
function optionalNumber(v:FormDataEntryValue|null){const s=String(v??"").trim();return s===""?null:Number(s);}
export function TpoDriveEditForm({job}:{job:Draft}){
 const router=useRouter();
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const [error,setError]=useState<string|null>(null);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [proposal,setProposal]=useState<Record<string,unknown>|null>(null);
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const fields=new FormData(event.currentTarget);
  setError(null);
  const amounts=["openings","minimumAnnualCtcInr","maximumAnnualCtcInr",
    "fixedCtcLpa","variableCtcLpa","stipendPerMonthInr"] as const;
  for(const key of amounts){
   const value=optionalNumber(fields.get(key));
   if(value!==null&&!Number.isFinite(value)){
    setError("Enter a valid numeric value for "+key+".");return;
   }
  }
  const minimum=optionalNumber(fields.get("minimumAnnualCtcInr"));
  const maximum=optionalNumber(fields.get("maximumAnnualCtcInr"));
  if(minimum!==null&&maximum!==null&&maximum<minimum){
   setError("Maximum CTC must be greater than or equal to minimum CTC.");return;
  }
  const reason=String(fields.get("reason")??"").trim();
  if(reason.length<10){setError("Explain the edit in at least 10 characters.");return;}
  setProposal({
   confirmed:true,expectedUpdatedAt:job.updatedAt,
   reason,title:String(fields.get("title")??""),
   description:String(fields.get("description")??""),
   locations:String(fields.get("locations")??"").split(",").map(x=>x.trim()).filter(Boolean),
   openings:optionalNumber(fields.get("openings")),
   minimumAnnualCtcInr:minimum,maximumAnnualCtcInr:maximum,
   fixedCtcLpa:optionalNumber(fields.get("fixedCtcLpa")),
   variableCtcLpa:optionalNumber(fields.get("variableCtcLpa")),
   stipendPerMonthInr:optionalNumber(fields.get("stipendPerMonthInr")),
   isDream:fields.get("isDream")==="on",
  });
  setConfirmOpen(true);
 }
 async function save(){
  if(!proposal||pending)return;
  try{
   await run(async()=>{
    await apiFetch("/api/placements/tpo/jobs/"+encodeURIComponent(job.id)+"/edit",{
     method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify(proposal),
    });
    setConfirmOpen(false);
    router.push("/tpo/placements/jobs/"+encodeURIComponent(job.id));router.refresh();
   });
  }catch(reason){
   setError(tpoDriveFormErrorMessage(reason));
   setConfirmOpen(false);
  }
 }
 const cls="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground";
 return <><form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
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
  <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">{pending?"Saving…":"Save changes"}</button>
  <Link className="ml-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline"
   href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)}>Open drive page</Link>
 </form>
 <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
  title="Save changes to this draft drive?"
  description="These changes are audited and will update this saved draft. Confirm only after checking the employer details."
  confirmVariant="primary" confirmLabel="Save changes" pending={pending} onConfirm={()=>void save()}/>
 </>;
}
