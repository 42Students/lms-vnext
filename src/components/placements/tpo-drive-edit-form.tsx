"use client";
import { DateInput } from "@/components/ui/date-input";
import type {getTpoDriveEditState} from "@/modules/placements/tpo-drive-edit-service";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {useEffect,useState,type FormEvent} from "react";
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
import {DrivePayCategoryField,readDrivePayCategoryFields} from "./drive-pay-category-field";
import {isDrivePayCategory} from "@/modules/placements/drive-pay-category-model";
type Draft=Awaited<ReturnType<typeof getTpoDriveEditState>>;
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
 const [maxCtcInr,setMaxCtcInr]=useState(job.maximumAnnualCtcInr===null?"":String(job.maximumAnnualCtcInr));

 const [reviewDeadline,setReviewDeadline]=useState(job.applicationDeadline??"");
 type Reach={kind:"UNAVAILABLE";reason:string}|{kind:"READY";asOf:string;
   savedRevision:string;evaluated:number;eligible:number;
   eligibleWithMissingEvidence:number;needsData:number;ineligible:number;
   branches:Array<{name:string;eligible:number;total:number}>;scopeNote:string};
 const [reach,setReach]=useState<Reach|null>(null);
 const [reachBusy,setReachBusy]=useState(false);
 const [reachRequest,setReachRequest]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setReachBusy(true);
  void apiFetch<Reach>("/api/placements/tpo/jobs/"+encodeURIComponent(job.id)+"/reach-preview",{
   credentials:"same-origin",cache:"no-store",signal:controller.signal,
  }).then(data=>{if(!controller.signal.aborted)setReach(data);})
   .catch(()=>{if(!controller.signal.aborted)setReach({
    kind:"UNAVAILABLE",reason:"The eligibility preview could not be calculated. Retry to check the saved policy.",
   });})
   .finally(()=>{if(!controller.signal.aborted)setReachBusy(false);});
  return ()=>controller.abort();
 },[job.id,reachRequest]);
 const [jdBusy,setJdBusy]=useState(false);
 const [jdError,setJdError]=useState<string|null>(null);
 const [jdHasFile,setJdHasFile]=useState(Boolean(job.jobDescriptionObjectPath));
 const [jdUnconfirmedKey,setJdUnconfirmedKey]=useState<string|null>(null);
 const [jdRemoveOpen,setJdRemoveOpen]=useState(false);
 const [jdReason,setJdReason]=useState("Updated the job description document");
 const jdUrl="/api/placements/tpo/jobs/"+encodeURIComponent(job.id)+"/jd-upload";
 type JdMutation={updatedAt:string;hasDocument:boolean};
 async function saveJd(action:"CONFIRM"|"REMOVE",objectKey?:string){
  const result=await apiFetch<JdMutation>(jdUrl,{
   method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
   body:JSON.stringify({action,expectedUpdatedAt:version,reason:jdReason.trim(),
    ...(objectKey?{objectKey}:{})}),
  });
  setVersion(result.updatedAt);setJdHasFile(result.hasDocument);
  setJdUnconfirmedKey(null);
  setJdRemoveOpen(false);
  showToast({tone:"success",title:action==="REMOVE"?"Job description removed":"Job description attached",
   description:"Document access follows the selected-college private storage policy."});
  router.refresh();
 }
 async function uploadJd(file:File){
  if(jdBusy||pending)return;
  const types:Record<string,string>={pdf:"application/pdf",doc:"application/msword",
   docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"};
  const ext=file.name.split(".").pop()?.toLowerCase();
  if(!ext||types[ext]!==file.type||file.size<1||file.size>5*1024*1024){
   setJdError("Choose a PDF, DOC or DOCX file up to 5 MB.");return;
  }
  if(jdReason.trim().length<10){
   setJdError("Explain the attachment change in at least 10 characters.");return;
  }
  setJdBusy(true);setJdError(null);setJdUnconfirmedKey(null);
  try{
   const grant=await apiFetch<{uploadUrl:string;objectKey:string;requiredHeaders:Record<string,string>}>(jdUrl,{
    method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({action:"INITIATE",originalName:file.name,
     contentType:file.type,sizeBytes:file.size}),
   });
   const uploaded=await fetch(grant.uploadUrl,{method:"PUT",body:file,
    headers:grant.requiredHeaders});
   if(!uploaded.ok)throw new Error("Secure file upload failed. Select the file again.");
   setJdUnconfirmedKey(grant.objectKey);
   await saveJd("CONFIRM",grant.objectKey);
  }catch(cause){
   setJdError(cause instanceof Error?cause.message:"Unable to attach this document.");
  }finally{setJdBusy(false);}
 }
 async function retryJdConfirmation(){
  if(!jdUnconfirmedKey||jdBusy||pending)return;
  setJdBusy(true);setJdError(null);
  try{await saveJd("CONFIRM",jdUnconfirmedKey);}
  catch(error){setJdError(error instanceof Error?error.message:"Verification failed.");}
  finally{setJdBusy(false);}
 }
 async function removeJd(){
  if(jdBusy||pending)return;
  setJdBusy(true);setJdError(null);
  try{await saveJd("REMOVE");}
  catch(error){setJdError(error instanceof Error?error.message:"Could not remove document.");}
  finally{setJdBusy(false);}
 }
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
  const portalEnabled=fields.get("studentsRegisterSeparately")==="on";
  const portalName=String(fields.get("portalName")??"").trim();
  const portalUrl=String(fields.get("portalUrl")??"").trim();
  if(portalEnabled){
   if(!portalName){setError("Enter the employer portal name.");return;}
   try{
    const url=new URL(portalUrl);
    if(url.protocol!=="https:"||url.username||url.password||!url.hostname||
     portalUrl.length>2000)throw Error("INVALID_URL");
   }catch{setError("Enter a secure HTTPS link for the employer portal.");return;}
  }
  const chosenPrograms=fields.getAll("allowedProgramIds").map(String);
  if(chosenPrograms.some(id=>!job.availablePrograms.some(program=>program.id===id))){
   setError("An eligible program selection is no longer available. Reload this drive.");return;
  }
  const category=readDrivePayCategoryFields(fields);
  if(!category.ok){setError(category.message);return;}
  setProposal({
   confirmed:true,expectedUpdatedAt:version,
   // An imported tier that was never overridden is left untouched.
   ...(category.legacyJobCategory===null&&job.legacyJobCategory&&!job.legacyCategoryOverrideReason?{}:{
    legacyJobCategory:category.legacyJobCategory,
    categoryOverrideReason:category.categoryOverrideReason,
   }),
   applicationDeadline:deadline,minCgpaHundredths:cgpa===null?null:Math.round(cgpa*100),
   ...(job.availableBatches.length?{allowedCohortIds:fields.getAll("allowedCohortIds").map(String)}:{}),
   ...(job.availablePrograms.length?{allowedProgramIds:chosenPrograms}:{}),
   ...(job.legacyPostingDetails?{portal:{
    studentsRegisterSeparately:portalEnabled,
    name:portalEnabled?portalName:"",
    url:portalEnabled?portalUrl:"",
   }}:{}),
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
 {job.recruiterOwned ? <div role="note"
   className="space-y-1 border-l-[3px] border-info-border bg-info-subtle px-4 py-3 text-sm">
   <p className="font-semibold">Recruiter-originated drive</p>
   <p className="text-body">
     This drive originated from a recruiter{job.recruiterOwnershipSource==="APPROVED_RECRUITER_REQUEST"
       ?" request approved by the college":""}. The company relationship and recruiter ownership
     stay attached to the approved request; this form cannot transfer them to another recruiter.
     Edit only college-authorized job terms. Company and recruiter access changes require
     their separate audited workflows.
   </p>
 </div> : null}
 <div className="grid min-w-0 items-start gap-[18px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
 <form onSubmit={submit} onChange={event=>{
  markDirty();setSaved(null);
  const field=event.target;
  if(field instanceof HTMLInputElement){
   if(field.name==="title")setReviewTitle(field.value);
   if(field.name==="applicationDeadline")setReviewDeadline(field.value);
   if(field.name==="maximumAnnualCtcInr")setMaxCtcInr(field.value);
  }
 }} className="min-w-0 space-y-4 border-b border-border pb-5 [overflow-wrap:anywhere]">
  <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Role<Input required name="title" defaultValue={job.title} minLength={3} maxLength={100} placeholder="e.g. Systems Engineer" className={cls}/></label>
  <section aria-label="Employer relationship" className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 py-3">
   <h3 className="text-sm font-semibold text-foreground">Company</h3>
   <p className="mt-1 text-base font-semibold text-foreground">{job.companyName??"Add the company"}</p>
   <p className="mt-1 text-xs leading-5 text-body">
    The selected employer relationship for this saved drive is read-only here.
    Changing the company requires its separately authorized reassignment workflow;
    saving job terms cannot silently transfer company or recruiter access.
   </p>
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/about"}
    className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
    View linked company and role details
   </Link>
  </section>
  <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Description<Textarea required name="description" defaultValue={job.description} maxLength={20000} rows={3} className={cls}/></label>
  <section aria-label="Selection rounds preview" className="min-w-0 space-y-2 border-b border-border pb-3">
   <h3 className="font-semibold text-sm text-foreground">Selection rounds</h3>
   {job.rounds.length===0?<p className="text-xs text-body">No selection rounds configured.</p>:
    <ol className="space-y-1 text-xs text-body">{job.rounds.map(round=>
     <li key={round.id} className="break-words">
      <span className="font-semibold">{round.sequence}. {round.name}</span>
      {" · "}{round.kind.replaceAll("_"," ")}{" · "}{round.status}
      {round.scheduledAt?" · "+new Intl.DateTimeFormat("en-IN",{
       timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
      }).format(new Date(round.scheduledAt))+" IST":""}
     </li>)}</ol>}
   {!job.roundsComplete?<p role="status" className="text-xs text-warning">
    Showing the first 100 rounds. Visit the rounds workspace for the full list.</p>:null}
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/rounds"}
    className="inline-flex min-h-11 items-center text-xs font-semibold text-primary-text underline md:min-h-9">
    Manage selection rounds
   </Link>
   <p className="text-xs text-muted-foreground">
    Company identity, recruiter ownership, role packages and round schedules require
    their separate authorized editing workflows.</p>
  </section>
  <section aria-label="Job description attachment" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
   <h3 className="text-sm font-semibold text-foreground">Job description (PDF or Word)</h3>
   <p className="text-xs leading-5 text-body">Optional PDF, DOC or DOCX, up to 5 MB.
    A clean private object is required before learners can open a short-lived download.</p>
   <p role="status" className="text-xs text-body">
    {jdHasFile?"Verified job description attached.":"No job description attached."}
   </p>
   <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Reason for attachment change
    <Input value={jdReason} maxLength={1000} disabled={jdBusy||pending}
     onChange={event=>setJdReason(event.target.value)}/>
   </label>
   <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Attach job description
    <Input type="file" accept=".pdf,.doc,.docx" disabled={jdBusy||pending||jdReason.trim().length<10}
     onChange={event=>{const file=event.target.files?.[0];event.target.value="";
      if(file)void uploadJd(file);}}/>
   </label>
   {jdUnconfirmedKey?<div className="space-y-2">
    <p role="status" className="text-xs text-warning">
     File uploaded but not yet verified. Retry confirmation without uploading it again.
    </p>
    <Button type="button" variant="secondary" disabled={jdBusy||pending}
     onClick={()=>void retryJdConfirmation()}>Retry document verification</Button>
   </div>:null}
   {jdBusy?<p role="status" className="text-xs text-body">Uploading or verifying…</p>:null}
   {jdError?<InlineNotice tone="error" message={jdError}/>:null}
   {jdHasFile?<Button type="button" variant="secondary"
    disabled={jdBusy||pending||jdReason.trim().length<10}
    onClick={()=>setJdRemoveOpen(true)}>Remove attached document</Button>:null}
  </section>
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
  <DrivePayCategoryField inputClassName={cls}
   maxCtcLpa={maxCtcInr.trim()!==""&&Number.isFinite(Number(maxCtcInr))?Number(maxCtcInr)/100000:null}
   initialCategory={isDrivePayCategory(job.legacyJobCategory)&&job.legacyCategoryOverrideReason?job.legacyJobCategory:null}
   initialReason={job.legacyCategoryOverrideReason??""}/>
  <label className="flex min-h-11 min-w-0 items-center gap-3 text-sm font-semibold text-body">
    <Checkbox name="isDream" defaultChecked={job.isDream} className="h-4 w-4 accent-primary"/>
    Dream drive — held-offer limit exception
  </label>
  <fieldset className="min-w-0 space-y-2 border-y border-border py-3">
   <legend className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">Eligible batches</legend>
   <p className="text-xs leading-5 text-body">Choose batches allowed to apply. No selection means all batches, subject to the other eligibility rules. A live update does not change role options or scheduled rounds.</p>
   {job.availableBatches.length?<div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
    {job.availableBatches.map(batch=><label key={batch.id}
      className="flex min-h-11 min-w-0 items-start gap-2 rounded-[var(--lms-control-radius)] border border-border p-2 text-sm text-body">
     <Checkbox name="allowedCohortIds" value={batch.id}
       defaultChecked={job.allowedCohortIds.includes(batch.id)}
       className="mt-0.5 h-4 w-4 shrink-0 accent-primary"/>
     <span className="min-w-0 break-words">{batch.name} · {batch.program}
       {batch.status!=="ACTIVE"?<span className="block text-xs text-warning">Previously targeted · inactive</span>:null}
     </span>
    </label>)}
   </div>:<p className="text-sm text-muted-foreground">No active batches. Current targeting is unchanged until a batch is available.</p>}
  </fieldset>
  <fieldset className="min-w-0 space-y-2 border-b border-border pb-3">
   <legend className="text-sm font-semibold text-foreground">Eligible programs and branches</legend>
   <p className="text-xs leading-5 text-body">Select the allowed branches. No selection means all
    programs in the eligible batches. Only programs from this college can be saved.</p>
   {job.availablePrograms.length?<div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
    {job.availablePrograms.map(program=><label key={program.id}
     className="flex min-h-11 min-w-0 items-start gap-2 rounded border border-border p-2 text-sm">
     <Checkbox name="allowedProgramIds" value={program.id}
      defaultChecked={job.allowedProgramIds.includes(program.id)}
      className="mt-1 shrink-0"/>
     <span className="min-w-0 break-words">{program.departmentName} · {program.name}
      {program.status!=="ACTIVE"?<span className="block text-xs text-warning">Previously selected · inactive</span>:null}
     </span>
    </label>)}
   </div>:<p role="status" className="text-xs text-muted-foreground">No college programs available; saved branch targeting is preserved.</p>}
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
   <p className="text-xs leading-5 text-muted-foreground">Separate years with commas. Leave blank for no passing-year restriction.</p>
   <div className="border-t border-border pt-3 text-sm">
    <p className="font-semibold text-foreground">Departments and branches</p>
    <p className="mt-1 text-body">{job.allowedProgramIds.length?
      job.allowedProgramIds.length+" program / branch targets are recorded on this drive.":
      "No explicit program or branch restriction is recorded."}</p>
    <p className="mt-1 text-xs text-muted-foreground">
     Program, section and backlog restrictions must use the server-validated eligibility policy.
     Changing visible marks alone does not replace those safeguards.
    </p>
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/about"}
     className="mt-2 inline-flex min-h-9 items-center text-link underline">
     Review full saved eligibility and role policy
    </Link>
   </div>
  </section>
  <fieldset className="space-y-3 border-y border-border py-3">
   <legend className="text-sm font-semibold text-foreground">Employer's external registration portal</legend>
   <label className="flex min-h-11 items-center gap-2 text-sm text-body">
    <Checkbox name="studentsRegisterSeparately"
     defaultChecked={job.legacyPostingDetails?.portal?.studentsRegisterSeparately??false}/>
    Students also register on the company portal
   </label>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Portal name
     <Input name="portalName" maxLength={160}
      defaultValue={job.legacyPostingDetails?.portal?.name??""} className={cls}/>
    </label>
    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Portal link (HTTPS)
     <Input name="portalUrl" type="url" maxLength={2000}
      defaultValue={job.legacyPostingDetails?.portal?.url??""} placeholder="https://..." className={cls}/>
    </label>
   </div>
   {!job.legacyPostingDetails?<p className="text-xs text-warning">
    This historical drive has no editable portal metadata. Its existing portal fields remain unchanged.</p>:null}
  </fieldset>
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
  <div id="drive-save-actions" className="flex min-w-0 scroll-mt-20 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
    {reachBusy?<p role="status" className="mt-2 text-sm text-body">Calculating the saved eligibility policy…</p>:null}
    {reach?.kind==="READY"?<div className="mt-3 space-y-3">
     <p role="status" className="text-sm font-semibold text-foreground">
      {reach.eligible.toLocaleString("en-IN")} fully eligible of {reach.evaluated.toLocaleString("en-IN")} active enrolled learners
     </p>
     <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      {([
       ["Eligible",reach.eligible],
       ["Eligible with missing evidence",reach.eligibleWithMissingEvidence],
       ["Needs data",reach.needsData],
       ["Ineligible",reach.ineligible],
      ] as const).map(([label,value])=><div key={label}
       className="min-w-0 rounded border border-border px-2 py-2">
       <dt className="text-muted-foreground">{label}</dt>
       <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value.toLocaleString("en-IN")}</dd>
      </div>)}
     </dl>
     <details>
      <summary className="cursor-pointer text-sm font-semibold text-link">Branch breakdown</summary>
      {reach.branches.length?<ul className="mt-2 max-h-44 space-y-1 overflow-y-auto text-xs">
       {reach.branches.map(branch=><li key={branch.name} className="flex justify-between gap-3 border-b border-border py-1">
        <span className="min-w-0 break-words">{branch.name}</span>
        <span className="shrink-0 tabular-nums">{branch.eligible} fully eligible / {branch.total}</span>
       </li>)}
      </ul>:<p className="text-xs text-muted-foreground">No active enrolled learners.</p>}
     </details>
     <p className="text-xs leading-5 text-muted-foreground">{reach.scopeNote}</p>
     <p className="text-xs text-muted-foreground">
      Calculated {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(reach.asOf))} IST
      {reach.savedRevision!==version?" · Refresh to check the latest saved revision":""}
     </p>
    </div>:reach?.kind==="UNAVAILABLE"?<p role="alert" className="mt-2 text-sm text-warning">
     Eligibility preview unavailable: {reach.reason}
    </p>:null}
    {dirty?<p className="mt-2 text-xs text-warning">
     This count uses saved rules, not unsaved changes in this form. Save the policy before relying on a new preview.
    </p>:null}
    <Button type="button" variant="secondary" className="mt-2 min-h-9"
     disabled={reachBusy} onClick={()=>setReachRequest(n=>n+1)}>
     {reachBusy?"Calculating…":"Refresh eligibility preview"}
    </Button>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">Changes are audited. Applicant notices are sent only after you choose to notify on save.</p>
  </section>
  <section className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)]">
   <h2 className="mb-2 font-semibold text-foreground">Saved packages</h2>
    {job.roleOptions.length?<ul className="space-y-3 text-sm text-body">{job.roleOptions.map(role=>
     <li key={role.id} className="min-w-0 border-b border-border pb-2">
      <strong className="break-words text-foreground">{role.title}</strong>
      <dl className="mt-1 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
       <div><dt className="inline font-semibold">Type: </dt><dd className="inline">{role.employmentType??"—"}</dd></div>
       <div><dt className="inline font-semibold">Work mode: </dt><dd className="inline">{role.workMode??"—"}</dd></div>
       <div><dt className="inline font-semibold">CTC: </dt><dd className="inline">
        {role.minimumAnnualCtcInr===null||role.minimumAnnualCtcInr===undefined?
         "—":"₹"+role.minimumAnnualCtcInr.toLocaleString("en-IN")}
        {role.maximumAnnualCtcInr!==null&&role.maximumAnnualCtcInr!==undefined?
         " – ₹"+role.maximumAnnualCtcInr.toLocaleString("en-IN"):""}</dd></div>
       <div><dt className="inline font-semibold">Monthly stipend: </dt><dd className="inline">
        {role.stipendPerMonthInr===null||role.stipendPerMonthInr===undefined?
         "—":"₹"+Number(role.stipendPerMonthInr).toLocaleString("en-IN")}</dd></div>
      </dl>
     </li>)}</ul>:
     <p className="text-sm text-muted-foreground">No role packages recorded.</p>}
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(job.id)+"/about"}
     className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Review and edit role packages</Link>
    <p className="mt-1 text-xs text-muted-foreground">
     Additional role packages use the authorized role-option editor and are saved separately from this job-level form.
    </p>
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
 <ConfirmDialog open={jdRemoveOpen} onOpenChange={setJdRemoveOpen}
   title="Remove attached job description?"
   description="Learners will no longer be able to download this JD. Job terms and existing applications remain unchanged."
   confirmVariant="danger" confirmLabel="Remove document" pending={jdBusy}
   onConfirm={()=>void removeJd()}/>
 {guardDialog}
 </>;
}
