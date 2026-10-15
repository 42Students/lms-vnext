"use client";
import { useState, type FormEvent } from "react";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";

export type FacultyProfileTextField = {
  name:string; label:string; maxLength:number;
  type?: "text" | "url" | "date"; multiline?:boolean;
};
export function FacultyProfileTextSection({
  section,title,description,fields,initial,pending,onSave,
}:{
  section:FacultySelfSection;title:string;description:string;
  fields:readonly FacultyProfileTextField[];
  initial:Record<string,string>;pending:boolean;
  onSave:(section:FacultySelfSection,value:Record<string,string>)=>Promise<void>;
}){
 const [draft,setDraft]=useState<Record<string,string>>(initial);
 const changed=fields.some(field=>(draft[field.name]??"")!==(initial[field.name]??""));
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!pending && changed)void onSave(section,draft);
 }
 return <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6" aria-label={title}>
  <div>
   <h2 className="text-lg font-semibold text-foreground">{title}</h2>
   <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
  <div className="grid gap-4 sm:grid-cols-2">
   {fields.map(field=><label key={field.name} className="block min-w-0 text-sm font-semibold text-body">
     {field.label}
     {field.multiline?
      <textarea className="mt-1.5 min-h-24 w-full min-w-0 rounded-md border border-border bg-background p-3 text-foreground"
       value={draft[field.name]??""} maxLength={field.maxLength} disabled={pending}
       onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>:
      <input className="mt-1.5 w-full min-w-0 rounded-md border border-border bg-background p-3 text-foreground"
       type={field.type??"text"} value={draft[field.name]??""} maxLength={field.maxLength} disabled={pending}
       onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>}
   </label>)}
  </div>
  <button type="submit" disabled={!changed||pending}
   className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
   {pending?"Saving…":"Save "+title}
  </button>
 </form>;
}
