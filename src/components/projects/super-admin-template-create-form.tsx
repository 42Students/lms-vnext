"use client";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {initialSuperAdminTemplateDraft} from "@/modules/projects/super-admin-template-create-model";
import {projectMutation} from "@/components/projects/project-api";

export function SuperAdminTemplateCreateForm(){
 const router=useRouter();
 const {showToast}=useToast();
 const savingRef=useRef(false);
 const [values,setValues]=useState({slug:"",title:"",summary:"",summaryOverrideReason:"",goal:"",release:"Release 1",sprint:"Sprint 1",task:"",priority:"MEDIUM",acceptanceCriteria:"",releaseDescription:"",sprintDescription:"",taskDescription:"",overviewDescription:"",resourceTitle:"",resourceUrl:"",deliverables:"",definitionOfDone:"",personas:"",courseLabel:"",phase:"",submissionType:"LINK",submissionInstructions:""});
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const initialValues={slug:"",title:"",summary:"",summaryOverrideReason:"",
  goal:"",release:"Release 1",sprint:"Sprint 1",task:"",priority:"MEDIUM",
  acceptanceCriteria:"",releaseDescription:"",sprintDescription:"",
  taskDescription:"",overviewDescription:"",resourceTitle:"",resourceUrl:"",
  deliverables:"",definitionOfDone:"",personas:"",courseLabel:"",
  phase:"",submissionType:"LINK",submissionInstructions:""};
 const dirty=JSON.stringify(values)!==JSON.stringify(initialValues);
 const guard=useProjectEditorDiscardGuard(true,dirty,saving,
  ()=>router.push("/admin/projects/templates"));
 const edit=(key:keyof typeof values,value:string)=>setValues(old=>({...old,[key]:value}));
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(savingRef.current)return;
  const title=values.title.trim(),slug=values.slug.trim();
  if(!title){setError("Title is required");return;}
  if(title.length>200){setError("Title must be 200 characters or fewer");return;}
  if(!slug){setError("Template slug is required");return;}
  if(slug.length>80){setError("Slug must be 80 characters or fewer");return;}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){
   setError("Use lowercase letters, numbers, and hyphens only (e.g. project-template).");return;
  }
  if(!values.deliverables.split("\n").some(line=>line.trim())){
   setError("Add at least one deliverable.");return;
  }
  savingRef.current=true;setError("");setSaving(true);
  try{
   const payload=initialSuperAdminTemplateDraft(values);
   const result=await projectMutation("/api/projects/templates","POST",payload) as {template:{id:string}};
   showToast({tone:"success",title:"Template created"});
   router.push("/admin/projects/templates/"+encodeURIComponent(result.template.id)+"/overview");
   router.refresh();
  }catch(caught){
   const message=caught instanceof Error?caught.message:"Failed to create template";
   setError(message);
   showToast({tone:"error",title:"Failed to create template",description:message});
  }finally{savingRef.current=false;setSaving(false);}
 }
 const fields=[
  {key:"title",label:"Template title",limit:200,required:true},
  {key:"slug",label:"Slug",limit:80,required:true},
  {key:"release",label:"First release",limit:200,required:true},
  {key:"sprint",label:"First sprint",limit:200,required:true},
  {key:"task",label:"First task",limit:200,required:true},
 ] as const;
 return <form onSubmit={event=>void submit(event)} noValidate className="grid min-w-0 gap-4">
  <p className="m-0 text-sm text-body">The draft starts with one release, one sprint and one task. Review and publish after creation.</p>
  <div className="grid min-w-0 gap-4 md:grid-cols-2">
   {fields.map(field=><label key={field.key} className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
    {field.label}<Input required={field.required} maxLength={field.limit} disabled={saving}
     value={values[field.key]} onChange={event=>edit(field.key,field.key==="slug"?event.target.value.toLowerCase():event.target.value)}
     pattern={field.key==="slug"?"[a-z0-9]+(?:-[a-z0-9]+)*":undefined}
     aria-describedby={field.key==="slug"?"template-slug-hint":field.key==="title"?"template-title-hint":undefined}
     className="w-full"/>
    {field.key==="slug"?<span id="template-slug-hint" className="text-xs text-muted-foreground">80 characters maximum; lowercase letters, numbers and hyphens only.</span>:
     field.key==="title"?<span id="template-title-hint" className="text-xs text-muted-foreground">200 characters maximum.</span>:null}
   </label>)}
  </div>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Custom summary (optional)
   <Textarea maxLength={160} disabled={saving} value={values.summary} onChange={event=>edit("summary",event.target.value)}
    className="w-full"/>
   <span className="text-xs font-normal text-muted-foreground">Defaults to the first Goal line or title (160 characters).</span>
  </label>
  {values.summary.trim()?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason for custom summary
   <Input maxLength={300} disabled={saving} value={values.summaryOverrideReason}
    onChange={event=>edit("summaryOverrideReason",event.target.value)}
    placeholder="Why does this need a different summary?"/>
  </label>:null}
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Goal (optional)
   <Textarea maxLength={2000} disabled={saving} value={values.goal} onChange={event=>edit("goal",event.target.value)}
    className="w-full"/>
  </label>
  <details className="min-w-0 border-y border-border py-3">
   <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Overview and submission</summary>
   <fieldset className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
    <legend className="sr-only">Overview and submission</legend>
    {([{key:"courseLabel",label:"Course label"},{key:"phase",label:"Phase"}] as const)
      .map(item=><label key={item.key} className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{item.label}
       <Input maxLength={160} disabled={saving} value={values[item.key]}
        onChange={e=>edit(item.key,e.target.value)}
        className="w-full"/></label>)}
    {([{key:"deliverables",label:"Deliverables (one per line)"},
       {key:"definitionOfDone",label:"Definition of done (one per line)"},
       {key:"personas",label:"Personas (one per line)"},
       {key:"submissionInstructions",label:"Submission instructions"}] as const).map(item=>
      <label key={item.key} className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">
       {item.label}
       <Textarea value={values[item.key]} onChange={e=>edit(item.key,e.target.value)}
        maxLength={4000} disabled={saving}
        className="w-full"/>
      </label>)}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Submission type
      <Select disabled={saving} value={values.submissionType}
       onChange={e=>edit("submissionType",e.target.value)}
       className="w-full">
       <option value="LINK">Link</option><option value="FILE">File upload</option>
       <option value="TEXT">Text</option>
      </Select>
    </label>
   </fieldset>
  </details>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First task priority
   <Select disabled={saving} value={values.priority} onChange={event=>edit("priority",event.target.value)} className="w-full">
    <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
   </Select>
  </label>
  <details className="min-w-0 border-y border-border py-3">
   <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Additional descriptions</summary>
   <div className="mt-3 grid min-w-0 gap-4">
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First task acceptance criteria (optional)
   <Textarea maxLength={4000} disabled={saving} value={values.acceptanceCriteria} onChange={event=>edit("acceptanceCriteria",event.target.value)} className="w-full"/>
  </label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First release description (optional)
   <Textarea maxLength={4000} disabled={saving} value={values.releaseDescription} onChange={event=>edit("releaseDescription",event.target.value)} className="w-full"/>
  </label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First sprint description (optional)
   <Textarea maxLength={4000} disabled={saving} value={values.sprintDescription} onChange={event=>edit("sprintDescription",event.target.value)} className="w-full"/>
  </label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First task description (optional)
   <Textarea maxLength={4000} disabled={saving} value={values.taskDescription} onChange={event=>edit("taskDescription",event.target.value)} className="w-full"/>
  </label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Overview description (optional)
   <Textarea maxLength={4000} disabled={saving} value={values.overviewDescription} onChange={event=>edit("overviewDescription",event.target.value)} className="w-full"/>
  </label>
   </div>
  </details>
  <details className="min-w-0 border-y border-border py-3">
   <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Starting resource link (optional)</summary>
   <fieldset className="mt-3 min-w-0 space-y-3">
   <legend className="sr-only">Starting resource link (optional)</legend>
   <p className="text-xs text-muted-foreground">Add a public HTTP(S) resource. Both title and URL are required when adding one.</p>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Resource title
    <Input maxLength={200} disabled={saving} value={values.resourceTitle} onChange={event=>edit("resourceTitle",event.target.value)} className="w-full"/>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Resource URL
    <Input type="url" maxLength={2048} disabled={saving} value={values.resourceUrl} onChange={event=>edit("resourceUrl",event.target.value)} className="w-full"/>
   </label>
   </fieldset>
  </details>
  {error?<Banner tone="error">{error}</Banner>:null}
  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
   <Button type="button" variant="secondary" disabled={saving} onClick={guard.requestClose}>Cancel</Button>
   <Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" type="submit" disabled={saving} >{saving?"Creating…":"Create draft template"}</Button>
  </div>
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
   title="Discard unsaved changes?"
   description="You have unsaved changes. Leave without saving them?"
   confirmLabel="Discard changes" pending={saving}
   onConfirm={guard.confirmDiscard}/>
 </form>;
}
