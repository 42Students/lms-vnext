"use client";
import {useState} from "react";
import { Disclosure } from "@/components/ui/disclosure";
import {Button} from "@/components/ui/button";
import {FilterChip} from "@/components/ui/filter-chip";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {missingSelectedChoice,type VerificationFilterChoiceList} from "@/modules/verification/filter-options-model";
import {verificationFilterDraftError} from "@/modules/verification/filter-draft-validation";
type Fields={ageBand:string;enrollment:string;waitingState:string;membershipId:string;q:string;marksheets:string;attention:string;waitingSince:string;submittedFrom:string;programId:string;sectionId:string;batchId:string;branchId:string};
const empty:Fields={ageBand:"ANY",enrollment:"ALL",waitingState:"ALL",membershipId:"",q:"",marksheets:"ANY",attention:"ALL",waitingSince:"",submittedFrom:"",programId:"",sectionId:"",batchId:"",branchId:""};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function VerificationFilterPanel({query,onApply,batchChoices,branchChoices,classChoices,programChoices,attentionCounts}:{query:Record<string,string>;onApply:(filters:Fields)=>void;batchChoices?:VerificationFilterChoiceList;branchChoices?:VerificationFilterChoiceList;classChoices?:VerificationFilterChoiceList;programChoices?:VerificationFilterChoiceList;attentionCounts?:Partial<Record<"MISSING_MARKSHEET"|"VERIFIED_DETAILS_CHANGED"|"WAITING_OVER_WEEK",number>>}){
 const selected=():Fields=>({ageBand:query.ageBand??"ANY",enrollment:query.enrollment??"ALL",waitingState:query.waitingState??"ALL",membershipId:query.membershipId??"",q:query.q??"",marksheets:query.marksheets??"ANY",attention:query.attention??"ALL",waitingSince:query.waitingSince??"",submittedFrom:query.submittedFrom??"",
  programId:query.programId??"",sectionId:query.sectionId??"",batchId:query.batchId??"",branchId:query.branchId??""});
 const [fields,setFields]=useState<Fields>(selected),[error,setError]=useState("");
 const change=(key:keyof Fields,value:string)=>setFields(old=>({...old,[key]:value}));
 function istDay(daysBeforeToday=0){
  const date=new Date(Date.now()-daysBeforeToday*24*60*60*1000);
  return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
 }
 function chooseWaitingPreset(preset:"TODAY"|"WEEK"|"OLDER"){
  const next={...fields,ageBand:"ANY",attention:"ALL",waitingState:"ALL",
   submittedFrom:preset==="TODAY"?istDay():preset==="WEEK"?istDay(7):"",
   waitingSince:preset==="OLDER"?istDay(8):istDay()};
  setFields(next);apply(next);
 }
 function apply(value:Fields){
  if(value.q.length>100){setError("Name search is too long");return;}
  for(const key of ["programId","sectionId","batchId","branchId","membershipId"] as const){
   if(value[key]&&!uuid.test(value[key])){setError(key+" must be a valid UUID");return;}
  }
  if(value.submittedFrom&&value.waitingSince&&value.submittedFrom>value.waitingSince){setError("Start date must not follow the end date");return;}
  if(value.enrollment==="NONE"&&(value.programId||value.sectionId||value.batchId||value.branchId)){setError("No active enrollment cannot be combined with an academic assignment");return;}
  if(query.tab!=="WAITING"&&value.ageBand!=="ANY"){setError("Waiting-age triage requires the Waiting tab");return;}
  if(value.attention==="WAITING_OVER_WEEK"&&["WITHIN_48_HOURS","TWO_TO_SEVEN_DAYS"].includes(value.ageBand)){setError("Waiting over a week cannot be combined with a younger age band");return;}
  if(value.attention==="VERIFIED_DETAILS_CHANGED"&&value.waitingState==="SUBMITTED"){setError("Changed verified details requires an updated submission");return;}
  const draftError=verificationFilterDraftError({...query,...value});
  if(draftError){setError(draftError);return;}
  setError("");onApply(value);
 }
 return <>
  {attentionCounts?<section aria-label="Needs a closer look" className="min-w-0 space-y-2">
   <h2 className="text-sm font-semibold text-[var(--lms-heading)]">Needs a closer look</h2>
   <div className="flex flex-wrap gap-2">
    {([
     ["MISSING_MARKSHEET","A marksheet missing"],
     ["VERIFIED_DETAILS_CHANGED","Updates to verified details"],
     ["WAITING_OVER_WEEK","Waiting over a week"],
    ] as const).map(([key,label])=><FilterChip key={key} type="button"
      aria-pressed={(fields.attention===key)}
      onClick={()=>{const next={...fields,attention:fields.attention===key?"ALL":key};setFields(next);apply(next);}}>
      {label} ({attentionCounts[key]??0})
    </FilterChip>)}
   </div>
   <p className="text-xs text-muted-foreground">Counts reflect matching requests in the loaded page, not unseen college-wide totals.</p>
  </section>:null}
  <Disclosure title="More filters: learner name, marksheets, batch, branch, class, waiting since" className="min-w-0 border-b border-border pb-3">
  
  <form className="mt-3 space-y-3" onSubmit={e=>{e.preventDefault();apply(fields);}}>
   <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
    <h3 className="col-span-full border-b border-border pb-2 text-sm font-semibold text-[var(--lms-heading)]">What to check</h3>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact learner membership ID
     <Input type="text" maxLength={36} value={fields.membershipId} onChange={e=>change("membershipId",e.target.value)}
      placeholder="Membership UUID" className="mt-1 w-full"/>
    </label>
    {query.tab==="WAITING"&&<label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Waiting request state
     <Select value={fields.waitingState} onChange={e=>change("waitingState",e.target.value)}
      className="mt-1 w-full">
      <option value="ALL">Both waiting states</option><option value="SUBMITTED">First submission</option><option value="UPDATE_PENDING">Updated verified details</option>
     </Select>
    </label>}
    {query.tab==="WAITING"&&<label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Time in verification queue
     <Select value={fields.ageBand} onChange={e=>change("ageBand",e.target.value)} className="mt-1 w-full">
      <option value="ANY">Any age</option><option value="WITHIN_48_HOURS">Under 48 hours</option><option value="TWO_TO_SEVEN_DAYS">2–7 days</option><option value="OVER_SEVEN_DAYS">At least 7 days</option>
     </Select>
    </label>}
    <h3 className="col-span-full border-b border-border pb-2 text-sm font-semibold text-[var(--lms-heading)]">Whose</h3>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Learner name
     <Input type="search" maxLength={100} value={fields.q} onChange={e=>change("q",e.target.value)}
      placeholder="Search by name" className="mt-1 w-full"/>
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Marksheets
     <Select value={fields.marksheets} onChange={e=>change("marksheets",e.target.value)}
      className="mt-1 w-full">
      <option value="ANY">Any (including non-Education checks)</option><option value="MISSING">Some missing</option><option value="PRESENT">All uploaded</option>
     </Select></label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Needs a closer look
     <Select value={fields.attention} onChange={e=>change("attention",e.target.value)} className="mt-1 w-full">
      <option value="ALL">All requests</option><option value="MISSING_MARKSHEET">Missing marksheets</option><option value="VERIFIED_DETAILS_CHANGED">Updated verified details</option><option value="WAITING_OVER_WEEK">Waiting over a week</option>
     </Select>
    </label>
    {query.tab==="WAITING"?<fieldset className="min-w-0 space-y-2 md:col-span-2">
      <legend className="text-sm font-semibold">Waiting since</legend>
      <div className="flex flex-wrap gap-2">
        <FilterChip type="button" onClick={()=>chooseWaitingPreset("TODAY")}>Today</FilterChip>
        <FilterChip type="button" onClick={()=>chooseWaitingPreset("WEEK")}>This week</FilterChip>
        <FilterChip type="button" onClick={()=>chooseWaitingPreset("OLDER")}>Over a week</FilterChip>
      </div>
      <p className="text-xs text-muted-foreground">These shortcuts filter persisted submitted dates in IST and reset conflicting waiting-age filters.</p>
    </fieldset>:null}
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Submitted on or after (IST)
     <Input type="date" value={fields.submittedFrom} onChange={e=>change("submittedFrom",e.target.value)}
      className="mt-1 w-full"/>
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Waiting since (submitted on/before)
     <Input type="date" value={fields.waitingSince} onChange={e=>change("waitingSince",e.target.value)}
      className="mt-1 w-full"/></label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Current academic enrollment
     <Select value={fields.enrollment} onChange={e=>change("enrollment",e.target.value)} className="mt-1 w-full">
      <option value="ALL">Any enrollment</option><option value="ACTIVE">Has active college program enrollment</option><option value="NONE">No active college program enrollment</option>
     </Select>
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic program
     <Select value={fields.programId} onChange={e=>change("programId",e.target.value)} className="mt-1 w-full">
      <option value="">All programs</option>
      {missingSelectedChoice(programChoices?.items??[],fields.programId)&&<option value={fields.programId}>Selected program (outside first 200)</option>}
      {(programChoices?.items??[]).map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
     </Select>{programChoices?.truncated&&<span className="block text-xs">First 200 programs shown.</span>}
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
     <Select value={fields.batchId} onChange={e=>change("batchId",e.target.value)} className="mt-1 w-full">
      <option value="">All batches</option>
      {missingSelectedChoice(batchChoices?.items??[],fields.batchId)&&<option value={fields.batchId}>Selected batch (not among first 200)</option>}
      {(batchChoices?.items??[]).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
     </Select>{batchChoices?.truncated&&<span className="block text-xs">First 200 batches shown.</span>}
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Branch
     <Select value={fields.branchId} onChange={e=>change("branchId",e.target.value)} className="mt-1 w-full">
      <option value="">All branches</option>
      {missingSelectedChoice(branchChoices?.items??[],fields.branchId)&&<option value={fields.branchId}>Selected branch (outside first 200)</option>}
      {(branchChoices?.items??[]).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
     </Select>{branchChoices?.truncated&&<span className="block text-xs">First 200 branches shown.</span>}
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class / section
     <Select value={fields.sectionId} onChange={e=>change("sectionId",e.target.value)} className="mt-1 w-full">
      <option value="">All classes</option>
      {missingSelectedChoice(classChoices?.items??[],fields.sectionId)&&<option value={fields.sectionId}>Selected class (outside first 200)</option>}
      {(classChoices?.items??[]).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
     </Select>{classChoices?.truncated&&<span className="block text-xs">First 200 classes shown.</span>}
    </label>
   </div>
   {error&&<p role="alert" className="text-sm">{error}</p>}
   <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap">
    <Button variant="primary" type="submit" className="min-h-[var(--lms-control-height)] ">Apply filters</Button>
    <Button variant="secondary" type="button" onClick={()=>{setFields(empty);apply(empty);}} className="min-h-[var(--lms-control-height)] ">Clear extra filters</Button>
   </div>
  </form>
 </Disclosure></>;
}
