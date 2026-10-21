"use client";

import {useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Banner} from "@/components/ui/banner";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {initialSuperAdminTemplateDraft,
  type TemplateCreateRelease,type TemplateCreateSprint,
  type TemplateCreateTask,type TemplateCreateResource,
} from "@/modules/projects/super-admin-template-create-model";
import {projectMutation} from "@/components/projects/project-api";

const initial={
 slug:"",title:"",summary:"",goal:"",overviewDescription:"",
 deliverables:"",definitionOfDone:"",personas:"",
 courseLabel:"",phase:"",submissionType:"LINK",submissionInstructions:"",
};
const initialReleases:TemplateCreateRelease[]=[
 {key:"release-1",title:"Release 1",description:""},
];
const initialSprints:TemplateCreateSprint[]=[
 {key:"sprint-1",releaseKey:"release-1",title:"Sprint 1",
  description:"",goal:"",dueLabel:""},
];
const initialTasks:TemplateCreateTask[]=[
 {key:"task-1",sprintKey:"sprint-1",title:"",description:"",
  acceptanceCriteria:"",priority:"MEDIUM"},
];
function nextKey(rows:readonly {key:string}[],prefix:string){
 const existing=new Set(rows.map(row=>row.key));
 let index=1;while(existing.has(prefix+"-"+index))index++;
 return prefix+"-"+index;
}
function move<T>(rows:readonly T[],index:number,direction:-1|1):T[]{
 const target=index+direction;
 if(target<0||target>=rows.length)return [...rows];
 const copy=[...rows];[copy[index],copy[target]]=[copy[target]!,copy[index]!];return copy;
}
const field="mt-1 w-full";
const label="text-[13px] font-semibold text-body";

