"use client";
import {useState} from "react";
import {missingSelectedChoice,type VerificationFilterChoiceList} from "@/modules/verification/filter-options-model";
import {verificationFilterDraftError} from "@/modules/verification/filter-draft-validation";
type Fields={ageBand:string;enrollment:string;waitingState:string;membershipId:string;q:string;marksheets:string;attention:string;waitingSince:string;submittedFrom:string;programId:string;sectionId:string;batchId:string;branchId:string};
const empty:Fields={ageBand:"ANY",enrollment:"ALL",waitingState:"ALL",membershipId:"",q:"",marksheets:"ANY",attention:"ALL",waitingSince:"",submittedFrom:"",programId:"",sectionId:"",batchId:"",branchId:""};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function VerificationFilterPanel({query,onApply,batchChoices,branchChoices,classChoices,programChoices}:{query:Record<string,string>;onApply:(filters:Fields)=>void;batchChoices?:VerificationFilterChoiceList;branchChoices?:VerificationFilterChoiceList;classChoices?:VerificationFilterChoiceList;programChoices?:VerificationFilterChoiceList}){
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
 return <details className="min-w-0 rounded-lg border p-3">
  <summary className="cursor-pointer text-sm font-medium">More filters: learner name, marksheets, batch, branch, class, waiting since</summary>
  <form className="mt-3 space-y-3" onSubmit={e=>{e.preventDefault();apply(fields);}}>
   <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
    <label className="min-w-0 text-sm">Exact learner membership ID
     <input type="text" maxLength={36} value={fields.membershipId} onChange={e=>change("membershipId",e.target.value)}
      placeholder="Membership UUID" className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2"/>
    </label>
    {query.tab==="WAITING"&&<label className="min-w-0 text-sm">Waiting request state
     <select value={fields.waitingState} onChange={e=>change("waitingState",e.target.value)}
      className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="ALL">Both waiting states</option><option value="SUBMITTED">First submission</option><option value="UPDATE_PENDING">Updated verified details</option>
     </select>
    </label>}
    {query.tab==="WAITING"&&<label className="min-w-0 text-sm">Time in verification queue
     <select value={fields.ageBand} onChange={e=>change("ageBand",e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="ANY">Any age</option><option value="WITHIN_48_HOURS">Under 48 hours</option><option value="TWO_TO_SEVEN_DAYS">2–7 days</option><option value="OVER_SEVEN_DAYS">At least 7 days</option>
     </select>
    </label>}
    <label className="min-w-0 text-sm">Learner name
     <input type="search" maxLength={100} value={fields.q} onChange={e=>change("q",e.target.value)}
      placeholder="Search by name" className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2"/>
    </label>
    <label className="min-w-0 text-sm">Marksheets
     <select value={fields.marksheets} onChange={e=>change("marksheets",e.target.value)}
      className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="ANY">Any</option><option value="MISSING">Missing</option><option value="PRESENT">Present</option>
     </select></label>
    <label className="min-w-0 text-sm">Needs a closer look
     <select value={fields.attention} onChange={e=>change("attention",e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="ALL">All requests</option><option value="MISSING_MARKSHEET">Missing marksheets</option><option value="VERIFIED_DETAILS_CHANGED">Updated verified details</option><option value="WAITING_OVER_WEEK">Waiting over a week</option>
     </select>
    </label>
    {query.tab==="WAITING"?<fieldset className="min-w-0 space-y-2 sm:col-span-2">
      <legend className="text-sm font-semibold">Waiting since</legend>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={()=>chooseWaitingPreset("TODAY")} className="rounded border border-border px-3 py-2 text-sm">Today</button>
        <button type="button" onClick={()=>chooseWaitingPreset("WEEK")} className="rounded border border-border px-3 py-2 text-sm">This week</button>
        <button type="button" onClick={()=>chooseWaitingPreset("OLDER")} className="rounded border border-border px-3 py-2 text-sm">Over a week</button>
      </div>
      <p className="text-xs text-muted-foreground">These shortcuts filter persisted submitted dates in IST and reset conflicting waiting-age filters.</p>
    </fieldset>:null}
    <label className="min-w-0 text-sm">Submitted on or after (IST)
     <input type="date" value={fields.submittedFrom} onChange={e=>change("submittedFrom",e.target.value)}
      className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2"/>
    </label>
    <label className="min-w-0 text-sm">Waiting since (submitted on/before)
     <input type="date" value={fields.waitingSince} onChange={e=>change("waitingSince",e.target.value)}
      className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2"/></label>
    <label className="min-w-0 text-sm">Current academic enrollment
     <select value={fields.enrollment} onChange={e=>change("enrollment",e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="ALL">Any enrollment</option><option value="ACTIVE">Has active college program enrollment</option><option value="NONE">No active college program enrollment</option>
     </select>
    </label>
    <label className="min-w-0 text-sm">Academic program
     <select value={fields.programId} onChange={e=>change("programId",e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="">All programs</option>
      {missingSelectedChoice(programChoices?.items??[],fields.programId)&&<option value={fields.programId}>Selected program (outside first 200)</option>}
      {(programChoices?.items??[]).map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
     </select>{programChoices?.truncated&&<span className="block text-xs">First 200 programs shown.</span>}
    </label>
    <label className="min-w-0 text-sm">Batch
     <select value={fields.batchId} onChange={e=>change("batchId",e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="">All batches</option>
      {missingSelectedChoice(batchChoices?.items??[],fields.batchId)&&<option value={fields.batchId}>Selected batch (not among first 200)</option>}
      {(batchChoices?.items??[]).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
     </select>{batchChoices?.truncated&&<span className="block text-xs">First 200 batches shown.</span>}
    </label>
    <label className="min-w-0 text-sm">Branch
     <select value={fields.branchId} onChange={e=>change("branchId",e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="">All branches</option>
      {missingSelectedChoice(branchChoices?.items??[],fields.branchId)&&<option value={fields.branchId}>Selected branch (outside first 200)</option>}
      {(branchChoices?.items??[]).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
     </select>{branchChoices?.truncated&&<span className="block text-xs">First 200 branches shown.</span>}
    </label>
    <label className="min-w-0 text-sm">Class / section
     <select value={fields.sectionId} onChange={e=>change("sectionId",e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="">All classes</option>
      {missingSelectedChoice(classChoices?.items??[],fields.sectionId)&&<option value={fields.sectionId}>Selected class (outside first 200)</option>}
      {(classChoices?.items??[]).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
     </select>{classChoices?.truncated&&<span className="block text-xs">First 200 classes shown.</span>}
    </label>
   </div>
   {error&&<p role="alert" className="text-sm">{error}</p>}
   <div className="flex flex-wrap gap-2">
    <button type="submit" className="rounded-md border px-3 py-2 text-sm">Apply filters</button>
    <button type="button" onClick={()=>{setFields(empty);apply(empty);}} className="rounded-md border px-3 py-2 text-sm">Clear extra filters</button>
   </div>
  </form>
 </details>;
}
