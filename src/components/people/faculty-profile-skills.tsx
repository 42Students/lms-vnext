"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
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
 return <form id={facultyProfileAnchor("skills")} className="min-w-0 scroll-mt-6 space-y-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]"
   aria-label="Skills" onSubmit={submit}>
  <div>
   <h2 className="text-base font-semibold leading-6 text-foreground md:text-lg">Skills</h2>
   <p className="mt-1 text-sm text-muted-foreground">Add up to 100 professional skills and optional proficiency levels. Changes are saved only when you submit.</p>
  </div>
  {rows.length===0?<p className="text-sm text-muted-foreground">No skills added yet.</p>:null}
  {rows.length>5?<label className="block text-[13px] font-semibold leading-4 text-body">Find skill
    <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
     className="mt-1 min-h-11 w-full min-[768px]:min-h-9"/>
   </label>:null}
  {rows.length>5&&search.trim()?<div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span role="status">{facultyProfileSearchSummary(rows.length,visibleSkills.length)}</span>
    <Button variant="secondary" type="button"  onClick={()=>setSearch("")}>Clear Skill search</Button>
   </div>:null}
  {rows.length>5&&visibleSkills.length===0?<p role="status" className="text-sm text-muted-foreground">No matching skills. Clear the search to show all.</p>:null}
  {rows.length>5&&!facultyProfileCanReorderVisible(rows.length,visibleSkills.length)?<p className="text-xs text-muted-foreground">Clear search to reorder Skills.</p>:null}
  <div className="space-y-3">
   {visibleSkills.map(({skill,index})=><div key={skill.id} className="grid min-w-0 gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] sm:grid-cols-2 sm:items-end">
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-body">Skill {index+1}
     <Input className="mt-[var(--lms-space-2)] min-h-11 min-[768px]:min-h-9 w-full min-w-0" value={skill.skill}
      maxLength={120} required disabled={pending} onChange={event=>edit(skill.id,"skill",event.target.value)}/>
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-body">Proficiency
     <Input className="mt-[var(--lms-space-2)] min-h-11 min-[768px]:min-h-9 w-full min-w-0" value={skill.proficiency}
      maxLength={64} disabled={pending} onChange={event=>edit(skill.id,"proficiency",event.target.value)}/>
    </label>
    <div className="flex min-w-0 flex-wrap gap-[var(--lms-space-2)] sm:col-span-2 [&>button]:min-h-11">
      <Button variant="secondary" type="button" disabled={pending||index===0||!facultyProfileCanReorderVisible(rows.length,visibleSkills.length)}
       onClick={async()=>{setRows(current=>facultyMoveSkillRecord(current,skill.id,index-1));setChanged(true);}}
       >Move up</Button>
      <Button variant="secondary" type="button" disabled={pending||index===rows.length-1||!facultyProfileCanReorderVisible(rows.length,visibleSkills.length)}
       onClick={async()=>{setRows(current=>facultyMoveSkillRecord(current,skill.id,index+1));setChanged(true);}}
       >Move down</Button>
    </div>
    <Button variant="secondary" type="button" disabled={pending} onClick={async()=>{if(!(await askConfirm("Remove skill "+(index+1)+" from the unsaved draft?")))return;
      setRows(current=>removeFacultySkillDraft(current,skill.id));setChanged(true);}}
     className="w-full text-error sm:w-auto">Remove</Button>
   </div>)}
  </div>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
   <Button variant="secondary" type="button" disabled={pending||rows.length>=100}
    
    onClick={async()=>{setRows(current=>[...current,{id:crypto.randomUUID(),skill:"",proficiency:""}]);
     setSearch(current=>facultyProfileSearchAfterInsertion(current));setChanged(true);}}>
    Add skill
   </Button>
   {changed?<Button variant="secondary" type="button" disabled={pending} onClick={async()=>{
     if(!(await askConfirm("Discard unsaved skill edits and restore saved skills?")))return;
     setRows(restoreFacultySkills(initial));setChanged(false);
    }} >Discard unsaved skill edits</Button>:null}
   {changed&&skillsIssue?<Alert tone="error">Review Skills: {skillsIssue}</Alert>:null}
   <Button variant="primary" type="submit" disabled={pending||!changed||Boolean(skillsIssue)}
    className="w-full sm:ml-auto sm:w-auto">
    {pending?"Saving…":"Save skills"}
   </Button>
  </div>
 {dialog}
 </form>;
}
