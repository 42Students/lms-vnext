"use client";
import { useState, type FormEvent } from "react";
import type { FacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import {restoreFacultySkills,removeFacultySkillDraft} from "@/modules/people/faculty-profile-draft-actions";
type Skill = FacultyProfileDocument["skills"][number];
export function FacultyProfileSkills({initial,pending,onSave}:{
 initial:FacultyProfileDocument["skills"];pending:boolean;
 onSave:(section:FacultySelfSection,value:Skill[])=>Promise<void>;
}){
 const [rows,setRows]=useState<Skill[]>(initial);
 const [changed,setChanged]=useState(false);
 function edit(id:string,field:"skill"|"proficiency",value:string){
  setRows(current=>current.map(row=>row.id===id?{...row,[field]:value}:row));setChanged(true);
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(changed&&!pending)void onSave("skills",rows);
 }
 return <form className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6"
   aria-label="Skills" onSubmit={submit}>
  <div>
   <h2 className="font-semibold text-foreground">Skills</h2>
   <p className="mt-1 text-sm text-muted-foreground">Add up to 100 professional skills and optional proficiency levels. Changes are saved only when you submit.</p>
  </div>
  {rows.length===0?<p className="text-sm text-muted-foreground">No skills added yet.</p>:null}
  <div className="space-y-3">
   {rows.map((skill,index)=><div key={skill.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
    <label className="min-w-0 text-sm font-semibold text-body">Skill {index+1}
     <input className="mt-1.5 w-full min-w-0 rounded-md border border-border bg-background p-3" value={skill.skill}
      maxLength={120} required disabled={pending} onChange={event=>edit(skill.id,"skill",event.target.value)}/>
    </label>
    <label className="min-w-0 text-sm font-semibold text-body">Proficiency
     <input className="mt-1.5 w-full min-w-0 rounded-md border border-border bg-background p-3" value={skill.proficiency}
      maxLength={64} disabled={pending} onChange={event=>edit(skill.id,"proficiency",event.target.value)}/>
    </label>
    <button type="button" disabled={pending} onClick={()=>{if(!window.confirm("Remove skill "+(index+1)+" from the unsaved draft?"))return;
      setRows(current=>removeFacultySkillDraft(current,skill.id));setChanged(true);}}
     className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-error">Remove</button>
   </div>)}
  </div>
  <div className="flex flex-wrap gap-3">
   <button type="button" disabled={pending||rows.length>=100}
    className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground"
    onClick={()=>{setRows(current=>[...current,{id:crypto.randomUUID(),skill:"",proficiency:""}]);setChanged(true);}}>
    Add skill
   </button>
   {changed?<button type="button" disabled={pending} onClick={()=>{
     if(!window.confirm("Discard unsaved skill edits and restore saved skills?"))return;
     setRows(restoreFacultySkills(initial));setChanged(false);
    }} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold">Discard unsaved skill edits</button>:null}
   <button type="submit" disabled={pending||!changed||rows.some(row=>!row.skill.trim())}
    className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50">
    {pending?"Saving…":"Save skills"}
   </button>
  </div>
 </form>;
}
