"use client";
import {useState} from "react";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Alert} from "@/components/ui/alert";
type Audience="COLLEGE"|"PLACEMENTS"|"BATCHES"|"BRANCHES"|"DRIVE";
type Option={id:string;label:string};
export type TpoNoticeTargetOptions={
 batches:Option[];branches:Option[];drives:Option[];
};
export function TpoNoticeAudiencePicker({initialAudience,initialTarget,initialTargets=[],options}:{
 initialAudience:Audience;initialTarget:string;initialTargets?:string[];
 options:TpoNoticeTargetOptions|null;
}){
 const [audience,setAudience]=useState<Audience>(initialAudience);
 const [target,setTarget]=useState(initialTarget);
 const [targets,setTargets]=useState<string[]>(initialTargets);
 const [search,setSearch]=useState("");
 const [validationError,setValidationError]=useState("");
 const requiredMessage=audience==="BATCHES"?"Pick at least one batch":audience==="BRANCHES"?"Pick at least one branch":audience==="DRIVE"?"Pick a drive":"";
 const targetKind=audience==="BATCHES"?"batches":audience==="BRANCHES"?"branches":
  audience==="DRIVE"?"drives":null;
 const available=targetKind&&options?options[targetKind]:[];
 const filtered=available.filter(item=>item.label.toLowerCase().includes(search.trim().toLowerCase()));
 const multiple=audience==="BATCHES"||audience==="BRANCHES";
 const emptyText=targetKind==="batches"?"No batch is in placements":
  targetKind==="branches"?"No student in placements has a branch yet":
  "No published drive yet";
 return <div className="grid w-full min-w-0 flex-1 grid-cols-1 items-start gap-3 sm:w-auto sm:grid-cols-2">
  <fieldset className="min-w-0 space-y-2 sm:col-span-2">
   <legend className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Who is it for</legend>
   <input type="hidden" name="audience" value={audience}/>
   <div className="inline-flex min-w-0 max-w-full flex-wrap rounded-[var(--lms-control-radius)] border border-border bg-surface p-1"
    role="radiogroup" aria-label="Who is it for">
    {([{value:"COLLEGE",label:"Whole college"},{value:"PLACEMENTS",label:"Students in placements"},
      {value:"BATCHES",label:"Selected batches"},{value:"BRANCHES",label:"Selected branches"},
      {value:"DRIVE",label:"Published drive"}] as const).map(option=>
      <label key={option.value}
       className={"inline-flex min-h-11 cursor-pointer items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold md:min-h-9 "+
        (audience===option.value?"bg-[var(--lms-primary)] text-white":
          "text-body hover:bg-surface-subtle")}>
        <input type="radio" name="audience-choice" value={option.value} checked={audience===option.value}
          onChange={()=>{setAudience(option.value);setTarget("");setTargets([]);setSearch("");setValidationError("");}}
          className="sr-only"/>
        {option.label}
      </label>)}
   </div>
  </fieldset>
  {multiple&&options?<div className="grid min-w-0 gap-3 text-sm">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Find {targetKind==="batches"?"batches":"branches"}
    <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
     placeholder="Search options" className="min-h-11 min-[768px]:min-h-9"/>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Choose {targetKind==="batches"?"batches":"branches"}
    <Select aria-label="Selected audience groups" multiple required value={targets}
     aria-invalid={Boolean(validationError)} aria-describedby={validationError?"notice-audience-error":undefined}
     onInvalid={event=>{event.currentTarget.setCustomValidity(requiredMessage);setValidationError(requiredMessage);}}
     onChange={event=>{
       event.currentTarget.setCustomValidity("");setValidationError("");
       const visibleIds=new Set(filtered.map(option=>option.id));
       const visibleSelected=Array.from(event.target.selectedOptions,option=>option.value);
       setTargets(previous=>[...new Set([
         ...previous.filter(id=>!visibleIds.has(id)),...visibleSelected,
       ])].slice(0,50));
     }}
     className="min-h-28 max-w-full">
     {filtered.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>
   </label>
   {validationError?<span id="notice-audience-error" role="alert" className="text-xs text-error">{validationError}</span>:null}
   {targets.map(id=><Input key={id} type="hidden" name="targetIds" value={id}/>)}
   {targets.length>0?<div className="flex min-w-0 flex-wrap gap-2" aria-label="Selected groups">
     {targets.map(id=><button key={id} type="button" onClick={()=>setTargets(current=>current.filter(x=>x!==id))}
       className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface-subtle px-3 text-xs font-semibold">
       {available.find(option=>option.id===id)?.label??"Selected group"} <span aria-hidden="true">×</span>
       <span className="sr-only">Remove</span>
     </button>)}
   </div>:null}
   <span role="status" className="text-xs text-muted-foreground">
    {available.length===0?emptyText:targets.length+" chosen. Use Ctrl or Cmd to choose more."}
   </span>
  </div>:null}
  {targetKind==="drives"&&options?<div className="grid min-w-0 gap-3 text-sm">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Find a drive
    <Input type="search" value={search}
     onChange={event=>{setSearch(event.target.value);setTarget("");}}
     placeholder="Search published drives"
     className="min-h-11 min-[768px]:min-h-9 max-w-full"/>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Choose a drive
    <Select name="targetId" required value={target}
     aria-invalid={Boolean(validationError)} aria-describedby={validationError?"notice-drive-error":undefined}
     onInvalid={event=>{event.currentTarget.setCustomValidity("Pick a drive");setValidationError("Pick a drive");}}
     onChange={event=>{event.currentTarget.setCustomValidity("");setValidationError("");setTarget(event.target.value);}}
     className="min-h-11 min-[768px]:min-h-9 max-w-full">
     <option value="">{!available.length?emptyText:!filtered.length?"Nothing matches this search":"Pick a drive"}</option>
     {filtered.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>
   </label>
   {validationError?<span id="notice-drive-error" role="alert" className="text-xs text-error">{validationError}</span>:null}
   {!available.length?<span role="status" className="text-xs text-muted-foreground">{emptyText}</span>:null}
  </div>:null}
  {targetKind&&!options?<Alert className="sm:col-span-2" tone="error">Options could not load. Refresh to try again. Targeted sending is unavailable.</Alert>:null}
 </div>;
}
