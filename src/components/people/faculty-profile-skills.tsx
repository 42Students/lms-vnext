import { Input } from "@/components/ui/input";
"use client";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import type { FacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import {facultyProfileAnchor} from "@/modules/people/faculty-profile-navigation";
import {facultyProfileActiveSearch,facultyProfileCanReorderVisible,facultyProfileSearchAfterInsertion,facultyProfileSearchSummary} from "@/modules/people/faculty-profile-search-controls";
import {useFacultyProfileUnsavedWarning} from "./faculty-unsaved-warning";
import {restoreFacultySkills,removeFacultySkillDraft,facultyProfileSkillsIssue,facultyProfileSkillMatches,facultyMoveSkillRecord} from "@/modules/people/faculty-profile-draft-actions";
type Skill = FacultyProfileDocument["skills"][number];
export function FacultyProfileSkills({initial,pending,onSave}:{
 initial:FacultyProfileDocument["skills"];pending:boolean;
 onSave:(section:FacultySelfSection,value:Skill[])=>Promise<void>;
}){
 const [rows,setRows]=useState<Skill[]>(initial);
 const [changed,setChanged]=useState(false);
 const [search,setSearch]=useState("");
 const { askConfirm, dialog } = useConfirmFlow();
 const visibleSkills=rows.map((skill,index)=>({skill,index})).filter(({skill})=>facultyProfileSkillMatches(skill,facultyProfileActiveSearch(search,rows.length)));
 const skillsIssue=facultyProfileSkillsIssue(rows);
 useFacultyProfileUnsavedWarning(changed);
 function edit(id:string,field:"skill"|"proficiency",value:string){
  setRows(current=>current.map(row=>row.id===id?{...row,[field]:value}:row));setChanged(true);
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(changed&&!pending&&!skillsIssue)void onSave("skills",rows);
 }
 return <form id={facultyProfileAnchor("skills")} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6"
   aria-label="Skills" onSubmit={submit}>
  <div>
   <h2 className="font-semibold text-foreground">Skills</h2>
   <p className="mt-1 text-sm text-muted-foreground">Add up to 100 professional skills and optional proficiency levels. Changes are saved only when you submit.</p>
  </div>
  {rows.length===0?<p className="text-sm text-muted-foreground">No skills added yet.</p>:null}
  {rows.length>5?<label className="block text-sm text-body">Find skill
    <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
     className="mt-1 w-full rounded-md border border-border bg-background p-3"/>
   </label>:null}
  {rows.length>5&&search.trim()?<div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span role="status">{facultyProfileSearchSummary(rows.length,visibleSkills.length)}</span>
    <Button variant="secondary" type="button" className="px-2 py-1" onClick={()=>setSearch("")}>Clear Skill search</Button>
   </div>:null}
  {rows.length>5&&visibleSkills.length===0?<p role="status" className="text-sm text-muted-foreground">No matching skills. Clear the search to show all.</p>:null}
  {rows.length>5&&!facultyProfileCanReorderVisible(rows.length,visibleSkills.length)?<p className="text-xs text-muted-foreground">Clear search to reorder Skills.</p>:null}
  <div className="space-y-3">
   {visibleSkills.map(({skill,index})=><div key={skill.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
    <label className="min-w-0 text-sm font-semibold text-body">Skill {index+1}
     <Input className="mt-1.5 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3" value={skill.skill}
      maxLength={120} required disabled={pending} onChange={event=>edit(skill.id,"skill",event.target.value)}/>
    </label>
    <label className="min-w-0 text-sm font-semibold text-body">Proficiency
     <Input className="mt-1.5 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3" value={skill.proficiency}
      maxLength={64} disabled={pending} onChange={event=>edit(skill.id,"proficiency",event.target.value)}/>
    </label>
    <div className="flex flex-wrap gap-2 sm:col-span-3">
      <Button variant="secondary" type="button" disabled={pending||index===0||!facultyProfileCanReorderVisible(rows.length,visibleSkills.length)}
       onClick={async()=>{setRows(current=>facultyMoveSkillRecord(current,skill.id,index-1));setChanged(true);}}
       className="min-h-11 px-3">Move up</Button>
      <Button variant="secondary" type="button" disabled={pending||index===rows.length-1||!facultyProfileCanReorderVisible(rows.length,visibleSkills.length)}
       onClick={async()=>{setRows(current=>facultyMoveSkillRecord(current,skill.id,index+1));setChanged(true);}}
       className="min-h-11 px-3">Move down</Button>
    </div>
    <Button variant="secondary" type="button" disabled={pending} onClick={async()=>{if(!(await askConfirm("Remove skill "+(index+1)+" from the unsaved draft?")))return;
      setRows(current=>removeFacultySkillDraft(current,skill.id));setChanged(true);}}
     className="min-h-11 px-4">Remove</Button>
   </div>)}
  </div>
  <div className="flex flex-wrap gap-3">
   <Button variant="secondary" type="button" disabled={pending||rows.length>=100}
    className="min-h-11 px-4"
    onClick={async()=>{setRows(current=>[...current,{id:crypto.randomUUID(),skill:"",proficiency:""}]);
     setSearch(current=>facultyProfileSearchAfterInsertion(current));setChanged(true);}}>
    Add skill
   </Button>
   {changed?<Button variant="secondary" type="button" disabled={pending} onClick={async()=>{
     if(!(await askConfirm("Discard unsaved skill edits and restore saved skills?")))return;
     setRows(restoreFacultySkills(initial));setChanged(false);
    }} className="min-h-11 px-4">Discard unsaved skill edits</Button>:null}
   {changed&&skillsIssue?<p role="alert" className="text-sm text-error">Review Skills: {skillsIssue}</p>:null}
   <Button variant="primary" type="submit" disabled={pending||!changed||Boolean(skillsIssue)}
    className="min-h-9 px-4">
    {pending?"Saving…":"Save skills"}
   </Button>
  </div>
 {dialog}
 </form>;
}
