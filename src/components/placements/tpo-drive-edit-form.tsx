"use client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {tpoDriveFormErrorMessage} from "@/modules/placements/tpo-drive-form-error-copy";
type Draft={id:string;title:string;description:string;updatedAt:string;status:string;
 applicantCount:number;applicationDeadline:string|null;minCgpaHundredths:number|null;
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
  let deadline:string|null;
  try{
   const raw=String(fields.get("applicationDeadline")??"").trim();
   deadline=raw?driveDeadlineIstToIso(raw):null;
  }catch{setError("Enter a valid application deadline in IST.");return;}
  const cgpa=optionalNumber(fields.get("minCgpa"));
  if(cgpa!==null&&(!Number.isFinite(cgpa)||cgpa<0||cgpa>10)){
   setError("Enter a CGPA from 0 to 10.");return;
  }
  setProposal({
   confirmed:true,expectedUpdatedAt:job.updatedAt,
   applicationDeadline:deadline,minCgpaHundredths:cgpa===null?null:Math.round(cgpa*100),
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
 async function save(notifyApplicants=false){
  if(!proposal||pending)return;
  try{
   await run(async()=>{
    await apiFetch("/api/placements/tpo/jobs/"+encodeURIComponent(job.id)+"/edit",{
     method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify({...proposal,notifyApplicants}),
    });
    setConfirmOpen(false);
    router.push("/tpo/placements/jobs/"+encodeURIComponent(job.id));router.refresh();
   });
  }catch(reason){
   setError(tpoDriveFormErrorMessage(reason));
   setConfirmOpen(false);
  }
 }
 const cls="mt-2 min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-foreground";
 return <><form onSubmit={submit} className="space-y-4 border-b border-border pb-5">
  <label className="block text-sm font-semibold text-body">Title<Input required name="title" defaultValue={job.title} minLength={2} maxLength={200} className={cls}/></label>
  <label className="block text-sm font-semibold text-body">Description<Textarea required name="description" defaultValue={job.description} maxLength={20000} rows={5} className={cls}/></label>
  <label className="block text-sm font-semibold text-body">Locations (comma-separated)<Input name="locations" defaultValue={job.locations.join(", ")} className={cls}/></label>
  <div className="grid gap-4 sm:grid-cols-3">
   <label className="block text-sm font-semibold text-body">Openings<Input type="number" min={1} max={100000} name="openings" defaultValue={job.openings??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Minimum annual CTC (INR)<Input type="number" min={0} max={100000000} name="minimumAnnualCtcInr" defaultValue={job.minimumAnnualCtcInr??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Maximum annual CTC (INR)<Input type="number" min={0} max={100000000} name="maximumAnnualCtcInr" defaultValue={job.maximumAnnualCtcInr??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Fixed CTC (LPA)
    <Input name="fixedCtcLpa" type="number" min={0} max={1000} step="0.01" defaultValue={job.fixedCtcLpa??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Variable CTC (LPA)
    <Input name="variableCtcLpa" type="number" min={0} max={1000} step="0.01" defaultValue={job.variableCtcLpa??""} className={cls}/></label>
   <label className="block text-sm font-semibold text-body">Stipend per month (INR)
    <Input name="stipendPerMonthInr" type="number" min={0} max={10000000} step={1}
      defaultValue={job.stipendPerMonthInr??""} className={cls}/></label>
  </div>
  <label className="flex items-center gap-3 text-sm font-semibold text-body">
    <input type="checkbox" name="isDream" defaultChecked={job.isDream} className="h-4 w-4 accent-primary"/>
    Dream drive — held-offer limit exception
  </label>
  <div className="grid gap-4 sm:grid-cols-2">
   <label className="block text-sm font-semibold text-body">Application deadline (IST)
    <Input name="applicationDeadline" type="datetime-local"
      defaultValue={job.applicationDeadline?new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(job.applicationDeadline)).replace(" ","T"):""}
      className={cls}/>
   </label>
   <label className="block text-sm font-semibold text-body">Minimum CGPA for eligibility
    <Input name="minCgpa" type="number" min={0} max={10} step="0.01"
      defaultValue={job.minCgpaHundredths===null?"":job.minCgpaHundredths/100} className={cls}/>
   </label>
  </div>
    <label className="block text-sm font-semibold text-body">Reason for edit (audited)<Textarea required name="reason" minLength={10} maxLength={1000} rows={2} className={cls}/></label>
  <p className="text-xs text-body">Active-season draft and live drives can be edited. Live changes are audited; choose whether to notify existing applicants. A changed version must be refreshed before another save.</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <Button variant="primary" type="submit" disabled={pending} className="min-h-11 md:min-h-9 px-5">{pending?"Saving…":"Save changes"}</Button>
  <Link className="ml-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline"
   href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)}>Open drive page</Link>
 </form>
 {job.status==="PUBLISHED"?
  <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Save changes to a live drive?"
   description={"Choose whether to notify "+job.applicantCount+" existing applicants. Both choices audit the change."}
   dismissible={!pending}
   footer={<div className="flex flex-wrap gap-2">
    <Button variant="secondary" disabled={pending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
    <Button variant="secondary" disabled={pending} onClick={()=>void save(false)}>Save without telling anyone</Button>
    <Button disabled={pending} onClick={()=>void save(true)}>Save and notify {job.applicantCount} applicants</Button>
   </div>}>
   <p className="text-sm text-body">Changes to dates, compensation or eligibility may affect an applicant&apos;s next action.</p>
  </Dialog>:
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
   title="Save changes to this draft drive?"
   description="These changes are audited and will update this saved draft. Confirm only after checking the employer details."
   confirmVariant="primary" confirmLabel="Save changes" pending={pending} onConfirm={()=>void save(false)}/>}
 </>;
}
