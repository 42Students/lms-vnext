"use client";
import {useState} from "react";
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
 const targetKind=audience==="BATCHES"?"batches":audience==="BRANCHES"?"branches":
  audience==="DRIVE"?"drives":null;
 const available=targetKind&&options?options[targetKind]:[];
 const filtered=available.filter(item=>item.label.toLowerCase().includes(search.trim().toLowerCase()));
 const multiple=audience==="BATCHES"||audience==="BRANCHES";
 const emptyText=targetKind==="batches"?"No batch is in placements":
  targetKind==="branches"?"No student in placements has a branch yet":
  "No published drive yet";
 return <div className="flex flex-wrap items-end gap-3">
  <label className="grid gap-1 text-sm">Audience
   <select name="audience" value={audience}
    onChange={event=>{setAudience(event.target.value as Audience);setTarget("");setTargets([]);setSearch("");}}
    className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="COLLEGE">Whole college</option>
    <option value="PLACEMENTS">Students in placements</option>
    <option value="BATCHES">Selected batches</option>
    <option value="BRANCHES">Selected branches</option>
    <option value="DRIVE">Published drive</option>
   </select>
  </label>
  {multiple&&options?<div className="grid min-w-48 gap-2 text-sm">
   <label className="grid gap-1">Find {targetKind==="batches"?"batches":"branches"}
    <input type="search" value={search} onChange={event=>setSearch(event.target.value)}
     placeholder="Search options" className="min-h-11 rounded-md border border-border bg-surface px-3"/>
   </label>
   <label className="grid gap-1">Choose {targetKind==="batches"?"batches":"branches"}
    <select aria-label="Selected audience groups" multiple value={targets}
     onChange={event=>setTargets(Array.from(event.target.selectedOptions,option=>option.value).slice(0,50))}
     className="min-h-28 max-w-full rounded-md border border-border bg-surface px-3">
     {filtered.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
   </label>
   {targets.map(id=><input key={id} type="hidden" name="targetIds" value={id}/>)}
   <span role="status" className="text-xs text-muted-foreground">
    {available.length===0?emptyText:targets.length+" chosen. Use Ctrl or Cmd to choose more."}
   </span>
  </div>:null}
  {targetKind==="drives"&&options?<div className="grid min-w-48 gap-2 text-sm">
   <label className="grid gap-1">Find a drive
    <input type="search" value={search}
     onChange={event=>{setSearch(event.target.value);setTarget("");}}
     placeholder="Search published drives"
     className="min-h-11 max-w-full rounded-md border border-border bg-surface px-3"/>
   </label>
   <label className="grid gap-1">Choose a drive
    <select name="targetId" required value={target}
     onChange={event=>setTarget(event.target.value)}
     className="min-h-11 max-w-full rounded-md border border-border bg-surface px-3">
     <option value="">{!available.length?emptyText:!filtered.length?"Nothing matches this search":"Choose an option"}</option>
     {filtered.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
   </label>
   {!available.length?<span role="status" className="text-xs text-muted-foreground">{emptyText}</span>:null}
  </div>:null}
  {targetKind&&!options?<p role="alert" className="text-xs">
   Options could not load. Refresh to try again. Targeted sending is unavailable.
  </p>:null}
 </div>;
}
