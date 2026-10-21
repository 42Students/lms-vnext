"use client";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {useState,type FormEvent} from "react";
import {useUnsavedDriveGuard} from "./use-unsaved-drive-guard";
import {useToast} from "@/components/ui/toast";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Button} from "@/components/ui/button";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {tpoDriveFormErrorMessage} from "@/modules/placements/tpo-drive-form-error-copy";
type Draft={id:string;title:string;description:string;updatedAt:string;status:string;
 applicantCount:number;applicationDeadline:string|null;minCgpaHundredths:number|null;
 locations:string[];openings:number|null;minimumAnnualCtcInr:number|null;maximumAnnualCtcInr:number|null;
 fixedCtcLpa:string|null;variableCtcLpa:string|null;stipendPerMonthInr:number|null;isDream:boolean;
 allowedCohortIds:string[];availableBatches:Array<{id:string;name:string;code:string;status:string;program:string}>;
 roleOptions:Array<{id:string;title:string}>;
 employmentType:string;
 workMode:string;recruiterDriveMode:string;
 jobTypeLabel:string|null;
 verifiedMarksOnly:boolean;
 minTenthPctBasisPoints:number|null;minTwelfthPctBasisPoints:number|null;
 minDiplomaPctBasisPoints:number|null;minUndergraduatePctBasisPoints:number|null;
 minPostgraduatePctBasisPoints:number|null;
 allowedPassingYears:number[];allowedProgramIds:string[];};
