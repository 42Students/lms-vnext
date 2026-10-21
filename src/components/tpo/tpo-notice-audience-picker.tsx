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
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Audience
   <Select name="audience" value={audience}
    onChange={event=>{setAudience(event.target.value as Audience);setTarget("");setTargets([]);setSearch("");setValidationError("");}}
    className="min-h-11 min-[768px]:min-h-9">
    <option value="COLLEGE">Whole college</option>
    <option value="PLACEMENTS">Students in placements</option>
    <option value="BATCHES">Selected batches</option>
    <option value="BRANCHES">Selected branches</option>
    <option value="DRIVE">Published drive</option>
   </Select>
  </label>
  {multiple&&options?<div className="grid min-w-0 gap-3 text-sm">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Find {targetKind==="batches"?"batches":"branches"}
    <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
     placeholder="Search options" className="min-h-11 min-[768px]:min-h-9"/>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Choose {targetKind==="batches"?"batches":"branches"}
    <Select aria-label="Selected audience groups" multiple required value={targets}
     aria-invalid={Boolean(validationError)} aria-describedby={validationError?"notice-audience-error":undefined}
     onInvalid={event=>{event.currentTarget.setCustomValidity(requiredMessage);setValidationError(requiredMessage);}}
     onChange={event=>{event.currentTarget.setCustomValidity("");setValidationError("");setTargets(Array.from(event.target.selectedOptions,option=>option.value).slice(0,50));}}
     className="min-h-28 max-w-full">
     {filtered.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>
   </label>
   {validationError?<span id="notice-audience-error" role="alert" className="text-xs text-error">{validationError}</span>:null}
   {targets.map(id=><Input key={id} type="hidden" name="targetIds" value={id}/>)}
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
     <option value="">{!available.length?emptyText:!filtered.length?"Nothing matches this search":"Choose an option"}</option>
     {filtered.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>
   </label>
   {validationError?<span id="notice-drive-error" role="alert" className="text-xs text-error">{validationError}</span>:null}
   {!available.length?<span role="status" className="text-xs text-muted-foreground">{emptyText}</span>:null}
  </div>:null}
  {targetKind&&!options?<Alert className="sm:col-span-2" tone="error">Options could not load. Refresh to try again. Targeted sending is unavailable.</Alert>:null}
 </div>;
}
