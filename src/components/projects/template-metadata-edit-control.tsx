"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {projectTemplateBlueprintSchema,type ProjectTemplateBlueprint}
 from "@/modules/projects/validation";
import {projectMutation} from "./project-api";
type Props={
 templateId:string;title:string;summary:string|null;currentVersion:number;updatedAt:string;
 slug:string;blueprint:ProjectTemplateBlueprint;
};
type Fields={
 title:string;summary:string;goal:string;description:string;courseLabel:string;
 phase:string;deliverables:string;definitionOfDone:string;personas:string;
 submissionType:string;submissionInstructions:string;
};
function fromProps(p:Props):Fields{
 const overview=p.blueprint.overview;
 return {
  title:p.title,summary:p.summary??"",goal:overview.goal??"",
  description:overview.description??"",courseLabel:overview.courseLabel??"",
  phase:overview.phase??"",deliverables:overview.deliverables.join("\n"),
  definitionOfDone:(overview.definitionOfDone??[]).join("\n"),
  personas:(overview.personas??[]).join("\n"),
  submissionType:overview.submissionType??"LINK",
  submissionInstructions:overview.submissionInstructions??"",
 };
}
const split=(s:string)=>s.split(/\r?\n/).map(row=>row.trim()).filter(Boolean);
export function TemplateMetadataEditControl(props:Props){
 const router=useRouter(),{showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [pending,setPending]=useState(false);
 const [values,setValues]=useState<Fields>(()=>fromProps(props));
 const [changeNote,setChangeNote]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const [error,setError]=useState("");
 const [stale,setStale]=useState(false);
 const version=useRef(props.currentVersion);
 const baseline=useRef(fromProps(props));
 const dirty=JSON.stringify(values)!==JSON.stringify(baseline.current);
 const reset=()=>{
  setValues(fromProps(props));baseline.current=fromProps(props);
  version.current=props.currentVersion;setChangeNote("");
  setConfirmed(false);setError("");setStale(false);setOpen(false);
 };
 const guard=useProjectEditorDiscardGuard(open,dirty,pending,reset);
 useEffect(()=>{
  const changed=props.currentVersion!==version.current;
  if(!changed)return;
  if(open&&dirty){setStale(true);return;}
  baseline.current=fromProps(props);
  version.current=props.currentVersion;
  setValues(fromProps(props));setStale(false);setError("");
 },[props.currentVersion,open,dirty]);
 useEffect(()=>{
  window.dispatchEvent(new CustomEvent("project-template-editor-dirty",{
    detail:{templateId:props.templateId,dirty:open&&dirty},
  }));
  return()=>{
   window.dispatchEvent(new CustomEvent("project-template-editor-dirty",{
     detail:{templateId:props.templateId,dirty:false},
   }));
  };
 },[props.templateId,open,dirty]);
 const edit=(key:keyof Fields,value:string)=>setValues(old=>({...old,[key]:value}));
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||!confirmed)return;
  if(!dirty){showToast({tone:"info",title:"No changes to save"});return;}
  if(stale||props.currentVersion!==version.current){
   setError("This template version changed. Refresh the comparison before saving.");return;
  }
  if(!values.title.trim()){setError("Title is required");return;}
  if(values.title.trim().length>200){
   setError("Title must be 200 characters or fewer");return;
  }
  const base=props.blueprint.overview;
  const overview:ProjectTemplateBlueprint["overview"]={
   ...base,
   goal:values.goal.trim()||undefined,
   description:values.description.trim()||undefined,
   courseLabel:values.courseLabel.trim()||undefined,
   phase:values.phase.trim()||undefined,
   deliverables:split(values.deliverables),
   definitionOfDone:split(values.definitionOfDone),
   personas:split(values.personas),
   submissionType:values.submissionType as "LINK"|"FILE"|"TEXT",
   submissionInstructions:values.submissionInstructions.trim()||undefined,
  };
  const validated=projectTemplateBlueprintSchema.safeParse({
   ...props.blueprint,overview,
  });
  if(!validated.success){
   const issue=validated.error.issues[0];
   setError((issue?.path.join(".")||"Overview")+": "+(issue?.message??"Invalid values"));
   return;
  }
  setPending(true);setError("");
  try{
   const result=await projectMutation(
    "/api/projects/templates/"+encodeURIComponent(props.templateId),"PATCH",{
     expectedVersion:version.current,
     title:values.title.trim(),
     summary:values.summary.trim()||undefined,
     blueprint:validated.data,
     changeNote:changeNote.trim()||"Updated template overview",
    }) as {template:{currentVersion:number}};
   version.current=result.template.currentVersion;
   baseline.current={...values};
   setChangeNote("");setConfirmed(false);setOpen(false);
   showToast({tone:"success",title:"Overview saved",
    description:"Version "+result.template.currentVersion+" created; published workspaces remain pinned."});
   router.refresh();
  }catch(caught){
   const detail=caught instanceof Error?caught.message:"Failed to save overview";
   setError(detail);
   showToast({tone:"error",title:"Failed to save overview",description:detail});
  }finally{setPending(false);}
 }
 return <>
  <Button type="button" size="sm" variant="secondary" onClick={()=>{
   setValues(fromProps(props));baseline.current=fromProps(props);
   version.current=props.currentVersion;setChangeNote("");
   setConfirmed(false);setError("");setStale(false);setOpen(true);
  }}>Edit draft overview</Button>
  <Dialog open={open} onOpenChange={next=>{
    if(pending)return;if(next)setOpen(true);else guard.requestClose();
   }} title="Edit template overview" dismissible={!pending}
   description="Save creates an immutable template version; assigned workspaces retain their pinned version.">
   <form onSubmit={event=>void submit(event)} className="grid min-w-0 gap-3">
    <label className="grid gap-1 text-sm font-semibold text-body">Title
     <Input required maxLength={200} disabled={pending} value={values.title}
      onChange={event=>edit("title",event.target.value)}/></label>
    <label className="grid gap-1 text-sm font-semibold text-body">Template slug
     <Input value={props.slug} disabled aria-label="Immutable template slug"/>
     <span className="text-xs font-normal text-body">
      Slugs are stable identifiers. Duplicate the template to use a new slug.
     </span>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Summary
     <Textarea maxLength={2000} disabled={pending} value={values.summary}
      onChange={event=>edit("summary",event.target.value)}/></label>
    <div className="grid gap-3 md:grid-cols-2">
     <label className="grid gap-1 text-sm font-semibold text-body">Course label
      <Input maxLength={160} disabled={pending} value={values.courseLabel}
       onChange={event=>edit("courseLabel",event.target.value)}/></label>
     <label className="grid gap-1 text-sm font-semibold text-body">Phase
      <Input maxLength={120} disabled={pending} value={values.phase}
       onChange={event=>edit("phase",event.target.value)}/></label>
    </div>
    <label className="grid gap-1 text-sm font-semibold text-body">Project goal
     <Textarea maxLength={2000} disabled={pending} value={values.goal}
      onChange={event=>edit("goal",event.target.value)}/></label>
    <label className="grid gap-1 text-sm font-semibold text-body">Overview description
     <Textarea maxLength={4000} disabled={pending} value={values.description}
      onChange={event=>edit("description",event.target.value)}/></label>
    {([
     ["deliverables","Deliverables (one per line)"],
     ["definitionOfDone","Definition of done (one per line)"],
     ["personas","Personas (one per line)"],
    ] as const).map(([key,label])=><label key={key}
      className="grid gap-1 text-sm font-semibold text-body">{label}
      <Textarea rows={3} disabled={pending} value={values[key]}
       onChange={event=>edit(key,event.target.value)}/>
    </label>)}
    <div className="grid gap-3 md:grid-cols-2">
     <label className="grid gap-1 text-sm font-semibold text-body">Submission type
      <Select disabled={pending} value={values.submissionType}
       onChange={event=>edit("submissionType",event.target.value)}>
       <option value="LINK">Link</option><option value="FILE">File</option>
       <option value="TEXT">Text</option>
      </Select></label>
     <label className="grid gap-1 text-sm font-semibold text-body">Change note
      <Input maxLength={1000} disabled={pending} value={changeNote}
       placeholder="Updated template overview"
       onChange={event=>setChangeNote(event.target.value)}/></label>
    </div>
    <label className="grid gap-1 text-sm font-semibold text-body">Submission instructions
     <Textarea maxLength={4000} disabled={pending}
      value={values.submissionInstructions}
      onChange={event=>edit("submissionInstructions",event.target.value)}/></label>
    <label className="flex items-start gap-2 text-sm text-body">
     <Checkbox checked={confirmed} disabled={pending}
      onChange={event=>setConfirmed(event.target.checked)}/>
     I understand that this creates a new version without changing already-created workspaces.
    </label>
    {stale?<p role="alert" className="text-sm text-warning-text">
     Another version was saved while you were editing. Refresh to avoid overwriting it.
    </p>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
     <Button type="button" variant="secondary" disabled={pending}
      onClick={guard.requestClose}>Cancel</Button>
     <Button type="submit" disabled={pending||!confirmed||stale}
      loading={pending}>{pending?"Saving…":"Save overview"}</Button>
    </div>
   </form>
  </Dialog>
  <ConfirmDialog open={guard.discardOpen}
   onOpenChange={guard.setDiscardOpen}
   title="Discard unsaved changes?"
   description="You have unsaved changes. Leave without saving them?"
   confirmLabel="Discard changes" pending={pending}
   onConfirm={guard.confirmDiscard}/>
 </>;
}
