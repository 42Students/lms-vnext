"use client";
import {useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
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
import {projectMutation} from "./project-api";

const blank={title:"",slug:"",goal:"",overviewDescription:"",
 summary:"",summaryOverrideReason:"",deliverables:"",definitionOfDone:"",personas:"",
 courseLabel:"",phase:"",submissionType:"LINK",submissionInstructions:""};
const label="block min-w-0 text-[13px] font-semibold leading-5 text-body";
const field="mt-1 w-full";
function makeSlug(title:string){
 return title.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80).replace(/-$/g,"")||"template";
}
function freshKey(rows:readonly {key:string}[],prefix:string){
 const keys=new Set(rows.map(row=>row.key));let n=1;
 while(keys.has(prefix+"-"+n))n++;
 return prefix+"-"+n;
}
function move<T>(rows:readonly T[],index:number,direction:-1|1):T[]{
 const to=index+direction;if(to<0||to>=rows.length)return [...rows];
 const copy=[...rows];[copy[index],copy[to]]=[copy[to]!,copy[index]!];return copy;
}
const lines=(value:string)=>value.split(/\r?\n/).map(row=>row.trim()).filter(Boolean);

export function SuperAdminTemplateCreateForm(){
 const router=useRouter(),{showToast}=useToast();
 const pendingRef=useRef(false),titleRef=useRef<HTMLInputElement|null>(null);
 const [values,setValues]=useState(blank);
 const [slugManual,setSlugManual]=useState(false);
 const [lifecycle,setLifecycle]=useState<"DRAFT">("DRAFT");
 const [initialStatus,setInitialStatus]=useState<"ACTIVE"|"PLANNED">("ACTIVE");
 const [displayStatus,setDisplayStatus]=useState("ACTIVE");
 const [releases,setReleases]=useState<TemplateCreateRelease[]>([]);
 const [sprints,setSprints]=useState<TemplateCreateSprint[]>([]);
 const [tasks,setTasks]=useState<TemplateCreateTask[]>([]);
 const [resources,setResources]=useState<TemplateCreateResource[]>([]);
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 const [attempted,setAttempted]=useState(false);
 const dirty=JSON.stringify([values,slugManual,lifecycle,initialStatus,displayStatus,
   releases,sprints,tasks,resources])!==
   JSON.stringify([blank,false,"DRAFT","ACTIVE","ACTIVE",[],[],[],[]]);
 const guard=useProjectEditorDiscardGuard(true,dirty,saving,
  ()=>router.push("/admin/projects/templates"));
 const edit=(key:keyof typeof blank,value:string)=>{
  if(key==="title"&&!slugManual)
   setValues(old=>({...old,title:value,slug:makeSlug(value)}));
  else setValues(old=>({...old,[key]:value}));
 };
 function renameRelease(index:number,key:string){
  const old=releases[index]!.key,newKey=key.toLowerCase();
  setReleases(rows=>rows.map((row,i)=>i===index?{...row,key:newKey}:row));
  setSprints(rows=>rows.map(row=>row.releaseKey===old?{...row,releaseKey:newKey}:row));
 }
 function renameSprint(index:number,key:string){
  const old=sprints[index]!.key,newKey=key.toLowerCase();
  setSprints(rows=>rows.map((row,i)=>i===index?{...row,key:newKey}:row));
  setTasks(rows=>rows.map(row=>row.sprintKey===old?{...row,sprintKey:newKey}:row));
 }
 function removeRelease(index:number){
  if(sprints.some(row=>row.releaseKey===releases[index]?.key)){
   setError("Remove linked sprints before removing this release.");return;
  }
  setReleases(rows=>rows.filter((_,i)=>i!==index));
 }
 function removeSprint(index:number){
  if(tasks.some(row=>row.sprintKey===sprints[index]?.key)){
   setError("Remove linked tasks before removing this sprint.");return;
  }
  setSprints(rows=>rows.filter((_,i)=>i!==index));
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pendingRef.current)return;
  setAttempted(true);setError("");
  if(!values.title.trim()){titleRef.current?.focus();setError("Title is required");return;}
  if(values.title.trim().length>200){setError("Title must be 200 characters or fewer");return;}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)){
   setError("Template slug must use lowercase letters, numbers and single hyphens.");return;
  }
  if(values.slug.length>80){setError("Template slug must be 80 characters or fewer.");return;}
  if([releases,sprints,tasks,resources].some(group=>group.some(row=>!row.title.trim()))){
   setError("Every added release, sprint, task and resource needs a title.");return;
  }
  if(new Set(releases.map(x=>x.key)).size!==releases.length||
    new Set(sprints.map(x=>x.key)).size!==sprints.length||
    new Set(tasks.map(x=>x.key)).size!==tasks.length||
    new Set(resources.map(x=>x.key)).size!==resources.length){
   setError("Each release, sprint, task and resource must have a unique key.");return;
  }
  if(sprints.some(row=>!releases.some(release=>release.key===row.releaseKey))||
     tasks.some(row=>!sprints.some(sprint=>sprint.key===row.sprintKey))){
   setError("Choose a valid parent release for every sprint and sprint for every task.");return;
  }
  if(resources.some(row=>row.url&& !/^https?:\/\//i.test(row.url))){
   setError("Resource URLs must begin with http:// or https://");return;
  }
  pendingRef.current=true;setSaving(true);
  try{
   const payload=initialSuperAdminTemplateDraft({...values,releases,sprints,tasks,resources});
   const created=await projectMutation("/api/projects/templates","POST",payload)
    as {template?:{id?:string}};
   const id=created.template?.id;
   if(!id)throw new Error("The template was created but its ID was not returned. Open the template list to locate it.");
   showToast({tone:"success",title:"Template created"});
   router.push("/admin/projects/templates/"+encodeURIComponent(id)+"/overview");
   router.refresh();
  }catch(caught){
   const reason=caught instanceof Error?caught.message:"Template creation failed";
   setError(reason);
   showToast({tone:"error",title:"Failed to create template",description:reason});
  }finally{pendingRef.current=false;setSaving(false);}
 }
 const rowControls=(index:number,length:number,up:()=>void,down:()=>void,remove:()=>void)=>
  <div className="flex flex-wrap gap-2">
   <Button type="button" size="sm" variant="secondary" disabled={saving||index===0}
    onClick={up}>Move up</Button>
   <Button type="button" size="sm" variant="secondary" disabled={saving||index===length-1}
    onClick={down}>Move down</Button>
   <Button type="button" size="sm" variant="ghost" disabled={saving}
    onClick={remove}>Remove</Button>
  </div>;
 return <form noValidate onSubmit={event=>void submit(event)}
  className="grid min-w-0 gap-5">
  <p className="text-sm text-body">
   Keep the template generic. Live meetings, activity, and submission state belong to workspaces.
   This draft starts empty. Add the reusable plan before publishing.
  </p>
  <section className="grid min-w-0 gap-3" aria-label="Basic info">
   <h2 className="text-base font-semibold text-foreground">Basic info</h2>
   <div className="grid min-w-0 gap-3 md:grid-cols-2">
    <label className={label}>Template title
     <Input ref={titleRef} className={field} required maxLength={200} value={values.title}
      disabled={saving} aria-invalid={attempted&&!values.title.trim()}
      placeholder="e.g. Campus Event Coordination"
      onChange={e=>edit("title",e.target.value)}/>
     <span className="mt-1 block text-xs font-normal text-body">{values.title.length}/200</span>
    </label>
    <label className={label}>Template slug
     <Input className={field} required maxLength={80} pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
      disabled={saving} value={values.slug}
      aria-invalid={attempted&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)}
      onChange={e=>{setSlugManual(true);edit("slug",e.target.value.toLowerCase());}}
      placeholder="campus-event-coordination"/>
     <span className="mt-1 block text-xs font-normal text-body">
      Auto-filled from the title until you edit it; lowercase letters, numbers and hyphens (80 maximum).
     </span>
    </label>
   </div>
  </section>
  <section className="grid gap-3 border-t border-border pt-4">
   <h2 className="text-base font-semibold">Lifecycle settings</h2>
   <div className="grid gap-3 md:grid-cols-2">
    <label className={label}>Template lifecycle
     <Select className={field} disabled={saving} value={lifecycle}
      onChange={()=>setLifecycle("DRAFT")}>
      <option value="DRAFT">Draft</option>
      <option value="PUBLISHED" disabled>Published — publish after review</option>
      <option value="ARCHIVED" disabled>Archived — unavailable on create</option>
     </Select>
    </label>
    <label className={label}>Initial workspace status
     <Select className={field} disabled={saving} value={displayStatus}
      onChange={e=>{setDisplayStatus(e.target.value);
       setInitialStatus(["ACTIVE","IN_PROGRESS","READY"].includes(e.target.value)?"ACTIVE":"PLANNED");}}>
      <option value="ACTIVE">Active</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="READY">Ready</option>
      <option value="BLOCKED">Blocked</option>
      <option value="ARCHIVED" disabled>Archived</option>
     </Select>
     <span className="mt-1 block text-xs font-normal text-body">
      Template publication and workspace creation are separate. This preferred status
      is chosen again when the published template is assigned.
     </span>
    </label>
   </div>
  </section>
  <section className="grid gap-3 border-t border-border pt-4" aria-label="Content">
   <h2 className="text-base font-semibold">Content</h2>
   <label className={label}>Project goal / description
    <Textarea rows={4} className={field} maxLength={2000}
     placeholder="Describe the problem, expected outcome and what a successful project should achieve."
     value={values.goal} disabled={saving} onChange={e=>edit("goal",e.target.value)}/>
   </label>
   <label className={label}>Custom summary (optional)
    <Textarea rows={3} className={field} maxLength={160} disabled={saving}
     value={values.summary} onChange={e=>edit("summary",e.target.value)}/>
    <span className="mt-1 block text-xs font-normal text-body">
     Defaults to the first goal line or title, up to 160 characters.
    </span>
   </label>
   {values.summary.trim()&&values.summary.trim()!==
    (lines(values.goal)[0]??values.title.trim()).slice(0,160)?
    <label className={label}>Reason for custom summary
     <Input className={field} maxLength={300} value={values.summaryOverrideReason}
      disabled={saving} placeholder="Why does this need a different summary?"
      onChange={e=>edit("summaryOverrideReason",e.target.value)}/>
    </label>:null}
   {([
    ["deliverables","Deliverables","Wireframes for all core screens\nWorking prototype\nFinal presentation deck"],
    ["definitionOfDone","Definition of done","All acceptance criteria pass\nDeployed to a public URL\nMentor sign-off recorded"],
    ["personas","Personas","Frontend lead — owns the board UI\nBackend lead — owns the API and data model"],
   ] as const).map(([key,title,placeholder])=><label key={key} className={label}>{title}
    <Textarea rows={4} className={field} disabled={saving} maxLength={4000}
     placeholder={placeholder} value={values[key]}
     onChange={e=>edit(key,e.target.value)}/>
    <span className="mt-1 block text-xs font-normal text-body">One item per line.</span>
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
     <option value="LINK">Link</option><option value="FILE">File</option>
     <option value="TEXT">Text</option>
    </Select>
   </label>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Releases">
   <h2 className="text-base font-semibold">Releases</h2>
   {!releases.length?<p className="text-sm text-body">No releases yet.</p>:null}
   {releases.map((row,i)=><fieldset key={row.key+":"+i}
    className="grid min-w-0 gap-3 border-b border-border pb-4">
    <legend className="text-sm font-semibold">Release {i+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>{const old=row.key;const next=e.target.value.toLowerCase();
        renameRelease(i,next);void old;}}/>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>setReleases(rows=>rows.map((v,j)=>i===j?{...v,title:e.target.value}:v))}/>
     </label>
    </div>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>setReleases(rows=>rows.map((v,j)=>i===j?{...v,description:e.target.value}:v))}/>
    </label>
    {rowControls(i,releases.length,
     ()=>setReleases(rows=>move(rows,i,-1)),()=>setReleases(rows=>move(rows,i,1)),
     ()=>removeRelease(i))}
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary"
    disabled={saving||releases.length>=50}
    onClick={()=>setReleases(rows=>[...rows,{key:freshKey(rows,"release"),title:"",description:""}])}>
    Add release</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Sprints">
   <h2 className="text-base font-semibold">Sprints</h2>
   {!sprints.length?<p className="text-sm text-body">No sprints yet.</p>:null}
   {sprints.map((row,i)=><fieldset key={row.key+":"+i}
    className="grid min-w-0 gap-3 border-b border-border pb-4">
    <legend className="text-sm font-semibold">Sprint {i+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>renameSprint(i,e.target.value)}/>
     </label>
     <label className={label}>Release
      <Select className={field} value={row.releaseKey}
       onChange={e=>setSprints(rows=>rows.map((v,j)=>i===j?{...v,releaseKey:e.target.value}:v))}>
       {releases.map(v=><option key={v.key} value={v.key}>{v.title||v.key}</option>)}
      </Select>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>setSprints(rows=>rows.map((v,j)=>i===j?{...v,title:e.target.value}:v))}/>
     </label>
     <label className={label}>Due label
      <Input className={field} maxLength={160} value={row.dueLabel}
       onChange={e=>setSprints(rows=>rows.map((v,j)=>i===j?{...v,dueLabel:e.target.value}:v))}/>
     </label>
    </div>
    <label className={label}>Sprint goal
     <Textarea className={field} maxLength={1000} value={row.goal}
      onChange={e=>setSprints(rows=>rows.map((v,j)=>i===j?{...v,goal:e.target.value}:v))}/>
    </label>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>setSprints(rows=>rows.map((v,j)=>i===j?{...v,description:e.target.value}:v))}/>
    </label>
    {rowControls(i,sprints.length,
     ()=>setSprints(rows=>move(rows,i,-1)),()=>setSprints(rows=>move(rows,i,1)),
     ()=>removeSprint(i))}
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary"
    disabled={saving||!releases.length||sprints.length>=200}
    onClick={()=>setSprints(rows=>[...rows,{key:freshKey(rows,"sprint"),
      releaseKey:releases[0]!.key,title:"",description:"",goal:"",dueLabel:""}])}>
    Add sprint</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Tasks">
   <h2 className="text-base font-semibold">Tasks</h2>
   {!tasks.length?<p className="text-sm text-body">No tasks yet.</p>:null}
   {tasks.map((row,i)=><fieldset key={row.key+":"+i}
    className="grid min-w-0 gap-3 border-b border-border pb-4">
    <legend className="text-sm font-semibold">Task {i+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>setTasks(rows=>rows.map((v,j)=>i===j?{...v,key:e.target.value.toLowerCase()}:v))}/>
     </label>
     <label className={label}>Sprint
      <Select className={field} value={row.sprintKey}
       onChange={e=>setTasks(rows=>rows.map((v,j)=>i===j?{...v,sprintKey:e.target.value}:v))}>
       {sprints.map(v=><option key={v.key} value={v.key}>{v.title||v.key}</option>)}
      </Select>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>setTasks(rows=>rows.map((v,j)=>i===j?{...v,title:e.target.value}:v))}/>
     </label>
     <label className={label}>Priority
      <Select className={field} value={row.priority}
       onChange={e=>setTasks(rows=>rows.map((v,j)=>i===j?
         {...v,priority:e.target.value as TemplateCreateTask["priority"]}:v))}>
       <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
       <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
      </Select>
     </label>
    </div>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>setTasks(rows=>rows.map((v,j)=>i===j?{...v,description:e.target.value}:v))}/>
    </label>
    <label className={label}>Acceptance criteria
     <Textarea className={field} maxLength={4000} value={row.acceptanceCriteria}
      onChange={e=>setTasks(rows=>rows.map((v,j)=>i===j?{...v,acceptanceCriteria:e.target.value}:v))}/>
    </label>
    {rowControls(i,tasks.length,()=>setTasks(rows=>move(rows,i,-1)),
     ()=>setTasks(rows=>move(rows,i,1)),
     ()=>setTasks(rows=>rows.filter((_,j)=>j!==i)))}
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary"
    disabled={saving||!sprints.length||tasks.length>=500}
    onClick={()=>setTasks(rows=>[...rows,{key:freshKey(rows,"task"),
      sprintKey:sprints[0]!.key,title:"",description:"",
      priority:"MEDIUM",acceptanceCriteria:""}])}>Add task</Button>
  </section>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Resources">
   <h2 className="text-base font-semibold">Resources</h2>
   {!resources.length?<p className="text-sm text-body">No resources yet.</p>:null}
   {resources.map((row,i)=><fieldset key={row.key+":"+i}
    className="grid min-w-0 gap-3 border-b border-border pb-4">
    <legend className="text-sm font-semibold">Resource {i+1}</legend>
    <div className="grid gap-3 md:grid-cols-2">
     <label className={label}>Key
      <Input className={field} maxLength={64} value={row.key}
       onChange={e=>setResources(rows=>rows.map((v,j)=>i===j?{...v,key:e.target.value.toLowerCase()}:v))}/>
     </label>
     <label className={label}>Title
      <Input className={field} maxLength={200} value={row.title}
       onChange={e=>setResources(rows=>rows.map((v,j)=>i===j?{...v,title:e.target.value}:v))}/>
     </label>
    </div>
    <label className={label}>URL
     <Input className={field} type="url" maxLength={2048} value={row.url}
      onChange={e=>setResources(rows=>rows.map((v,j)=>i===j?{...v,url:e.target.value}:v))}/>
    </label>
    <label className={label}>Description
     <Textarea className={field} maxLength={4000} value={row.description}
      onChange={e=>setResources(rows=>rows.map((v,j)=>i===j?{...v,description:e.target.value}:v))}/>
    </label>
    {rowControls(i,resources.length,()=>setResources(rows=>move(rows,i,-1)),
     ()=>setResources(rows=>move(rows,i,1)),
     ()=>setResources(rows=>rows.filter((_,j)=>j!==i)))}
   </fieldset>)}
   <Button type="button" size="sm" variant="secondary" disabled={saving||resources.length>=200}
    onClick={()=>setResources(rows=>[...rows,{key:freshKey(rows,"resource"),
      title:"",url:"",description:""}])}>Add resource</Button>
  </section>
  {error?<Banner tone="error" role="alert">{error}</Banner>:null}
  <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
   <Button type="button" variant="secondary" disabled={saving}
    onClick={guard.requestClose}>Cancel</Button>
   <Button type="submit" loading={saving} disabled={saving}>
    {saving?"Creating…":"Create template"}
   </Button>
  </div>
  <ConfirmDialog open={guard.discardOpen}
   onOpenChange={guard.setDiscardOpen} title="Discard unsaved changes?"
   description="Leave this form and discard the template details you entered?"
   confirmLabel="Discard changes" pending={saving}
   onConfirm={guard.confirmDiscard}/>
 </form>;
}
