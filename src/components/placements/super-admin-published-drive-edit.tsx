"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {superAdminPublishedDriveEditFeedback} from "@/modules/placements/super-admin-published-drive-edit-feedback";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {beginDriveMutation,endDriveMutation} from "@/modules/placements/drive-mutation-client-lock";
type Job={id:string;title:string;description:string;locations:string[];
 applicationDeadline:string|null;openings:number|null;minCtc:number|null;maxCtc:number|null;updatedAt:string;
 companyRelationshipId:string;assessmentUrl:string|null;assessmentDeadline:string|null;
 candidatePreferences:{preferredDegree:string;specialization:string;graduationYear:number|null;minGpa:number|null;city:string};
 jobTypeLabel:string;employmentType:"FULL_TIME"|"INTERNSHIP"|"CONTRACT";
 workMode:"ONSITE"|"HYBRID"|"REMOTE";responsibilities:string;
 importantDates:Array<{label:string;at:string;type?:string;dateType?:string}>;
 customEligibilityRules:Array<{label:string;value:string}>;
 status:string;legacyVisibilityType?:string|null;
 targeting:{programs:number;cohorts:number;sections:number}|null};
function istLocal(value:string|null){
 if(!value)return "";
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(value)).replace(" ","T");
}
function nullableNumber(value:FormDataEntryValue|null){
 const s=String(value??"").trim();
 return s===""?null:Number(s);
}
export function SuperAdminPublishedDriveEdit({job,jobTypes,companies,sourceReady=true}:{
 job:Job;jobTypes:readonly {label:string}[];companies:readonly {relationshipId:string;name:string}[];sourceReady?:boolean;
}){
 const router=useRouter(),[open,setOpen]=useState(false),[error,setError]=useState("");
 const {showToast}=useToast();
 const [staleConflict,setStaleConflict]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [confirmLeave,setConfirmLeave]=useState(false);
 const [leaveHref,setLeaveHref]=useState<string|null>(null);
 const {pending,run}=useGuardedAction();
 // An incomplete detail/academic prefill is never permission to overwrite a
 // published drive with defaults. Historic job types remain editable only
 // when the saved value is present and the employer is in this college.
 const canEdit=sourceReady&&job.targeting!==null&&Boolean(job.jobTypeLabel.trim())&&
   companies.some(company=>company.relationshipId===job.companyRelationshipId);
 const formRef=useRef<HTMLFormElement>(null);
 const [confirmSave,setConfirmSave]=useState(false);
 const [importantDates,setImportantDates]=useState(job.importantDates);
 const [customRules,setCustomRules]=useState(job.customEligibilityRules);
 function updateImportantDate(index:number,key:"label"|"at",value:string){
  setImportantDates(rows=>rows.map((row,i)=>i===index?{...row,[key]:value}:row));
  setDirty(true);
 }
 function updateCustomRule(index:number,key:"label"|"value",value:string){
  setCustomRules(rows=>rows.map((row,i)=>i===index?{...row,[key]:value}:row));
  setDirty(true);
 }
 function validateSupplementalRows(){
  if(importantDates.length>20||customRules.length>20)return "A maximum of 20 entries is allowed.";
  const dateLabels=new Set<string>();
  for(const row of importantDates){
   const label=row.label.trim(),date=row.at.trim();
   if(!label||!date)return "Important date label and date are required.";
   if(label.length>120)return "Important date label must be within 120 characters.";
   if(label.toLowerCase()==="application deadline"||dateLabels.has(label.toLowerCase()))
    return "Important date labels must be unique and cannot be Application deadline.";
   if(!Number.isFinite(Date.parse(date)))return "Enter a valid important date.";
   dateLabels.add(label.toLowerCase());
  }
  for(const row of customRules){
   if(!row.label.trim()||!row.value.trim())return "Custom rule label and value are required.";
   if(row.label.trim().length>160||row.value.trim().length>200)
    return "Custom rule label must be within 160 characters and value within 200 characters.";
  }
  return "";
 }
 useEffect(()=>{
  if(!open||!dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{
   event.preventDefault();
   event.returnValue="";
  };
  const interceptInternalLink=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   const source=event.target;
   if(!(source instanceof Element))return;
   const anchor=source.closest("a[href]");
   if(!anchor||anchor.hasAttribute("download")||anchor.getAttribute("target")==="_blank")return;
   const href=anchor.getAttribute("href");
   if(!href||!href.startsWith("/")||href.startsWith("//"))return;
   event.preventDefault();
   setLeaveHref(href);
   setConfirmLeave(true);
  };
  const currentUrl=window.location.pathname+window.location.search+window.location.hash;
  const interceptBrowserHistory=()=>{
   const destination=window.location.pathname+window.location.search+window.location.hash;
   if(destination===currentUrl)return;
   // A SPA history traversal has already changed the URL at popstate time.
   // Put the editor URL back until the user explicitly confirms.
   window.history.pushState(window.history.state,"",currentUrl);
   setLeaveHref(destination);
   setConfirmLeave(true);
  };
  window.addEventListener("beforeunload",beforeUnload);
  window.addEventListener("popstate",interceptBrowserHistory);
  document.addEventListener("click",interceptInternalLink,true);
  return ()=>{
   window.removeEventListener("beforeunload",beforeUnload);
   window.removeEventListener("popstate",interceptBrowserHistory);
   document.removeEventListener("click",interceptInternalLink,true);
  };
 },[open,dirty]);
 const detailsHref="/admin/placements/jobs/"+encodeURIComponent(job.id);
 /** Only formatting tags without attributes survive a rich-text save. Unsafe
  * tags are escaped, not ever mounted as untrusted HTML in this editor. */
 function sanitizeRichSource(value:string){
  const escaped=value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  return escaped.replace(/&lt;\/?(?:strong|em|p|br|ul|ol|li|h3)&gt;/gi,
   tag=>tag.replace("&lt;","<").replace("&gt;",">"));
 }
 function insertRichTag(name:"description"|"responsibilities",tag:"strong"|"em"|"p"|"li"){
  const element=formRef.current?.elements.namedItem(name);
  if(!(element instanceof HTMLTextAreaElement))return;
  const start=element.selectionStart,end=element.selectionEnd;
  const markup="<"+tag+">"+(element.value.slice(start,end)||"Text")+"</"+tag+">";
  element.setRangeText(markup,start,end,"select");element.focus();setDirty(true);
 }
 function closeEditor(){
  if(dirty){setLeaveHref(detailsHref);setConfirmLeave(true);}
  else {setOpen(false);router.push(detailsHref);}
 }
 function reviewSave(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||!canEdit){setError("Saved job details could not be verified. Reload before editing.");return;}
  const data=new FormData(event.currentTarget);
  const description=String(data.get("description")??"").trim();
  if(!description.replace(/<[^>]*>/g,"").trim()){
   setError("Please enter job description.");return;
  }
  const selectedType=String(data.get("jobTypeLabel")??"").trim();
  if(!selectedType){setError("Please select job type");return;}
  if(!jobTypes.some(type=>type.label===selectedType)&&selectedType!==job.jobTypeLabel){
   setError("Please select job type");return;
  }
  const company=String(data.get("companyRelationshipId")??"");
  if(!companies.some(option=>option.relationshipId===company)){
   setError("Choose a verified company from this college.");return;
  }
  const assessmentUrl=String(data.get("assessmentUrl")??"").trim();
  if(assessmentUrl&&(assessmentUrl.length>2048||!/^https?:\/\/[^\s/]+/i.test(assessmentUrl))){
   setError("Enter a valid assessment URL starting with http:// or https://.");return;
  }
  const assessmentAt=String(data.get("assessmentDeadline")??"");
  const deadlineAt=String(data.get("deadline")??"");
  // Preserve valid historical deadlines when editing unrelated fields. Only
  // revalidate the ordering if either stored instant is actually edited.
  const changedAssessment=assessmentAt!==istLocal(job.assessmentDeadline);
  const changedDeadline=deadlineAt!==istLocal(job.applicationDeadline);
  if((changedAssessment||changedDeadline)&&assessmentAt&&(!deadlineAt||assessmentAt<=deadlineAt)){
   setError("Assessment deadline must follow application deadline.");return;
  }
  const additionalError=validateSupplementalRows();
  if(additionalError){setError(additionalError);return;}
  const min=nullableNumber(data.get("minimumAnnualCtcInr"));
  const max=nullableNumber(data.get("maximumAnnualCtcInr"));
  if(min!==null&&max!==null&&max<min){
   setError("Maximum CTC must be at least the minimum.");return;
  }
  setError("");
  setConfirmSave(true);
 }
 async function save(){
  if(!formRef.current||pending||!canEdit)return;
  const data=new FormData(formRef.current);
  const description=String(data.get("description")??"").trim();
  if(!description.replace(/<[^>]*>/g,"").trim()){
   setError("Please enter job description.");return;
  }
  const selectedType=String(data.get("jobTypeLabel")??"").trim();
  if(!selectedType||(!jobTypes.some(type=>type.label===selectedType)&&selectedType!==job.jobTypeLabel)){
   setError("Please select job type");return;
  }
  const company=String(data.get("companyRelationshipId")??"");
  if(!companies.some(option=>option.relationshipId===company)){
   setError("Choose a verified company from this college.");return;
  }
  const assessmentUrl=String(data.get("assessmentUrl")??"").trim();
  if(assessmentUrl&&(assessmentUrl.length>2048||!/^https?:\/\/[^\s/]+/i.test(assessmentUrl))){
   setError("Enter a valid assessment URL starting with http:// or https://.");return;
  }
  const enteredDeadline=String(data.get("deadline")??"");
  const applicationDeadline=enteredDeadline===istLocal(job.applicationDeadline)
   ? job.applicationDeadline : driveDeadlineIstToIso(enteredDeadline);
  setConfirmSave(false);
  if(!beginDriveMutation(job.id)){
   setError("Another action is changing this drive. Retry after it finishes.");return;
  }
  try{await run(async()=>{
   setError("");
   try{
    await apiFetch("/api/admin/placements/jobs/"+encodeURIComponent(job.id)+"/edit-published",{
     method:"PATCH",headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:job.updatedAt,
      reason:String(data.get("reason")??"").trim(),title:String(data.get("title")??"").trim(),
      description:sanitizeRichSource(description),
      companyRelationshipId:company,
      assessmentUrl,
      assessmentDeadline:String(data.get("assessmentDeadline")??"")===istLocal(job.assessmentDeadline)
       ?job.assessmentDeadline
       :String(data.get("assessmentDeadline")??"")
         ?driveDeadlineIstToIso(String(data.get("assessmentDeadline"))):null,
      importantDates,
      customEligibilityRules:customRules,
      candidatePreferences:{
       preferredDegree:String(data.get("preferredDegree")??"").trim(),
       specialization:String(data.get("specialization")??"").trim(),
       graduationYear:nullableNumber(data.get("graduationYear")),
       minGpa:nullableNumber(data.get("minGpa")),
       city:String(data.get("preferredCity")??"").trim(),
      },
      responsibilities:sanitizeRichSource(String(data.get("responsibilities")??"").trim()),
      jobTypeLabel:String(data.get("jobTypeLabel")??"").trim(),
      employmentType:String(data.get("employmentType")??""),
      workMode:String(data.get("workMode")??""),
      locations:String(data.get("locations")??"").split(",").map(s=>s.trim()).filter(Boolean),
      applicationDeadline,
      openings:nullableNumber(data.get("openings")),
      minimumAnnualCtcInr:nullableNumber(data.get("minimumAnnualCtcInr")),
      maximumAnnualCtcInr:nullableNumber(data.get("maximumAnnualCtcInr")),
     }),
    });
    setDirty(false);setOpen(false);
    showToast({tone:"success",title:"Job updated"});
    router.push(detailsHref);
    router.refresh();
   }catch(e){
    const fallback=e instanceof Error?e.message:"Unable to edit this drive. Refresh and retry.";
    if(e instanceof FriendlyFetchError && (e.code==="PLACEMENT_JOB_STALE" || e.status===409)){
     setStaleConflict(true);
     setError("");
    }else{
     setError(superAdminPublishedDriveEditFeedback(e instanceof FriendlyFetchError?e.code:null,fallback));
    }
   }
  });}finally{endDriveMutation(job.id);}
 }
 const cls="min-h-11 w-full min-[768px]:min-h-9";
 return <section className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
  <h2 className="font-semibold">Edit drive</h2>
  <p className="text-xs text-body">Changes to job terms are audited. Historic applications, offers, eligibility and decisions are not rewritten.</p>
  {!canEdit?<p role="alert" className="text-sm text-error">Saved job options, company or academic eligibility details could not be verified. Reload settings before editing; no partial changes can be saved.</p>:null}
  {!open?<Button type="button" variant="secondary" disabled={!canEdit}
    onClick={()=>{setDirty(false);setImportantDates(job.importantDates);
      setCustomRules(job.customEligibilityRules);setOpen(true);}}>
   {"Edit "+job.status.toLowerCase()+" drive"}</Button>:
   <form ref={formRef} className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] min-[768px]:grid-cols-2 min-[992px]:grid-cols-3" onChange={()=>setDirty(true)} onSubmit={reviewSave}>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Job Title<Input name="title" autoFocus placeholder="e.g., Software Engineer" required minLength={3} maxLength={100}
     defaultValue={job.title} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Application deadline (IST)<Input type="datetime-local" required
     name="deadline" defaultValue={istLocal(job.applicationDeadline)} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company Name
     <input list="published-drive-companies" name="companySearch" className={cls} defaultValue={
       companies.find(c=>c.relationshipId===job.companyRelationshipId)?.name??""}
       onChange={event=>{
        const match=companies.find(c=>c.name===event.target.value);
        const hidden=formRef.current?.elements.namedItem("companyRelationshipId");
        if(hidden instanceof HTMLInputElement)hidden.value=match?.relationshipId??"";
       }} required/>
     <datalist id="published-drive-companies">{companies.map(company=><option key={company.relationshipId} value={company.name}/>)}</datalist>
     <input type="hidden" name="companyRelationshipId" defaultValue={job.companyRelationshipId}/>
     <small className="font-normal text-muted-foreground">Choose a verified company in this college. Employer reassignment is blocked after any applications.</small>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assessment URL
      <Input type="url" name="assessmentUrl" maxLength={2048} defaultValue={job.assessmentUrl??""} className={cls}/>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assessment deadline (IST)
      <Input type="datetime-local" name="assessmentDeadline" defaultValue={istLocal(job.assessmentDeadline)} className={cls}/>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2 min-[992px]:col-span-3">Job Description
      <div className="flex flex-wrap gap-1.5 py-1" role="toolbar" aria-label="Job Description formatting">
       {(["strong","em","p","li"] as const).map(tag=>
        <Button key={tag} type="button" variant="secondary" size="sm" disabled={pending}
         onClick={()=>insertRichTag("description",tag)}>
         {tag==="strong"?"Bold":tag==="em"?"Italic":tag==="p"?"Paragraph":"List item"}
        </Button>)}
      </div>
      <Textarea name="description" required
     maxLength={15000} defaultValue={job.description} rows={4} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2 min-[992px]:col-span-3">Responsibilities
     <div className="flex flex-wrap gap-1.5 py-1" role="toolbar" aria-label="Responsibilities formatting">
      {(["strong","em","p","li"] as const).map(tag=>
       <Button key={tag} type="button" variant="secondary" size="sm" disabled={pending}
        onClick={()=>insertRichTag("responsibilities",tag)}>
        {tag==="strong"?"Bold":tag==="em"?"Italic":tag==="p"?"Paragraph":"List item"}
       </Button>)}
     </div>
     <Textarea name="responsibilities" maxLength={15000} rows={3} defaultValue={job.responsibilities} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Job Type
     <Select name="jobTypeLabel" required defaultValue={job.jobTypeLabel} className={cls}>
      {jobTypes.map(type=><option key={type.label} value={type.label}>{type.label}</option>)}
      {job.jobTypeLabel&&!jobTypes.some(type=>type.label===job.jobTypeLabel)?
       <option value={job.jobTypeLabel}>{job.jobTypeLabel} (historic)</option>:null}
     </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Employment type
     <Select name="employmentType" required defaultValue={job.employmentType} className={cls}>
      <option value="FULL_TIME">Full-time</option><option value="INTERNSHIP">Internship</option>
      <option value="CONTRACT">Contract</option>
     </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Work mode
     <Select name="workMode" required defaultValue={job.workMode} className={cls}>
      <option value="ONSITE">Onsite</option><option value="HYBRID">Hybrid</option>
      <option value="REMOTE">Remote</option>
     </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2 min-[992px]:col-span-3">Locations (comma-separated)<Input name="locations"
     defaultValue={job.locations.join(", ")} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Openings<Input name="openings" type="number" min={1}
     defaultValue={job.openings??""} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum annual CTC (INR)<Input name="minimumAnnualCtcInr"
     type="number" min={0} defaultValue={job.minCtc??""} className={cls}/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum annual CTC (INR)<Input name="maximumAnnualCtcInr"
     type="number" min={0} defaultValue={job.maxCtc??""} className={cls}/></label>
    <fieldset className="grid min-w-0 gap-3 border-t border-border pt-3 sm:col-span-2 min-[992px]:col-span-3 sm:grid-cols-2">
      <legend className="mb-3 text-sm font-semibold">Preferred candidate details (informational)</legend>
      <label className="grid gap-1 text-xs font-semibold">Preferred Degree
        <Input name="preferredDegree" maxLength={160} defaultValue={job.candidatePreferences.preferredDegree}/></label>
      <label className="grid gap-1 text-xs font-semibold">Specialization
        <Input name="specialization" maxLength={160} defaultValue={job.candidatePreferences.specialization}/></label>
      <label className="grid gap-1 text-xs font-semibold">Graduation Year
        <Input name="graduationYear" type="number" min={1990} max={2050} defaultValue={job.candidatePreferences.graduationYear??""}/></label>
      <label className="grid gap-1 text-xs font-semibold">GPA (out of 10)
        <Input name="minGpa" type="number" min={0} max={10} step="0.01" defaultValue={job.candidatePreferences.minGpa??""}/></label>
      <label className="grid gap-1 text-xs font-semibold">City
        <Input name="preferredCity" maxLength={160} defaultValue={job.candidatePreferences.city}/></label>
      <p className="self-end text-xs text-muted-foreground">Saved as legacy display preferences, not admission eligibility gates.</p>
    </fieldset>

    <fieldset className="min-w-0 space-y-3 border-t border-border pt-3 sm:col-span-2 min-[992px]:col-span-3">
     <legend className="text-sm font-semibold text-[var(--lms-heading)]">Important dates</legend>
     <p className="text-xs text-muted-foreground">Add up to 20 labelled dates. Times use IST.</p>
     {importantDates.map((row,index)=><div key={index} className="grid min-w-0 gap-2 rounded-[var(--lms-control-radius)] border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="grid min-w-0 gap-1 text-xs font-semibold">Label
       <Input required maxLength={120} value={row.label} className={cls}
        onChange={e=>updateImportantDate(index,"label",e.target.value)}/>
      </label>
      <label className="grid min-w-0 gap-1 text-xs font-semibold">Date and time (IST)
       <Input type="datetime-local" required value={istLocal(row.at)} className={cls}
        onChange={e=>{
         try{updateImportantDate(index,"at",e.target.value?driveDeadlineIstToIso(e.target.value):"");}
         catch{setError("Enter a valid important date in IST.");}
        }}/>
      </label>
      <Button type="button" variant="secondary" disabled={pending} onClick={()=>{
       setImportantDates(rows=>rows.filter((_,i)=>i!==index));setDirty(true);
      }}>Remove</Button>
     </div>)}
     <Button type="button" variant="secondary" disabled={pending||importantDates.length>=20}
      onClick={()=>{setImportantDates(rows=>[...rows,{label:"",at:""}]);setDirty(true);}}>+ Add important date</Button>
     {importantDates.length>=20?<p className="text-xs text-muted-foreground">Maximum 20 important dates reached.</p>:null}
    </fieldset>
    <fieldset className="min-w-0 space-y-3 border-t border-border pt-3 sm:col-span-2 min-[992px]:col-span-3">
     <legend className="text-sm font-semibold text-[var(--lms-heading)]">Custom eligibility rules (informational)</legend>
     <p className="text-xs text-muted-foreground">Custom rules appear in the job description. Enforceable eligibility remains in the saved college policy.</p>
     {customRules.map((row,index)=><div key={index} className="grid min-w-0 gap-2 rounded-[var(--lms-control-radius)] border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="grid min-w-0 gap-1 text-xs font-semibold">Rule label
       <Input required maxLength={160} value={row.label} className={cls}
        onChange={e=>updateCustomRule(index,"label",e.target.value)}/>
      </label>
      <label className="grid min-w-0 gap-1 text-xs font-semibold">Value
       <Input required maxLength={200} value={row.value} className={cls}
        onChange={e=>updateCustomRule(index,"value",e.target.value)}/>
      </label>
      <Button type="button" variant="secondary" disabled={pending} onClick={()=>{
       setCustomRules(rows=>rows.filter((_,i)=>i!==index));setDirty(true);
      }}>Remove</Button>
     </div>)}
     <Button type="button" variant="secondary" disabled={pending||customRules.length>=20}
      onClick={()=>{setCustomRules(rows=>[...rows,{label:"",value:""}]);setDirty(true);}}>+ Add custom rule</Button>
     {customRules.length>=20?<p className="text-xs text-muted-foreground">Maximum 20 custom rules reached.</p>:null}
    </fieldset>
    <div className="sm:col-span-2 min-[992px]:col-span-3 border-y border-border py-3 text-sm">
     <p className="font-semibold">Visibility</p>
     <p className="mt-1 text-body">Legacy visibility: {job.legacyVisibilityType??"Not configured"}. Published targeting stays locked to protect applicants; use a draft copy for changes to the audience.</p>
     <p className="font-semibold">Target Audience · Department / Program / Batch / Class</p>
     <p className="mt-1 text-body">Published eligibility targeting is locked to protect existing applicant policy and historical evaluations. Duplicate this drive as a draft to change the dependent academic audience; blank restrictions mean all eligible students within the selected college.</p>
     {job.targeting?<p className="mt-1 text-muted-foreground">Saved restrictions: {job.targeting.programs} programs · {job.targeting.cohorts} batches · {job.targeting.sections} classes.</p>:<p role="alert" className="text-error">Eligibility policy could not be verified.</p>}
    </div>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2 min-[992px]:col-span-3">Reason for edit
     <Textarea name="reason" required minLength={10} maxLength={1000} rows={2} className={cls}/></label>
    {error?<p role="alert" className="text-sm text-error sm:col-span-2 min-[992px]:col-span-3">{error}</p>:null}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:items-center sm:col-span-2 min-[992px]:col-span-3">
     <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending||!canEdit}>
      {pending?"Saving…":"Review and save published changes"}</Button>
     <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={closeEditor}>Cancel</Button>
    </div>
   </form>}
   <ConfirmDialog open={confirmSave} onOpenChange={setConfirmSave}
    title="Save published drive changes?"
    description="Review the edited fields and the mandatory reason. These changes are audited; existing applicant and offer decisions will not be rewritten."
    confirmLabel="Save published changes" cancelLabel="Keep editing" pending={pending}
    onConfirm={()=>void save()}/>
   <ConfirmDialog open={confirmLeave} onOpenChange={setConfirmLeave}
    title="Discard unsaved changes?" description="Your changes to this drive have not been saved."
    confirmLabel="Discard changes" cancelLabel="Keep editing"
    onConfirm={()=>{
     const destination=leaveHref;
     setConfirmLeave(false);setLeaveHref(null);setDirty(false);setOpen(false);
     if(destination)router.push(destination);
    }}/>
   <ConfirmDialog open={staleConflict} onOpenChange={setStaleConflict}
    title="This drive changed since you loaded it"
    description="Reload the current drive details before saving, or dismiss to review your unsaved changes."
    confirmLabel="Reload" cancelLabel="Dismiss" confirmVariant="primary"
    onConfirm={()=>{
     setStaleConflict(false);setConfirmLeave(false);setLeaveHref(null);
     setDirty(false);setOpen(false);setError("");
     router.refresh();
    }}/>
 </section>;
}
