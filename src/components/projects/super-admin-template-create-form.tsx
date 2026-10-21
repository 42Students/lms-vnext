"use client";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {initialSuperAdminTemplateDraft} from "@/modules/projects/super-admin-template-create-model";
import {projectMutation} from "@/components/projects/project-api";

export function SuperAdminTemplateCreateForm(){
 const router=useRouter();
 const [values,setValues]=useState({slug:"",title:"",summary:"",goal:"",release:"Release 1",sprint:"Sprint 1",task:"",priority:"MEDIUM",acceptanceCriteria:"",releaseDescription:"",sprintDescription:"",taskDescription:"",overviewDescription:"",resourceTitle:"",resourceUrl:"",deliverables:"",definitionOfDone:"",personas:"",courseLabel:"",phase:"",submissionType:"LINK",submissionInstructions:""});
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const edit=(key:keyof typeof values,value:string)=>setValues(old=>({...old,[key]:value}));
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pendingRef.current)return;
  setError("");
  if(!values.title.trim()){setError("Title is required");return;}
  if(values.title.trim().length>200){setError("Title must be 200 characters or fewer");return;}
  if(!values.slug.trim()){setError("Template slug is required");return;}
  if(values.slug.length>80){setError("Slug must be 80 characters or fewer");return;}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)){
   setError("Use lowercase letters, numbers, and hyphens only (e.g. project-template).");return;
  }
  if(!lines(values.deliverables).length){setError("Add at least one deliverable.");return;}
  if(releases.some(x=>!x.title.trim())||sprints.some(x=>!x.title.trim())||
     tasks.some(x=>!x.title.trim())||resources.some(x=>!x.title.trim())){
    setError("Every added release, sprint, task and resource needs a title.");return;
  }
  pendingRef.current=true;setSaving(true);
  try{
   const payload=initialSuperAdminTemplateDraft(values);
   const result=await projectMutation("/api/projects/templates","POST",payload) as {template:{id:string}};
   router.push("/admin/projects/templates/"+encodeURIComponent(result.template.id));
   router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Template creation failed.");
  }finally{setSaving(false);}
 }
 return <form onSubmit={event=>void submit(event)}
  className="grid min-w-0 gap-5" noValidate>
  <p className="text-sm text-body">Create a versioned template with editable
   sprints, tasks and resources. Review it before publishing.</p>
  <div className="grid gap-4 md:grid-cols-2">
   <label className={label}>Template title
    <Input className={field} required maxLength={200} disabled={saving}
     value={values.title} onChange={event=>edit("title",event.target.value)}/>
   </label>
   <label className={label}>Slug
    <Input className={field} required maxLength={80} disabled={saving}
     value={values.slug} onChange={event=>edit("slug",event.target.value.toLowerCase())}/>
    <span className="mt-1 block text-xs font-normal text-body">
     Use lowercase letters, numbers, and hyphens only (e.g. project-template).
    </span>
   </label>
  </div>
  <div className="grid gap-3 md:grid-cols-2">
   <label className={label}>Template lifecycle
    <Select className={field} value={requestedLifecycle} disabled={saving}
     onChange={e=>setRequestedLifecycle(e.target.value)}>
     <option value="DRAFT">Draft</option>
     <option value="PUBLISHED" disabled>Published — review draft then publish</option>
     <option value="ARCHIVED" disabled>Archived — unavailable at creation</option>
    </Select>
   </label>
   <label className={label}>Initial workspace status
    <Select className={field} value={initialWorkspaceStatus} disabled={saving}
     onChange={e=>setInitialWorkspaceStatus(e.target.value)}>
     <option value="ACTIVE">Active</option>
     <option value="PLANNED">In progress (planned)</option>
    </Select>
    <span className="mt-1 block text-xs font-normal text-body">
     Set again when assigning the published template to a workspace.
    </span>
   </label>
  </div>
  <label className={label}>Summary (auto-derived if blank)
   <Textarea className={field} maxLength={2000} disabled={saving}
    value={values.summary} onChange={e=>edit("summary",e.target.value)}/>
  </label>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Content">
   <h2 className="text-base font-semibold">Content</h2>
   <label className={label}>Goal
    <Textarea className={field} rows={3} maxLength={2000} disabled={saving}
     value={values.goal} onChange={e=>edit("goal",e.target.value)}/>
   </label>
   {([
     ["deliverables","Deliverables · one per line (required)"],
     ["definitionOfDone","Definition of done · one per line"],
     ["personas","Personas · one per line"],
   ] as const).map(([key,title])=><label key={key} className={label}>{title}
    <Textarea className={field} rows={3} maxLength={4000} disabled={saving}
     value={values[key]} onChange={e=>edit(key,e.target.value)}/>
   </label>)}
  </div>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Summary (optional)
   <Textarea maxLength={2000} disabled={saving} value={values.summary} onChange={event=>edit("summary",event.target.value)}
    className="w-full"/>
  </label>
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
   <Link href="/admin/projects/templates" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] sm:min-h-9 sm:w-auto border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Cancel</Link>
   <Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" type="submit" disabled={saving} >{saving?"Creating…":"Create draft template"}</Button>
  </div>
 </form>;
}
