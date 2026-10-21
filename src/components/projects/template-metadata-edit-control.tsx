"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";

type Overview={
 goal:string;description:string;deliverables:readonly string[];
 definitionOfDone:readonly string[];personas:readonly string[];
 submissionInstructions:string;
};
export function TemplateMetadataEditControl({templateId,title,summary,currentVersion,updatedAt,
 slug,courseLabel,phase,overview}:{
 templateId:string;title:string;summary:string|null;currentVersion:number;updatedAt:string;
 slug:string;courseLabel:string;phase:string;overview:Overview;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false),[pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [editedTitle,setTitle]=useState(title),[editedSummary,setSummary]=useState(summary??"");
 const [editedSlug,setSlug]=useState(slug),[editedCourse,setCourse]=useState(courseLabel),[editedPhase,setPhase]=useState(phase);
 const [goal,setGoal]=useState(overview.goal),[description,setDescription]=useState(overview.description);
 const [deliverables,setDeliverables]=useState(overview.deliverables.join("\n"));
 const [done,setDone]=useState(overview.definitionOfDone.join("\n"));
 const [personas,setPersonas]=useState(overview.personas.join("\n"));
 const [instructions,setInstructions]=useState(overview.submissionInstructions);
 const [changeNote,setNote]=useState(""),[confirmed,setConfirmed]=useState(false);
 const dirty=editedTitle!==title||editedSummary!==(summary??"")||
  editedSlug!==slug||editedCourse!==courseLabel||editedPhase!==phase||
  goal!==overview.goal||description!==overview.description||
  deliverables!==overview.deliverables.join("\n")||
  done!==overview.definitionOfDone.join("\n")||
  personas!==overview.personas.join("\n")||
  instructions!==overview.submissionInstructions||changeNote.length>0;
 const reset=()=>{
  setOpen(false);setError(null);setConfirmed(false);
  setTitle(title);setSummary(summary??"");setSlug(slug);setCourse(courseLabel);setPhase(phase);
  setGoal(overview.goal);setDescription(overview.description);
  setDeliverables(overview.deliverables.join("\n"));setDone(overview.definitionOfDone.join("\n"));
  setPersonas(overview.personas.join("\n"));setInstructions(overview.submissionInstructions);setNote("");
 };
 const guard=useProjectEditorDiscardGuard(open,dirty,pending,reset);
 const lines=(value:string)=>value.split(/\r?\n/).map(part=>part.trim()).filter(Boolean);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||!confirmed)return;
  if(!editedTitle.trim()){setError("Title required");return;}
  if(!editedSlug.trim()){setError("Template slug is required");return;}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(editedSlug)||editedSlug.length>80){
   setError("Template slug must use lowercase letters, numbers and single hyphens (max 80).");return;
  }
  if(editedCourse.length>160||editedPhase.length>80){
   setError("Course label must be at most 160 characters and phase at most 80.");return;
  }
  for(const [label,value]of [["Deliverables",deliverables],["Done when",done],["Personas",personas]]){
   if(lines(value).length>50||lines(value).some(line=>line.length>500)){
    setError(label+" may contain up to 50 rows, each at most 500 characters.");return;
   }
  }
  setPending(true);setError(null);
  try{
   const receipt=await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId)+"/metadata","PATCH",{
    title:editedTitle.trim(),summary:editedSummary.trim()||goal.trim().slice(0,2000),changeNote,
    slug:editedSlug.trim(),courseLabel:editedCourse.trim(),phase:editedPhase.trim(),
    overview:{goal:goal.trim(),description:description.trim(),deliverables:lines(deliverables),
     definitionOfDone:lines(done),personas:lines(personas),submissionInstructions:instructions.trim()},
    expectedCurrentVersion:currentVersion,expectedUpdatedAt:updatedAt,
   });
   if(!receipt||typeof receipt!=="object"||!("template" in receipt))
    throw new Error("The saved template version could not be confirmed.");
   showToast({tone:"success",title:"Overview saved"});
   reset();router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Failed to update overview");
  }finally{setPending(false);}
 }
 return <>
  <Button size="sm" variant="secondary" onClick={()=>{reset();setOpen(true);}} className="min-h-11 md:min-h-9">Edit Overview</Button>
  <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}
   title="Edit Overview" description="Save overview creates a new immutable template version. Existing workspace copies remain unchanged. If summary is blank, it is derived from the goal.">
   <form onSubmit={submit} className="grid min-w-0 gap-3">
    <label className="grid gap-1 text-sm font-semibold">Template slug
     <Input required maxLength={80} value={editedSlug} disabled={pending} onChange={e=>setSlug(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Title
     <Input required maxLength={200} value={editedTitle} disabled={pending} onChange={e=>setTitle(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Summary (optional; otherwise uses Goal)
     <Textarea maxLength={2000} value={editedSummary} disabled={pending} onChange={e=>setSummary(e.target.value)}/>
    </label>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="grid gap-1 text-sm font-semibold">Course label
      <Input maxLength={160} disabled={pending} value={editedCourse} onChange={e=>setCourse(e.target.value)}/>
     </label>
     <label className="grid gap-1 text-sm font-semibold">Phase
      <Input maxLength={80} disabled={pending} value={editedPhase} onChange={e=>setPhase(e.target.value)}/>
     </label>
    </div>
    <label className="grid gap-1 text-sm font-semibold">Goal
     <Textarea maxLength={2000} disabled={pending} value={goal} onChange={e=>setGoal(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Description
     <Textarea maxLength={4000} disabled={pending} value={description} onChange={e=>setDescription(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Deliverables (one per line)
     <Textarea disabled={pending} value={deliverables} onChange={e=>setDeliverables(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Done when (one per line)
     <Textarea disabled={pending} value={done} onChange={e=>setDone(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Personas (one per line)
     <Textarea disabled={pending} value={personas} onChange={e=>setPersonas(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Submission instructions
     <Textarea maxLength={4000} disabled={pending} value={instructions} onChange={e=>setInstructions(e.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Change note
     <Textarea required maxLength={1000} disabled={pending} value={changeNote} onChange={e=>setNote(e.target.value)}/>
    </label>
    <label className="flex items-start gap-2 text-sm"><Checkbox checked={confirmed}
     disabled={pending} onChange={e=>setConfirmed(e.target.checked)}/>
     Create a new version, preserving existing workspace snapshots
    </label>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex flex-wrap justify-end gap-2">
     <Button type="button" variant="secondary" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
     <Button type="submit" loading={pending} disabled={pending||!confirmed||!changeNote.trim()||!dirty}>Save Overview</Button>
    </div>
   </form>
  </Dialog>
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
   title="Discard unsaved overview changes?" description="Your unsaved template changes will be lost."
   confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
 </>;
}
