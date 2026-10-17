"use client";
import {useState} from "react";
type Audience="COLLEGE"|"PLACEMENTS"|"BATCHES"|"BRANCHES"|"DRIVE";
type Option={id:string;label:string};
export type TpoNoticeTargetOptions={
 batches:Option[];branches:Option[];drives:Option[];
};
export function TpoNoticeAudiencePicker({initialAudience,initialTarget,options}:{
 initialAudience:Audience;initialTarget:string;options:TpoNoticeTargetOptions|null;
}){
 const [audience,setAudience]=useState<Audience>(initialAudience);
 const [target,setTarget]=useState(initialTarget);
 const targetKind=audience==="BATCHES"?"batches":audience==="BRANCHES"?"branches":
  audience==="DRIVE"?"drives":null;
 const available=targetKind&&options?options[targetKind]:[];
 const emptyText=targetKind==="batches"?"No batch is in placements":
  targetKind==="branches"?"No student in placements has a branch yet":
  "No published drive yet";
 return <div className="flex flex-wrap items-end gap-3">
  <label className="grid gap-1 text-sm">Audience
   <select name="audience" value={audience}
    onChange={event=>{setAudience(event.target.value as Audience);setTarget("");}}
    className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="COLLEGE">Whole college</option>
    <option value="PLACEMENTS">Students in placements</option>
    <option value="BATCHES">Selected batch</option>
    <option value="BRANCHES">Selected branch</option>
    <option value="DRIVE">Published drive</option>
   </select>
  </label>
  {targetKind&&options?<label className="grid min-w-0 gap-1 text-sm">Choose {targetKind==="drives"?"a drive":targetKind==="batches"?"a batch":"a branch"}
   <select name="targetId" required value={target}
    onChange={event=>setTarget(event.target.value)}
    className="min-h-11 max-w-full rounded-md border border-border bg-surface px-3">
    <option value="">{available.length?"Choose an option":emptyText}</option>
    {available.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
   </select>
   {!available.length?<span role="status" className="text-xs text-muted-foreground">{emptyText}</span>:null}
  </label>:null}
  {targetKind&&!options?<label className="grid gap-1 text-sm">Target ID
   <input name="targetId" required value={target} onChange={event=>setTarget(event.target.value)}
    placeholder="Target options are temporarily unavailable"
    className="min-h-11 rounded-md border border-border bg-surface px-3"/>
   <span role="status" className="text-xs">Options could not load. Refresh to try again.</span>
  </label>:null}
 </div>;
}
