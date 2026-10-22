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
import {legacyUntitledTemplateRowError} from "@/modules/projects/template-row-validation-model";
import {initialSuperAdminTemplateDraft,type TemplateCreateRelease,
 type TemplateCreateSprint,type TemplateCreateTask,type TemplateCreateResource
} from "@/modules/projects/super-admin-template-create-model";
import {projectMutation} from "@/components/projects/project-api";

function move<T>(list:readonly T[],index:number,step:-1|1):T[]{
 const dest=index+step;if(dest<0||dest>=list.length)return [...list];
 const rows=[...list];[rows[index],rows[dest]]=[rows[dest]!,rows[index]!];
 return rows;
}
function nextKey(items:readonly {key:string}[],prefix:string){
 const existing=new Set(items.map(row=>row.key));
 let next=2;while(existing.has(prefix+"-"+next))next++;
 return prefix+"-"+next;
}
export function SuperAdminTemplateCreateForm(){
 const router=useRouter();
 const {showToast}=useToast();
 const savingRef=useRef(false);
 const [values,setValues]=useState({slug:"",title:"",summary:"",summaryOverrideReason:"",goal:"",release:"Release 1",sprint:"Sprint 1",task:"",priority:"MEDIUM",acceptanceCriteria:"",releaseDescription:"",sprintDescription:"",taskDescription:"",overviewDescription:"",resourceTitle:"",resourceUrl:"",deliverables:"",definitionOfDone:"",personas:"",courseLabel:"",phase:"",submissionType:"LINK",submissionInstructions:""});
 const [releases,setReleases]=useState<TemplateCreateRelease[]>([]);
 const [sprints,setSprints]=useState<TemplateCreateSprint[]>([]);
 const [tasks,setTasks]=useState<TemplateCreateTask[]>([]);
 const [resources,setResources]=useState<TemplateCreateResource[]>([]);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const initialValues={slug:"",title:"",summary:"",summaryOverrideReason:"",
  goal:"",release:"Release 1",sprint:"Sprint 1",task:"",priority:"MEDIUM",
  acceptanceCriteria:"",releaseDescription:"",sprintDescription:"",
  taskDescription:"",overviewDescription:"",resourceTitle:"",resourceUrl:"",
  deliverables:"",definitionOfDone:"",personas:"",courseLabel:"",
  phase:"",submissionType:"LINK",submissionInstructions:""};
 const dirty=JSON.stringify([values,releases,sprints,tasks,resources])!==
  JSON.stringify([initialValues,[],[],[],[]]);
 const guard=useProjectEditorDiscardGuard(true,dirty,saving,
  ()=>router.push("/admin/projects/templates"));
 const edit=(key:keyof typeof values,value:string)=>setValues(old=>({...old,[key]:value}));
 const patchRelease=(i:number,patch:Partial<TemplateCreateRelease>)=>
  setReleases(rows=>rows.map((row,index)=>index===i?{...row,...patch}:row));
 const patchSprint=(i:number,patch:Partial<TemplateCreateSprint>)=>
  setSprints(rows=>rows.map((row,index)=>index===i?{...row,...patch}:row));
 const patchTask=(i:number,patch:Partial<TemplateCreateTask>)=>
  setTasks(rows=>rows.map((row,index)=>index===i?{...row,...patch}:row));
 const patchResource=(i:number,patch:Partial<TemplateCreateResource>)=>
  setResources(rows=>rows.map((row,index)=>index===i?{...row,...patch}:row));
 const allReleases:TemplateCreateRelease[]=[
  {key:"release-1",title:values.release,description:values.releaseDescription},...releases];
 const allSprints:TemplateCreateSprint[]=[
  {key:"sprint-1",releaseKey:"release-1",title:values.sprint,
   description:values.sprintDescription,goal:"",dueLabel:""},...sprints];
 const allTasks:TemplateCreateTask[]=[
  {key:"task-1",sprintKey:"sprint-1",title:values.task,
   description:values.taskDescription,
   acceptanceCriteria:values.acceptanceCriteria,
   priority:values.priority as TemplateCreateTask["priority"]},...tasks];
 const allResources:TemplateCreateResource[]=[
  ...(values.resourceTitle.trim()||values.resourceUrl.trim()?[{
    key:"resource-1",title:values.resourceTitle,url:values.resourceUrl,description:"",
   }]:[]),...resources];
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
  if(allTasks.length>500||allResources.length>500){
    setError("Maximum 500 items. Remove an item before saving.");return;
  }
  const rowError=legacyUntitledTemplateRowError([
    allReleases,allSprints,allTasks,allResources,
  ]);
  if(rowError){setError(rowError);return;}
  for(const rows of [allReleases,allSprints,allTasks,allResources]){
    if(new Set(rows.map(row=>row.key.toLowerCase())).size!==rows.length){
      setError("Keys within each section must be unique.");return;
    }
  }
  savingRef.current=true;setError("");setSaving(true);
  try{
   const payload=initialSuperAdminTemplateDraft({
     ...values,releases:allReleases,sprints:allSprints,tasks:allTasks,resources:allResources,
   });
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
   <Textarea rows={3} maxLength={2000} disabled={saving} value={values.goal} onChange={event=>edit("goal",event.target.value)}
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
       <Textarea rows={3} value={values[item.key]} onChange={e=>edit(item.key,e.target.value)}
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
  <section className="space-y-3 border-t border-border pt-4" aria-label="Additional releases">
   <h2 className="text-base font-semibold">Releases</h2>
   {!releases.length?<p className="text-sm text-body">No additional releases yet.</p>:null}
   {releases.map((row,index)=><fieldset key={row.key} disabled={saving} className="space-y-2 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Release {index+2}</legend>
    <label className="block text-sm font-semibold">Title
     <Input value={row.title} maxLength={200} onChange={e=>patchRelease(index,{title:e.target.value})}/>
    </label>
    <label className="block text-sm font-semibold">Description
     <Textarea value={row.description} maxLength={4000} onChange={e=>patchRelease(index,{description:e.target.value})}/>
    </label>
    <p className="text-xs text-body">Key: {row.key}</p>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="secondary" size="sm" disabled={index===0}
      onClick={()=>setReleases(v=>move(v,index,-1))}>Move up</Button>
     <Button type="button" variant="secondary" size="sm" disabled={index===releases.length-1}
      onClick={()=>setReleases(v=>move(v,index,1))}>Move down</Button>
     <Button type="button" variant="ghost" size="sm" onClick={()=>{
      if(sprints.some(item=>item.releaseKey===row.key)){
       setError("Move linked sprints before removing this release.");return;
      }
      setReleases(v=>v.filter((_,i)=>i!==index));
     }}>Remove</Button>
    </div>
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary" disabled={saving||allReleases.length>=50}
    onClick={()=>setReleases(v=>[...v,{
      key:nextKey(allReleases,"release"),title:"",description:"",
    }])}>Add release</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Additional sprints">
   <h2 className="text-base font-semibold">Sprints</h2>
   {!sprints.length?<p className="text-sm text-body">No additional sprints yet.</p>:null}
   {sprints.map((row,index)=><fieldset key={row.key} disabled={saving} className="space-y-2 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Sprint {index+2}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className="text-sm font-semibold">Title
      <Input value={row.title} maxLength={200} onChange={e=>patchSprint(index,{title:e.target.value})}/>
     </label>
     <label className="text-sm font-semibold">Release
      <Select value={row.releaseKey} onChange={e=>patchSprint(index,{releaseKey:e.target.value})}>
       {allReleases.map(item=><option key={item.key} value={item.key}>{item.title||item.key}</option>)}
      </Select>
     </label>
    </div>
    <label className="block text-sm font-semibold">Due label
     <Input value={row.dueLabel} maxLength={160} onChange={e=>patchSprint(index,{dueLabel:e.target.value})}/>
    </label>
    <label className="block text-sm font-semibold">Sprint goal
     <Textarea value={row.goal} maxLength={1000}
      onChange={e=>patchSprint(index,{goal:e.target.value})}/>
    </label>
    <label className="block text-sm font-semibold">Description
     <Textarea value={row.description} maxLength={4000} onChange={e=>patchSprint(index,{description:e.target.value})}/>
    </label>
    <p className="text-xs text-body">Key: {row.key}</p>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="secondary" size="sm" disabled={index===0}
      onClick={()=>setSprints(v=>move(v,index,-1))}>Move up</Button>
     <Button type="button" variant="secondary" size="sm" disabled={index===sprints.length-1}
      onClick={()=>setSprints(v=>move(v,index,1))}>Move down</Button>
     <Button type="button" variant="ghost" size="sm" onClick={()=>{
      if(tasks.some(item=>item.sprintKey===row.key)){
       setError("Move linked tasks before removing this sprint.");return;
      }
      setSprints(v=>v.filter((_,i)=>i!==index));
     }}>Remove</Button>
    </div>
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary" disabled={saving||allSprints.length>=200}
    onClick={()=>setSprints(v=>[...v,{
      key:nextKey(allSprints,"sprint"),releaseKey:"release-1",title:"",description:"",goal:"",dueLabel:"",
    }])}>Add sprint</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Additional tasks">
   <h2 className="text-base font-semibold">Tasks</h2>
   {!tasks.length?<p className="text-sm text-body">No additional tasks yet.</p>:null}
   {tasks.map((row,index)=><fieldset key={row.key} disabled={saving} className="space-y-2 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Task {index+2}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className="text-sm font-semibold">Title
      <Input value={row.title} maxLength={200} onChange={e=>patchTask(index,{title:e.target.value})}/>
     </label>
     <label className="text-sm font-semibold">Sprint
      <Select value={row.sprintKey??""} onChange={e=>patchTask(index,{sprintKey:e.target.value||null})}>
       <option value="">Backlog (no sprint)</option>
       {allSprints.map(item=><option key={item.key} value={item.key}>{item.title||item.key}</option>)}
      </Select>
     </label>
     <label className="text-sm font-semibold">Priority
      <Select value={row.priority} onChange={e=>patchTask(index,{
       priority:e.target.value as TemplateCreateTask["priority"]})}>
       <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
       <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
      </Select>
     </label>
     <label className="text-sm font-semibold">Task type
      <Select value={row.taskType??"STORY"} onChange={e=>patchTask(index,{
       taskType:e.target.value as NonNullable<TemplateCreateTask["taskType"]>})}>
       <option value="STORY">Story</option><option value="BUG">Bug</option>
       <option value="CHORE">Chore</option><option value="SPIKE">Spike</option>
      </Select>
     </label>
     <label className="text-sm font-semibold">Due label
      <Input value={row.dueLabel??""} maxLength={160}
       onChange={e=>patchTask(index,{dueLabel:e.target.value})}/>
     </label>
    </div>
    <label className="block text-sm font-semibold">Description
     <Textarea value={row.description} maxLength={4000} onChange={e=>patchTask(index,{description:e.target.value})}/>
    </label>
    <label className="block text-sm font-semibold">Acceptance criteria
     <Textarea value={row.acceptanceCriteria} maxLength={4000}
      onChange={e=>patchTask(index,{acceptanceCriteria:e.target.value})}/>
    </label>
    <label className="block text-sm font-semibold">Approach
     <Textarea value={row.approach??""} maxLength={4000}
      onChange={e=>patchTask(index,{approach:e.target.value})}/>
    </label>
    <p className="text-xs text-body">Key: {row.key}</p>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="secondary" size="sm" disabled={index===0}
      onClick={()=>setTasks(v=>move(v,index,-1))}>Move up</Button>
     <Button type="button" variant="secondary" size="sm" disabled={index===tasks.length-1}
      onClick={()=>setTasks(v=>move(v,index,1))}>Move down</Button>
     <Button type="button" variant="ghost" size="sm"
      onClick={()=>setTasks(v=>v.filter((_,i)=>i!==index))}>Remove</Button>
    </div>
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary" disabled={saving||allTasks.length>=500}
    onClick={()=>setTasks(v=>[...v,{
      key:nextKey(allTasks,"task"),sprintKey:"sprint-1",title:"",priority:"MEDIUM",
      description:"",acceptanceCriteria:"",
    }])}>Add task</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Additional resources">
   <h2 className="text-base font-semibold">Resources</h2>
   {!resources.length?<p className="text-sm text-body">No additional resources yet.</p>:null}
   {resources.map((row,index)=><fieldset key={row.key} disabled={saving} className="space-y-2 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Resource {index+2}</legend>
    <label className="block text-sm font-semibold">Title
     <Input value={row.title} maxLength={200} onChange={e=>patchResource(index,{title:e.target.value})}/>
    </label>
    <label className="block text-sm font-semibold">Resource type
     <Select value={row.type??"LINK"} onChange={e=>patchResource(index,{
      type:e.target.value as NonNullable<TemplateCreateResource["type"]>})}>
      <option value="LINK">Link</option><option value="PDF">PDF</option>
      <option value="DOCUMENT">Document</option><option value="SLIDES">Slides</option>
      <option value="VIDEO">Video</option><option value="FILE">File</option>
     </Select>
    </label>
    <label className="block text-sm font-semibold">URL
     <Input type="url" value={row.url} maxLength={2048} onChange={e=>patchResource(index,{url:e.target.value})}/>
    </label>
    <label className="block text-sm font-semibold">Description
     <Textarea value={row.description} maxLength={4000} onChange={e=>patchResource(index,{description:e.target.value})}/>
    </label>
    <p className="text-xs text-body">Key: {row.key}</p>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="secondary" size="sm" disabled={index===0}
      onClick={()=>setResources(v=>move(v,index,-1))}>Move up</Button>
     <Button type="button" variant="secondary" size="sm" disabled={index===resources.length-1}
      onClick={()=>setResources(v=>move(v,index,1))}>Move down</Button>
     <Button type="button" variant="ghost" size="sm"
      onClick={()=>setResources(v=>v.filter((_,i)=>i!==index))}>Remove</Button>
    </div>
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary" disabled={saving||allResources.length>=200}
    onClick={()=>setResources(v=>[...v,{
      key:nextKey(allResources,"resource"),title:"",url:"",description:"",type:"LINK",
    }])}>Add resource</Button>
  </section>
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
