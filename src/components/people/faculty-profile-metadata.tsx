"use client";
import { useState, type FormEvent } from "react";
import type { FacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import { facultyMetadataFromDraft,type FacultyMetadataDraftEntry } from "@/modules/people/faculty-profile-metadata-model";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import {facultyProfileAnchor} from "@/modules/people/faculty-profile-navigation";
import {useFacultyProfileUnsavedWarning} from "./faculty-unsaved-warning";
import {restoreFacultyMetadataDraft,facultyMetadataDraftIssue,facultyProfileMetadataMatches} from "@/modules/people/faculty-profile-draft-actions";
export function FacultyProfileMetadata({initial,pending,onSave}:{
 initial:FacultyProfileDocument["metadata"];pending:boolean;
 onSave:(section:FacultySelfSection,value:FacultyProfileDocument["metadata"])=>Promise<void>;
}){
 const [rows,setRows]=useState<FacultyMetadataDraftEntry[]>(()=>restoreFacultyMetadataDraft(initial,()=>crypto.randomUUID()));
 const [dirty,setDirty]=useState(false),[error,setError]=useState<string|null>(null);
 const [search,setSearch]=useState("");
 const visibleRows=rows.map((row,index)=>({row,index})).filter(({row})=>facultyProfileMetadataMatches(row,search));
 useFacultyProfileUnsavedWarning(dirty);
 const issue=facultyMetadataDraftIssue(initial,rows);
 function edit(id:string,key:"key"|"value",value:string){
  setRows(current=>current.map(row=>row.id===id?{...row,[key]:value}:row));setDirty(true);
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError(null);
  try{if(dirty&&!pending)void onSave("metadata",facultyMetadataFromDraft(initial,rows));}
  catch(error){setError(error instanceof Error?error.message:"Invalid metadata");}
 }
 return <form id={facultyProfileAnchor("metadata")} aria-label="Additional metadata" onSubmit={submit}
  className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
  <h2 className="text-lg font-semibold text-foreground">Additional metadata</h2>
  <p className="text-sm text-muted-foreground">Edit optional text fields. Existing non-text metadata is preserved unchanged. Never enter passwords or identity numbers.</p>
  {rows.length>5?<label className="block text-sm text-body">Find metadata
    <input type="search" value={search} onChange={event=>setSearch(event.target.value)}
     className="mt-1 w-full rounded-md border border-border bg-background p-3"/>
   </label>:null}
  {rows.length>5&&visibleRows.length===0?<p role="status" className="text-sm text-muted-foreground">No metadata fields match. Clear the search to view all.</p>:null}
  {visibleRows.map(({row,index})=><div key={row.id} className="grid min-w-0 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
   <label className="min-w-0 text-sm font-semibold text-body">Field {index+1}
    <input className="mt-1.5 w-full min-w-0 rounded-md border border-border bg-background p-3"
     maxLength={120} required disabled={pending} value={row.key} onChange={event=>edit(row.id,"key",event.target.value)}/>
   </label>
   <label className="min-w-0 text-sm font-semibold text-body">Value
    <input className="mt-1.5 w-full min-w-0 rounded-md border border-border bg-background p-3"
     maxLength={5000} disabled={pending} value={row.value} onChange={event=>edit(row.id,"value",event.target.value)}/>
   </label>
   <button type="button" disabled={pending} className="min-h-11 rounded-md border border-border px-3 text-sm text-error"
    onClick={()=>{setRows(current=>current.filter(entry=>entry.id!==row.id));setDirty(true);}}>
    Remove draft
   </button>
  </div>)}
  {dirty&&issue?<p role="alert" className="text-sm text-error">{issue}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <div className="flex flex-wrap gap-3">
   <button type="button" disabled={pending||rows.length>=100}
    className="min-h-11 rounded-md border border-border px-4 text-sm" onClick={()=>{
     setRows(current=>[...current,{id:crypto.randomUUID(),key:"",value:""}]);setDirty(true);
    }}>Add field</button>
   {dirty?<button type="button" disabled={pending} onClick={()=>{
    if(!window.confirm("Discard unsaved metadata edits?"))return;
    setRows(restoreFacultyMetadataDraft(initial,()=>crypto.randomUUID()));setDirty(false);setError(null);
   }} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold">Discard unsaved metadata</button>:null}
   <button type="submit" disabled={pending||!dirty||Boolean(issue)} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50">
    {pending?"Saving…":"Save metadata"}
   </button>
  </div>
 </form>;
}