function optionalNumber(v:FormDataEntryValue|null){const s=String(v??"").trim();return s===""?null:Number(s);}
export function TpoDriveEditForm({job}:{job:Draft}){
 const router=useRouter();
 const {pending,run}=useGuardedAction({timeoutMs:30000});
 const {dirty,markDirty,clearDirty,guardDialog}=useUnsavedDriveGuard();
 const {showToast}=useToast();
 const [version,setVersion]=useState(job.updatedAt);
 const [saved,setSaved]=useState<{at:string;notified:number}|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [proposal,setProposal]=useState<Record<string,unknown>|null>(null);
 const [reviewTitle,setReviewTitle]=useState(job.title);
 const [reviewDeadline,setReviewDeadline]=useState(job.applicationDeadline??"");
 const completeChecklist=Number(reviewTitle.trim().length>=3)
  +Number(job.roleOptions.length>0)
  +Number(Boolean(reviewDeadline));
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;
  const fields=new FormData(event.currentTarget);
  setError(null);
  setSaved(null);
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
  const fixed=optionalNumber(fields.get("fixedCtcLpa"));
  const variable=optionalNumber(fields.get("variableCtcLpa"));
  if(maximum!==null&&((fixed??0)+(variable??0))*100000>maximum){
   setError("Fixed and variable pay cannot exceed the maximum annual CTC.");return;
  }
  const title=String(fields.get("title")??"").trim();
  const description=String(fields.get("description")??"").trim();
  if(title.length<3||title.length>100){
   setError("Job title must be between 3 and 100 characters");return;
  }
  if(!description||description.length>20000){
   setError("Description is required and must be 20,000 characters or fewer.");return;
  }
  const locations=String(fields.get("locations")??"").split(",").map(x=>x.trim()).filter(Boolean);
  if(locations.length>20||locations.some(x=>x.length>120)||
   new Set(locations.map(x=>x.toLowerCase())).size!==locations.length){
   setError("Enter no more than 20 distinct locations, each at most 120 characters.");return;
  }
  const reason=String(fields.get("reason")??"").trim();
  if(reason.length<10){setError("Explain the edit in at least 10 characters.");return;}
  let deadline:string|null;
  try{
   const raw=String(fields.get("applicationDeadline")??"").trim();
   deadline=raw?driveDeadlineIstToIso(raw):null;
  }catch{setError("Enter a valid application deadline in IST.");return;}
  if(job.status==="PUBLISHED"&&deadline===null){
   setError("A published drive requires an application deadline.");return;
  }
  const cgpa=optionalNumber(fields.get("minCgpa"));
  if(cgpa!==null&&(!Number.isFinite(cgpa)||cgpa<0||cgpa>10)){
   setError("Enter a CGPA from 0 to 10.");return;
  }
  const percentageKeys=[
   "minTenthPctBasisPoints","minTwelfthPctBasisPoints",
   "minDiplomaPctBasisPoints","minUndergraduatePctBasisPoints",
   "minPostgraduatePctBasisPoints",
  ] as const;
  const marks:Record<(typeof percentageKeys)[number],number|null>={
   minTenthPctBasisPoints:null,minTwelfthPctBasisPoints:null,
   minDiplomaPctBasisPoints:null,minUndergraduatePctBasisPoints:null,
   minPostgraduatePctBasisPoints:null,
  };
  for(const key of percentageKeys){
   const value=optionalNumber(fields.get(key));
   if(value!==null&&(!Number.isFinite(value)||value<0||value>100||
      Math.abs(Math.round(value*100)-value*100)>0.00001)){
    setError("Enter a percentage from 0 to 100 with at most two decimal places.");return;
   }
   marks[key]=value===null?null:Math.round(value*100);
  }
  const yearsRaw=String(fields.get("allowedPassingYears")??"").trim();
  const years=yearsRaw?yearsRaw.split(",").map(value=>Number(value.trim())):[];
  if(years.length>101||years.some(year=>!Number.isInteger(year)||year<2000||year>2100)||
    new Set(years).size!==years.length){
   setError("Enter distinct passing years between 2000 and 2100, separated by commas.");return;
  }
  const jobTypeLabel=String(fields.get("jobTypeLabel")??"").trim();
  if(jobTypeLabel.length>40){setError("Job type label must be at most 40 characters.");return;}
  setProposal({
   confirmed:true,expectedUpdatedAt:version,
   applicationDeadline:deadline,minCgpaHundredths:cgpa===null?null:Math.round(cgpa*100),
   ...(job.availableBatches.length?{allowedCohortIds:fields.getAll("allowedCohortIds").map(String)}:{}),
   allowedPassingYears:years,...marks,
   verifiedMarksOnly:fields.get("verifiedMarksOnly")==="on",
   jobTypeLabel:jobTypeLabel||null,
   employmentType:String(fields.get("employmentType")??job.employmentType),
   workMode:String(fields.get("workMode")??job.workMode),
   recruiterDriveMode:String(fields.get("recruiterDriveMode")??job.recruiterDriveMode),
   reason,title,description,locations,
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
    const result=await apiFetch<{id:string;status:string;updatedAt:string;notified:number}>(
     "/api/placements/tpo/jobs/"+encodeURIComponent(job.id)+"/edit",{
      method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
      body:JSON.stringify({...proposal,notifyApplicants}),
     });
    if(result.id!==job.id||!Number.isFinite(new Date(result.updatedAt).getTime()))
     throw new Error("The save response could not be verified. Check the drive before trying again.");
    setVersion(result.updatedAt);
    setSaved({at:result.updatedAt,notified:result.notified});
    setProposal(null);
    setError(null);
    setConfirmOpen(false);
    clearDirty();
    showToast({tone:"success",title:job.status==="DRAFT"?
     "Draft changes saved":"Drive changes saved",
     description:result.notified>0?
      result.notified+" applicants were notified in-app.":"Changes were audited and saved."});
    router.refresh();
   });
  }catch(reason){
   setError(tpoDriveFormErrorMessage(reason));
   setConfirmOpen(false);
  }
 }
 const cls="mt-2 min-h-11 w-full min-w-0 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] py-[7px] text-[var(--lms-form-ink)] md:min-h-9";
 return <>
 <header className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-[var(--lms-canvas-border)] pb-4">
  <div className="min-w-0">
   <p className="text-xs font-bold uppercase tracking-wide text-[var(--lms-neutral-400)]">Drive setup</p>
   <h2 className="mt-1 text-lg font-semibold text-[var(--lms-heading)]">{job.status==="PUBLISHED"?"Update the live opportunity carefully":"Build the opportunity students will see"}</h2>
   <p className="mt-1 text-sm text-body">Move from company and role details into pay, eligibility and rounds. The review rail stays visible while you work.</p>
  </div>
  <div className="min-w-20 text-right" role="status" aria-label="Setup progress">
   <strong className="block text-2xl font-bold tabular-nums text-[var(--lms-heading)]">{completeChecklist}/4</strong>
   <span className="text-xs text-muted-foreground">steps ready · rounds reviewed separately</span>
  </div>
 </header>
 <div className="grid min-w-0 items-start gap-[18px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
 <form onSubmit={submit} onChange={event=>{
  markDirty();setSaved(null);
  const field=event.target as HTMLInputElement;
  if(field.name==="title")setReviewTitle(field.value);
  if(field.name==="applicationDeadline")setReviewDeadline(field.value);
 }} className="min-w-0 space-y-4 border-b border-border pb-5 [overflow-wrap:anywhere]">
  <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Role<Input required name="title" defaultValue={job.title} minLength={3} maxLength={100} placeholder="e.g. Systems Engineer" className={cls}/></label>
  <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Description<Textarea required name="description" defaultValue={job.description} maxLength={20000} rows={3} className={cls}/></label>
  <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Location (comma-separated)<Input name="locations" defaultValue={job.locations.join(", ")} className={cls}/></label>
  <section aria-label="Drive job details" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)]">
   <h2 className="mb-3 font-semibold text-foreground">The drive</h2>
   <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">Job type
     <Select name="employmentType" defaultValue={job.employmentType} className={cls}>
      <option value="FULL_TIME">Full-time</option><option value="INTERNSHIP">Internship</option>
      <option value="CONTRACT">Contract</option>
     </Select>
    </label>
    <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">Work mode
     <Select name="workMode" defaultValue={job.workMode} className={cls}>
      <option value="ONSITE">Onsite</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option>
     </Select>
    </label>
    <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">Mode
     <Select name="recruiterDriveMode" defaultValue={job.recruiterDriveMode} className={cls}>
      <option value="ON_CAMPUS">On campus</option><option value="OFF_CAMPUS">Off campus (company&apos;s site)</option>
     </Select>
    </label>
    <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)] sm:col-span-2 xl:col-span-3">College job type label (optional)
     <Input name="jobTypeLabel" maxLength={40} defaultValue={job.jobTypeLabel??""}
      placeholder="e.g. Full-time, Internship" className={cls}/>
    </label>
   </div>
  </section>
  <details className="group min-w-0 border-y border-border py-3">
   <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--lms-heading)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
    Compensation and openings <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
   </summary>
   <div className="grid min-w-0 gap-4 pt-3 sm:grid-cols-2 xl:grid-cols-3">
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Openings<Input type="number" min={1} max={100000} name="openings" defaultValue={job.openings??""} className={cls}/></label>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Minimum annual CTC (INR)<Input type="number" min={0} max={100000000} name="minimumAnnualCtcInr" defaultValue={job.minimumAnnualCtcInr??""} className={cls}/></label>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Maximum annual CTC (INR)<Input type="number" min={0} max={100000000} name="maximumAnnualCtcInr" defaultValue={job.maximumAnnualCtcInr??""} className={cls}/></label>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Fixed CTC (LPA)
    <Input name="fixedCtcLpa" type="number" min={0} max={1000} step="0.01" defaultValue={job.fixedCtcLpa??""} className={cls}/></label>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Variable CTC (LPA)
    <Input name="variableCtcLpa" type="number" min={0} max={1000} step="0.01" defaultValue={job.variableCtcLpa??""} className={cls}/></label>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Stipend per month (INR)
    <Input name="stipendPerMonthInr" type="number" min={0} max={10000000} step={1}
      defaultValue={job.stipendPerMonthInr??""} className={cls}/></label>
  </div>
  </details>
  <label className="flex min-h-11 min-w-0 items-center gap-3 text-sm font-semibold text-body">
    <Checkbox name="isDream" defaultChecked={job.isDream} className="h-4 w-4 accent-primary"/>
    Dream drive — held-offer limit exception
  </label>
  <fieldset className="min-w-0 space-y-2 border-y border-border py-3">
   <legend className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">Eligible batches</legend>
   <p className="text-xs leading-5 text-body">Choose batches allowed to apply. No selection means all batches, subject to the other eligibility rules. A live update does not change role options or scheduled rounds.</p>
   {job.availableBatches.length?<div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
    {job.availableBatches.map(batch=><label key={batch.id}
      className="flex min-h-10 min-w-0 items-start gap-2 rounded-[var(--lms-control-radius)] border border-border p-2 text-sm text-body">
     <Checkbox name="allowedCohortIds" value={batch.id}
       defaultChecked={job.allowedCohortIds.includes(batch.id)}
       className="mt-0.5 h-4 w-4 shrink-0 accent-primary"/>
     <span className="min-w-0 break-words">{batch.name} · {batch.program}
       {batch.status!=="ACTIVE"?<span className="block text-xs text-warning">Previously targeted · inactive</span>:null}
     </span>
    </label>)}
   </div>:<p className="text-sm text-muted-foreground">No active batches. Current targeting is unchanged until a batch is available.</p>}
  </fieldset>
  <section aria-label="Eligibility marks and passing years" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)]">
   <h2 className="text-base font-semibold text-foreground">Eligibility</h2>
   <p className="text-xs leading-5 text-body">Marks follow the Students page: verified first; otherwise student-submitted values are flagged as not verified. Use verified marks only to require confirmed evidence.</p>
   <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
    <Checkbox name="verifiedMarksOnly" defaultChecked={job.verifiedMarksOnly} className="h-4 w-4 accent-primary"/>
    Require verified marks only
   </label>
   <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {([
     ["minTenthPctBasisPoints","10th minimum (%)",job.minTenthPctBasisPoints],
     ["minTwelfthPctBasisPoints","12th minimum (%)",job.minTwelfthPctBasisPoints],
     ["minDiplomaPctBasisPoints","Diploma minimum (%)",job.minDiplomaPctBasisPoints],
     ["minUndergraduatePctBasisPoints","Undergraduate minimum (%)",job.minUndergraduatePctBasisPoints],
     ["minPostgraduatePctBasisPoints","Postgraduate minimum (%)",job.minPostgraduatePctBasisPoints],
    ] as const).map(([name,label,value])=><label key={name} className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">{label}
     <Input name={name} type="number" min={0} max={100} step="0.01"
      defaultValue={value===null?"":value/100} className={cls}/>
    </label>)}
   </div>
   <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">Passing years
    <Input name="allowedPassingYears" defaultValue={job.allowedPassingYears.join(", ")}
     placeholder="e.g. 2026, 2027" className={cls}/>
   </label>
   <p className="text-xs leading-5 text-muted-foreground">Separate years with commas. Leave blank for no passing-year restriction. Other program and academic targeting is managed from the drive workspace.</p>
  </section>
  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
   <label className="block text-[length:var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Application deadline (IST)
    <DateInput name="applicationDeadline" mode="datetime-local"
      defaultValue={job.applicationDeadline?new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(job.applicationDeadline)).replace(" ","T"):""}
      className={cls}/>
   </label>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Minimum CGPA for eligibility
    <Input name="minCgpa" type="number" min={0} max={10} step="0.01"
      defaultValue={job.minCgpaHundredths===null?"":job.minCgpaHundredths/100} className={cls}/>
   </label>
  </div>
    <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Reason for edit (audited)<Textarea required name="reason" minLength={10} maxLength={1000} rows={2} className={cls}/></label>
  <section aria-label="Drive edit status" className="space-y-2 text-sm">
   <p role="status" className="inline-flex items-center gap-2 text-body">
    <span aria-hidden="true" className={dirty?"h-2 w-2 rounded-full bg-warning":"h-2 w-2 rounded-full bg-success"}/>
    {dirty?"Unsaved changes — leave this page only after saving.":
     "Last server save: "+new Intl.DateTimeFormat("en-IN",{
      dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
     }).format(new Date(saved?.at??version))+" IST"}
   </p>
   <p className="text-xs text-body">Active-season draft and live drives can be edited. Live changes are audited. Applicant notices are sent only after you choose to notify; no automatic email is sent.</p>
   {job.status==="PUBLISHED"?<p className="text-xs text-muted-foreground">
    Recruiter-controlled application and interview records are managed separately. These fields do not reschedule interviews or change submitted applications automatically.
   </p>:null}
  </section>
  {error?<div role="alert" className="space-y-2">
    <InlineNotice tone="error" message={error}/>
    <p className="text-sm text-body">Your edits are preserved. If another editor saved first, review the latest drive before trying again.</p>
    <Button type="button" variant="secondary" onClick={()=>router.refresh()} disabled={pending}>
     Reload current drive
    </Button>
   </div>:null}
  {saved?<p role="status" className="text-sm text-body">Save confirmed.
    {saved.notified>0?" "+saved.notified+" applicant(s) notified in-app.":" No applicant notices requested."}
   </p>:null}
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
   <Button variant="primary" type="submit" loading={pending} disabled={pending} className="min-h-11 w-full px-5 sm:w-auto md:min-h-9">{pending?"Saving…":"Save changes"}</Button>
   <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text underline sm:w-auto md:min-h-9"
    href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)}>Open drive page</Link>
   {job.status==="DRAFT"?<Link
    href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"?publish=1#drive-lifecycle-publish"}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text underline sm:w-auto md:min-h-9">
     Review &amp; publish
    </Link>:null}
  </div>
 </form>
 <aside aria-label="Drive setup review" className="min-w-0 space-y-4 lg:sticky lg:top-20">
  <section className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)]">
   <h2 className="mb-3 text-base font-semibold text-[var(--lms-heading)]">Setup review</h2>
   <ol className="space-y-3 text-sm">
    <li className="flex items-start gap-3">
     <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lms-canvas-border)] text-xs font-bold">1</span>
     <div><strong>Company &amp; role</strong>
      <p className="text-xs text-muted-foreground">{reviewTitle.trim().length>=3?reviewTitle:"Add the company and role"}</p>
     </div>
    </li>
    <li className="flex items-start gap-3">
     <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lms-canvas-border)] text-xs font-bold">2</span>
     <div><strong>Pay packages</strong>
      <p className="text-xs text-muted-foreground">{job.roleOptions.length>0?`${job.roleOptions.length} package${job.roleOptions.length===1?"":"s"} · managed on the drive`:"Add at least one role option"}</p>
     </div>
    </li>
    <li className="flex items-start gap-3">
     <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lms-canvas-border)] text-xs font-bold">3</span>
     <div><strong>Application deadline</strong>
      <p className="text-xs text-muted-foreground">{reviewDeadline?"Deadline selected":"Required before publishing"}</p>
     </div>
    </li>
    <li className="flex items-start gap-3">
     <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lms-canvas-border)] text-xs font-bold">4</span>
     <div><strong>Rounds</strong><p className="text-xs text-muted-foreground">Managed separately after saving the drive</p>
      <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/rounds"}
       className="inline-flex min-h-9 items-center text-xs font-semibold text-link underline">View rounds</Link>
     </div>
    </li>
   </ol>
  </section>
  <section className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)]">
   <h2 className="mb-2 font-semibold text-foreground">Who this reaches</h2>
   <p className="text-sm text-body"><strong className="tabular-nums">{job.applicantCount}</strong> existing applicants</p>
   <p className="mt-2 text-xs leading-5 text-muted-foreground">Changes are audited. Applicant notices are sent only after you choose to notify on save.</p>
  </section>
  <section className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)]">
   <h2 className="mb-2 font-semibold text-foreground">Saved packages</h2>
   {job.roleOptions.length?<ul className="space-y-1 text-sm text-body">{job.roleOptions.map(role=><li key={role.id}>{role.title}</li>)}</ul>:
    <p className="text-sm text-muted-foreground">No role packages recorded.</p>}
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/about"}
    className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Open package details</Link>
  </section>
 </aside>
 </div>
 {job.status==="PUBLISHED"?
  <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Save changes to a live drive?"
   description={"Choose whether to notify "+job.applicantCount+" existing applicants. Both choices audit the change."}
   dismissible={!pending}
   footer={<div className="flex w-full flex-col-reverse gap-2 lg:flex-row lg:flex-wrap lg:justify-end">
    <Button variant="secondary" disabled={pending} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>setConfirmOpen(false)}>Cancel</Button>
    <Button variant="secondary" disabled={pending} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>void save(false)}>Save without telling anyone</Button>
    <Button loading={pending} disabled={pending} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>void save(true)}>Save and notify {job.applicantCount} applicants</Button>
   </div>}>
   <p className="text-sm text-body">Changes to dates, compensation or eligibility may affect an applicant&apos;s next action.</p>
  </Dialog>:
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
   title="Save changes to this draft drive?"
   description="These changes are audited and will update this saved draft. Confirm only after checking the employer details."
   confirmVariant="primary" confirmLabel="Save changes" pending={pending} onConfirm={()=>void save(false)}/>}
 {guardDialog}
 </>;
}