export function SuperAdminTemplateCreateForm(){
 const router=useRouter();
 const {showToast}=useToast();
 const pendingRef=useRef(false);
 const [values,setValues]=useState(initial);
 const [releases,setReleases]=useState(initialReleases);
 const [sprints,setSprints]=useState(initialSprints);
 const [tasks,setTasks]=useState(initialTasks);
 const [resources,setResources]=useState<TemplateCreateResource[]>([]);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [initialWorkspaceStatus,setInitialWorkspaceStatus]=useState("ACTIVE");
 const [requestedLifecycle,setRequestedLifecycle]=useState("DRAFT");
 const dirty=JSON.stringify([values,releases,sprints,tasks,resources,
  initialWorkspaceStatus,requestedLifecycle])!==JSON.stringify([
    initial,initialReleases,initialSprints,initialTasks,[],"ACTIVE","DRAFT",
  ]);
 const guard=useProjectEditorDiscardGuard(true,dirty,saving,
  ()=>{window.location.assign("/admin/projects/templates");});
 const edit=(key:keyof typeof initial,value:string)=>
  setValues(old=>({...old,[key]:value}));
 function updateRelease(index:number,patch:Partial<TemplateCreateRelease>){
  setReleases(old=>old.map((row,i)=>i===index?{...row,...patch}:row));
 }
 function updateSprint(index:number,patch:Partial<TemplateCreateSprint>){
  setSprints(old=>old.map((row,i)=>i===index?{...row,...patch}:row));
 }
 function updateTask(index:number,patch:Partial<TemplateCreateTask>){
  setTasks(old=>old.map((row,i)=>i===index?{...row,...patch}:row));
 }
 function updateResource(index:number,patch:Partial<TemplateCreateResource>){
  setResources(old=>old.map((row,i)=>i===index?{...row,...patch}:row));
 }
 function changeReleaseKey(index:number,key:string){
  const previous=releases[index]!.key;
  const next=key.toLowerCase();
  updateRelease(index,{key:next});
  setSprints(old=>old.map(row=>row.releaseKey===previous?
    {...row,releaseKey:next}:row));
 }
 function changeSprintKey(index:number,key:string){
  const previous=sprints[index]!.key;
  const next=key.toLowerCase();
  updateSprint(index,{key:next});
  setTasks(old=>old.map(row=>row.sprintKey===previous?
    {...row,sprintKey:next}:row));
 }
 function removeRelease(index:number){
  const release=releases[index]!;
  if(sprints.some(row=>row.releaseKey===release.key)){
   setError("Remove linked sprints before removing this release.");return;
  }
  setReleases(old=>old.filter((_,i)=>i!==index));setError("");
 }
 function removeSprint(index:number){
  const sprint=sprints[index]!;
  if(tasks.some(row=>row.sprintKey===sprint.key)){
   setError("Remove linked tasks before removing this sprint.");return;
  }
  setSprints(old=>old.filter((_,i)=>i!==index));setError("");
 }
 const lines=(s:string)=>s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pendingRef.current)return;
  setError("");
  if(!values.title.trim()){setError("Title is required");return;}
  if(values.title.trim().length>200){setError("Title must be 200 characters or fewer");return;}
  if(!values.slug.trim()){setError("Template slug is required");return;}
  if(values.slug.length>64){setError("Slug must be 64 characters or fewer");return;}
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
   const payload=initialSuperAdminTemplateDraft({
    ...values,releases,sprints,tasks,resources,
   });
   const result=await projectMutation("/api/projects/templates","POST",payload)
     as {template:{id:string}};
   showToast({tone:"success",title:"Template created"});
   router.push("/admin/projects/templates/"+encodeURIComponent(result.template.id)+"/overview");
   router.refresh();
  }catch(caught){
   const message=caught instanceof Error?caught.message:"Failed to create template";
   setError(message);
   showToast({tone:"error",title:"Failed to create template",description:message});
  }finally{pendingRef.current=false;setSaving(false);}
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
    <Input className={field} required maxLength={64} disabled={saving}
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
   <div className="grid gap-3 md:grid-cols-2">
    <label className={label}>Course label
     <Input className={field} maxLength={160} value={values.courseLabel}
      onChange={e=>edit("courseLabel",e.target.value)}/>
    </label>
    <label className={label}>Phase
     <Input className={field} maxLength={120} value={values.phase}
      onChange={e=>edit("phase",e.target.value)}/>
    </label>
   </div>
   <label className={label}>Overview description
    <Textarea className={field} maxLength={4000} value={values.overviewDescription}
     onChange={e=>edit("overviewDescription",e.target.value)}/>
   </label>
   <label className={label}>Submission instructions
    <Textarea className={field} maxLength={4000} value={values.submissionInstructions}
     onChange={e=>edit("submissionInstructions",e.target.value)}/>
   </label>
   <label className={label}>Submission type
    <Select className={field} value={values.submissionType}
     onChange={e=>edit("submissionType",e.target.value)}>
     <option value="LINK">Link</option><option value="FILE">File upload</option>
     <option value="TEXT">Text</option>
    </Select>
   </label>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Releases">
   <h2 className="text-base font-semibold">Releases</h2>
   {!releases.length?<p className="text-sm text-body">No releases yet.</p>:null}
   {releases.map((row,index)=><fieldset key={row.key+":"+index}
    className="space-y-3 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Release {index+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>changeReleaseKey(index,e.target.value)}/>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>updateRelease(index,{title:e.target.value})}/>
     </label>
    </div>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>updateRelease(index,{description:e.target.value})}/>
    </label>
    <div className="flex flex-wrap gap-2">
     <Button size="sm" variant="secondary" type="button" disabled={index===0||saving}
      onClick={()=>setReleases(old=>move(old,index,-1))}>Move up</Button>
     <Button size="sm" variant="secondary" type="button" disabled={index===releases.length-1||saving}
      onClick={()=>setReleases(old=>move(old,index,1))}>Move down</Button>
     <Button size="sm" variant="ghost" type="button" disabled={saving}
      onClick={()=>removeRelease(index)}>Remove</Button>
    </div>
   </fieldset>)}
   <Button size="sm" variant="secondary" type="button" disabled={saving||releases.length>=50}
    onClick={()=>setReleases(old=>[...old,{key:nextKey(old,"release"),
     title:"",description:""}])}>Add release</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Sprints">
   <h2 className="text-base font-semibold">Sprints</h2>
   {!sprints.length?<p className="text-sm text-body">No sprints yet.</p>:null}
   {sprints.map((row,index)=><fieldset key={row.key+":"+index} className="space-y-3 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Sprint {index+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>changeSprintKey(index,e.target.value)}/>
     </label>
     <label className={label}>Release
      <Select className={field} value={row.releaseKey}
       onChange={e=>updateSprint(index,{releaseKey:e.target.value})}>
       {releases.map(r=><option key={r.key} value={r.key}>{r.title||r.key}</option>)}
      </Select>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>updateSprint(index,{title:e.target.value})}/>
     </label>
     <label className={label}>Due label
      <Input className={field} maxLength={120} value={row.dueLabel}
       placeholder="e.g. Week 2"
       onChange={e=>updateSprint(index,{dueLabel:e.target.value})}/>
     </label>
    </div>
    <label className={label}>Sprint goal
     <Textarea className={field} maxLength={1000} value={row.goal}
      onChange={e=>updateSprint(index,{goal:e.target.value})}/>
    </label>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>updateSprint(index,{description:e.target.value})}/>
    </label>
    <div className="flex flex-wrap gap-2">
     <Button size="sm" type="button" variant="secondary" disabled={index===0||saving}
      onClick={()=>setSprints(old=>move(old,index,-1))}>Move up</Button>
     <Button size="sm" type="button" variant="secondary" disabled={index===sprints.length-1||saving}
      onClick={()=>setSprints(old=>move(old,index,1))}>Move down</Button>
     <Button size="sm" type="button" variant="ghost" disabled={saving}
      onClick={()=>removeSprint(index)}>Remove</Button>
    </div>
   </fieldset>)}
   <Button size="sm" type="button" variant="secondary"
    disabled={saving||sprints.length>=200||!releases.length}
    onClick={()=>setSprints(old=>[...old,{key:nextKey(old,"sprint"),
     releaseKey:releases[0]!.key,title:"",description:"",goal:"",dueLabel:""}])}>
    Add sprint</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Tasks">
   <h2 className="text-base font-semibold">Tasks</h2>
   {!tasks.length?<p className="text-sm text-body">No tasks yet.</p>:null}
   {tasks.map((row,index)=><fieldset key={row.key+":"+index} className="space-y-3 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Task {index+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>updateTask(index,{key:e.target.value.toLowerCase()})}/>
     </label>
     <label className={label}>Sprint
      <Select className={field} value={row.sprintKey}
       onChange={e=>updateTask(index,{sprintKey:e.target.value})}>
       {sprints.map(s=><option key={s.key} value={s.key}>{s.title||s.key}</option>)}
      </Select>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>updateTask(index,{title:e.target.value})}/>
     </label>
     <label className={label}>Priority
      <Select className={field} value={row.priority}
       onChange={e=>updateTask(index,{priority:e.target.value as TemplateCreateTask["priority"]})}>
       <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
       <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
      </Select>
     </label>
    </div>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>updateTask(index,{description:e.target.value})}/>
    </label>
    <label className={label}>Acceptance criteria
     <Textarea className={field} maxLength={4000} value={row.acceptanceCriteria}
      onChange={e=>updateTask(index,{acceptanceCriteria:e.target.value})}/>
    </label>
    <div className="flex flex-wrap gap-2">
     <Button size="sm" type="button" variant="secondary" disabled={index===0||saving}
      onClick={()=>setTasks(old=>move(old,index,-1))}>Move up</Button>
     <Button size="sm" type="button" variant="secondary" disabled={index===tasks.length-1||saving}
      onClick={()=>setTasks(old=>move(old,index,1))}>Move down</Button>
     <Button size="sm" type="button" variant="ghost" disabled={saving}
      onClick={()=>setTasks(old=>old.filter((_,i)=>i!==index))}>Remove</Button>
    </div>
   </fieldset>)}
   <Button size="sm" type="button" variant="secondary"
    disabled={saving||tasks.length>=2000||!sprints.length}
    onClick={()=>setTasks(old=>[...old,{key:nextKey(old,"task"),
     sprintKey:sprints[0]!.key,title:"",priority:"MEDIUM",description:"",acceptanceCriteria:""}])}>
    Add task</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Resources">
   <h2 className="text-base font-semibold">Resources</h2>
   {!resources.length?<p className="text-sm text-body">No resources yet.</p>:null}
   {resources.map((row,index)=><fieldset key={row.key+":"+index} className="space-y-3 border-b border-border pb-3">
    <legend className="text-sm font-semibold">Resource {index+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>updateResource(index,{key:e.target.value.toLowerCase()})}/>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>updateResource(index,{title:e.target.value})}/>
     </label>
    </div>
    <label className={label}>URL
     <Input className={field} type="url" maxLength={2048} value={row.url}
      onChange={e=>updateResource(index,{url:e.target.value})}/>
    </label>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>updateResource(index,{description:e.target.value})}/>
    </label>
    <div className="flex flex-wrap gap-2">
     <Button size="sm" type="button" variant="secondary" disabled={index===0||saving}
      onClick={()=>setResources(old=>move(old,index,-1))}>Move up</Button>
     <Button size="sm" type="button" variant="secondary" disabled={index===resources.length-1||saving}
      onClick={()=>setResources(old=>move(old,index,1))}>Move down</Button>
     <Button size="sm" type="button" variant="ghost" disabled={saving}
      onClick={()=>setResources(old=>old.filter((_,i)=>i!==index))}>Remove</Button>
    </div>
   </fieldset>)}
   <Button size="sm" type="button" variant="secondary" disabled={saving||resources.length>=200}
    onClick={()=>setResources(old=>[...old,{key:nextKey(old,"resource"),title:"",url:"",description:""}])}>
    Add resource</Button>
  </section>
  {error?<Banner tone="error">{error}</Banner>:null}
  <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
   <Button type="button" variant="secondary" disabled={saving}
    onClick={guard.requestClose}>Cancel</Button>
   <Button type="submit" loading={saving} disabled={saving}>Create draft template</Button>
  </div>
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
   title="Discard unsaved changes?"
   description="You have unsaved changes. Leave without saving them?"
   confirmLabel="Discard changes" pending={saving}
   onConfirm={guard.confirmDiscard}/>
 </form>;
}
