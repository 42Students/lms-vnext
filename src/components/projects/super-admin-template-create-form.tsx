"use client";

import {useRef,useState,type FormEvent} from "react";
import {ZodError} from "zod";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {initialSuperAdminTemplateDraft} from "@/modules/projects/super-admin-template-create-model";
import {projectMutation} from "@/components/projects/project-api";

export function SuperAdminTemplateCreateForm(){
  const router=useRouter(),{showToast}=useToast();
  const savingRef=useRef(false);
  const [values,setValues]=useState(empty);
  const [releases,setReleases]=useState<TemplateCreateRelease[]>(firstReleases);
  const [sprints,setSprints]=useState<TemplateCreateSprint[]>(firstSprints);
  const [tasks,setTasks]=useState<TemplateCreateTask[]>(firstTasks);
  const [resources,setResources]=useState<TemplateCreateResource[]>([]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");
  const [errorSection,setErrorSection]=useState<string|null>(null);
  const dirty=JSON.stringify([values,releases,sprints,tasks,resources])!==
    JSON.stringify([empty,firstReleases,firstSprints,firstTasks,[]]);
  const guard=useProjectEditorDiscardGuard(!saved,dirty,saving,
    ()=>router.push("/admin/projects/templates"));
  function edit(key:keyof typeof empty,value:string){
    setValues(previous=>({...previous,[key]:value}));
  }
  function changeRelease(index:number,patch:Partial<TemplateCreateRelease>){
    setReleases(previous=>previous.map((row,i)=>i===index?{...row,...patch}:row));
  }
  function changeSprint(index:number,patch:Partial<TemplateCreateSprint>){
    setSprints(previous=>previous.map((row,i)=>i===index?{...row,...patch}:row));
  }
  function changeTask(index:number,patch:Partial<TemplateCreateTask>){
    setTasks(previous=>previous.map((row,i)=>i===index?{...row,...patch}:row));
  }
  function changeResource(index:number,patch:Partial<TemplateCreateResource>){
    setResources(previous=>previous.map((row,i)=>i===index?{...row,...patch}:row));
  }
  function changeReleaseKey(index:number,key:string){
    const oldKey=releases[index]!.key;
    changeRelease(index,{key});
    setSprints(previous=>previous.map(row=>row.releaseKey===oldKey?
      {...row,releaseKey:key}:row));
  }
  function changeSprintKey(index:number,key:string){
    const oldKey=sprints[index]!.key;
    changeSprint(index,{key});
    setTasks(previous=>previous.map(row=>row.sprintKey===oldKey?
      {...row,sprintKey:key}:row));
  }
  function removeRelease(index:number){
    const row=releases[index]!;
    if(sprints.some(sprint=>sprint.releaseKey===row.key)){
      setError("Move or remove linked sprints before removing this release.");return;
    }
    setReleases(previous=>previous.filter((_,i)=>i!==index));setError("");
  }
  function removeSprint(index:number){
    const row=sprints[index]!;
    if(tasks.some(task=>task.sprintKey===row.key)){
      setError("Move or remove linked tasks before removing this sprint.");return;
    }
    setSprints(previous=>previous.filter((_,i)=>i!==index));setError("");
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(savingRef.current)return;
    setError("");setErrorSection(null);
    if(!values.title.trim()){setError("Template title is required.");return;}
    if(values.title.trim().length>160){
      setError("Template title must be 160 characters or fewer.");return;
    }
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)||values.slug.length>80){
      setError("Use a slug of at most 80 lowercase letters, numbers and hyphens.");return;
    }
    const overviewGroups=[
      {name:"Deliverables",value:values.deliverables},
      {name:"Definition of done",value:values.definitionOfDone},
      {name:"Personas",value:values.personas},
    ];
    if(!lines(values.deliverables).length){
      setError("Add at least one deliverable (one per line).");
      setErrorSection("overview");return;
    }
    for(const group of overviewGroups){
      const rows=lines(group.value);
      if(rows.length>50||rows.some(row=>row.length>500)){
        setError(group.name+" supports up to 50 rows and 500 characters per row.");
        setErrorSection("overview");return;
      }
    }
    if(!releases.length||!sprints.length||!tasks.length){
      setError("Add at least one release, sprint and task.");return;
    }
    for(const group of [
      {name:"releases",rows:releases},
      {name:"sprints",rows:sprints},
      {name:"tasks",rows:tasks},
      {name:"resources",rows:resources},
    ]){
      const invalid=group.rows.findIndex(row=>!row.title.trim());
      if(invalid>=0){
        setError(group.name+" · item "+(invalid+1)+": Title required.");
        setErrorSection(group.name);return;
      }
      const keys=new Set<string>();
      for(let i=0;i<group.rows.length;i++){
        const key=group.rows[i]!.key.trim();
        if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)||key.length>64){
          setError(group.name+" · item "+(i+1)+": Use a valid key (up to 64 characters).");
          setErrorSection(group.name);return;
        }
        if(keys.has(key)){
          setError(group.name+" · item "+(i+1)+": Key already exists.");
          setErrorSection(group.name);return;
        }
        keys.add(key);
      }
    }
    savingRef.current=true;setSaving(true);
    try{
      const payload=initialSuperAdminTemplateDraft({
        ...values,releases,sprints,tasks,resources,
      });
      const result=await projectMutation("/api/projects/templates","POST",payload)
        as {template:{id:string}};
      setSaved(true);
      showToast({tone:"success",title:"Template created",
        description:"Review the draft and publish it when ready."});
      router.push("/admin/projects/templates/"+
        encodeURIComponent(result.template.id));
      router.refresh();
    }catch(caught){
      const issue=caught instanceof ZodError?caught.issues[0]:undefined;
      const detail=issue?
        (issue.path.length?issue.path.join(" · ")+": ":"")+issue.message:
        caught instanceof Error?caught.message:"Template creation failed.";
      setErrorSection(issue?.path[0]?.toString()??null);
      setError(detail);
      showToast({tone:"error",title:"Template creation failed",description:detail});
    }finally{
      savingRef.current=false;setSaving(false);
    }
  }
  return <form onSubmit={event=>void submit(event)}
    className="grid min-w-0 gap-5" noValidate>
    <p className="text-sm text-body">
      Build a versioned template with releases, sprints, tasks and resources.
      Saving creates a draft; publication is a separate reviewed action.
    </p>
    <div className="grid gap-3 md:grid-cols-2">
      <label className={label}>Template title
        <Input className={input} required maxLength={160} disabled={saving}
          value={values.title} onChange={event=>edit("title",event.target.value)}/>
      </label>
      <label className={label}>Slug
        <Input className={input} required maxLength={80} disabled={saving}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={values.slug}
          onChange={event=>edit("slug",event.target.value.toLowerCase())}/>
        <span className="block text-xs font-normal text-body">
          Lowercase letters, numbers and hyphens; at most 80 characters.
        </span>
      </label>
      <label className={label}>Template lifecycle
        <Select className={input} disabled value="DRAFT"
          onChange={()=>{}}><option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published (review first)</option>
          <option value="ARCHIVED">Archived (not available at creation)</option>
        </Select>
      </label>
      <label className={label}>Initial workspace status
        <Input className={input} disabled value="Choose Active or Planned when assigning"/>
        <span className="block text-xs font-normal text-body">
          Workspace lifecycle is set when the published template is assigned.
        </span>
      </label>
    </div>
    <label className={label}>Goal
      <Textarea className={input} rows={3} maxLength={2000}
        disabled={saving} value={values.goal}
        onChange={event=>edit("goal",event.target.value)}/>
    </label>
    <label className={label}>Custom summary (optional)
      <Textarea className={input} maxLength={160} disabled={saving}
        value={values.summary} onChange={event=>edit("summary",event.target.value)}/>
      <span className="block text-xs font-normal text-body">
        Defaults to the first goal line or title, up to 160 characters.
      </span>
    </label>
    {values.summary.trim()?<label className={label}>Reason for custom summary
      <Input className={input} maxLength={300} disabled={saving}
        value={values.summaryOverrideReason}
        onChange={event=>edit("summaryOverrideReason",event.target.value)}
        placeholder="Explain why the summary differs (10 characters minimum)"/>
    </label>:null}
    <section className="grid gap-3 border-t border-border pt-4" aria-label="Overview">
      <h2 className="text-base font-semibold">Overview and submission</h2>
      {([
        ["deliverables","Deliverables (required, one per line)"],
        ["definitionOfDone","Definition of done (one per line)"],
        ["personas","Personas (one per line)"],
      ] as const).map(([key,title])=><label key={key} className={label}>
        {title}<Textarea className={input} rows={3} disabled={saving}
          maxLength={4000} value={values[key]}
          onChange={event=>edit(key,event.target.value)}/>
      </label>)}
      <div className="grid gap-3 md:grid-cols-2">
        <label className={label}>Course label
          <Input className={input} maxLength={160} value={values.courseLabel}
            disabled={saving} onChange={event=>edit("courseLabel",event.target.value)}/>
        </label>
        <label className={label}>Phase
          <Input className={input} maxLength={120} value={values.phase}
            disabled={saving} onChange={event=>edit("phase",event.target.value)}/>
        </label>
      </div>
      <label className={label}>Overview description
        <Textarea className={input} maxLength={4000} disabled={saving}
          value={values.overviewDescription}
          onChange={event=>edit("overviewDescription",event.target.value)}/>
      </label>
      <label className={label}>Submission instructions
        <Textarea className={input} maxLength={4000} disabled={saving}
          value={values.submissionInstructions}
          onChange={event=>edit("submissionInstructions",event.target.value)}/>
      </label>
      <label className={label}>Submission type
        <Select className={input} value={values.submissionType} disabled={saving}
          onChange={event=>edit("submissionType",event.target.value)}>
          <option value="LINK">Link</option><option value="FILE">File upload</option>
          <option value="TEXT">Text</option>
        </Select>
      </label>
    </section>
    <section className="space-y-4 border-t border-border pt-4" aria-label="Releases">
      <h2 className="text-base font-semibold">Releases</h2>
      {!releases.length?<p className="text-sm text-body">No releases yet.</p>:null}
      {releases.map((row,index)=><fieldset key={index}
        className="space-y-3 border-b border-border pb-4">
        <legend className="font-semibold">Release {index+1}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>Key
            <Input className={input} maxLength={64} disabled={saving}
              value={row.key} onChange={event=>changeReleaseKey(index,event.target.value.toLowerCase())}/>
          </label>
          <label className={label}>Title
            <Input className={input} maxLength={200} disabled={saving}
              value={row.title} onChange={event=>changeRelease(index,{title:event.target.value})}/>
          </label>
        </div>
        <label className={label}>Description
          <Textarea className={input} maxLength={4000} disabled={saving}
            value={row.description} onChange={event=>changeRelease(index,{description:event.target.value})}/>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===0}
            onClick={()=>setReleases(previous=>move(previous,index,-1))}>Move up</Button>
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===releases.length-1}
            onClick={()=>setReleases(previous=>move(previous,index,1))}>Move down</Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving}
            onClick={()=>removeRelease(index)}>Remove</Button>
        </div>
      </fieldset>)}
      <Button type="button" size="sm" variant="secondary"
        disabled={saving||releases.length>=50}
        onClick={()=>setReleases(previous=>[...previous,{
          key:uniqueKey(previous,"release"),title:"",description:""}])}>
        Add release
      </Button>
    </section>
    <section className="space-y-4 border-t border-border pt-4" aria-label="Sprints">
      <h2 className="text-base font-semibold">Sprints</h2>
      {!sprints.length?<p className="text-sm text-body">No sprints yet.</p>:null}
      {sprints.map((row,index)=><fieldset key={index}
        className="space-y-3 border-b border-border pb-4">
        <legend className="font-semibold">Sprint {index+1}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>Key
            <Input className={input} maxLength={64} disabled={saving}
              value={row.key} onChange={event=>changeSprintKey(index,event.target.value.toLowerCase())}/>
          </label>
          <label className={label}>Release
            <Select className={input} value={row.releaseKey} disabled={saving}
              onChange={event=>changeSprint(index,{releaseKey:event.target.value})}>
              {!releases.some(item=>item.key===row.releaseKey)?
                <option value={row.releaseKey}>Unavailable release</option>:null}
              {releases.map(item=><option key={item.key} value={item.key}>
                {item.title||item.key}</option>)}
            </Select>
          </label>
          <label className={label}>Title
            <Input className={input} maxLength={200} disabled={saving}
              value={row.title} onChange={event=>changeSprint(index,{title:event.target.value})}/>
          </label>
          <label className={label}>Due label
            <Input className={input} maxLength={120} disabled={saving}
              value={row.dueLabel} onChange={event=>changeSprint(index,{dueLabel:event.target.value})}/>
          </label>
        </div>
        <label className={label}>Goal
          <Textarea className={input} maxLength={1000} disabled={saving}
            value={row.goal} onChange={event=>changeSprint(index,{goal:event.target.value})}/>
        </label>
        <label className={label}>Description
          <Textarea className={input} maxLength={4000} disabled={saving}
            value={row.description} onChange={event=>changeSprint(index,{description:event.target.value})}/>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===0}
            onClick={()=>setSprints(previous=>move(previous,index,-1))}>Move up</Button>
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===sprints.length-1}
            onClick={()=>setSprints(previous=>move(previous,index,1))}>Move down</Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving}
            onClick={()=>removeSprint(index)}>Remove</Button>
        </div>
      </fieldset>)}
      <Button type="button" size="sm" variant="secondary"
        disabled={saving||sprints.length>=200||!releases.length}
        onClick={()=>setSprints(previous=>[...previous,{
          key:uniqueKey(previous,"sprint"),releaseKey:releases[0]!.key,
          title:"",description:"",goal:"",dueLabel:""}])}>Add sprint</Button>
    </section>
    <section className="space-y-4 border-t border-border pt-4" aria-label="Tasks">
      <h2 className="text-base font-semibold">Tasks</h2>
      {!tasks.length?<p className="text-sm text-body">No tasks yet.</p>:null}
      {tasks.map((row,index)=><fieldset key={index}
        className="space-y-3 border-b border-border pb-4">
        <legend className="font-semibold">Task {index+1}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>Key
            <Input className={input} maxLength={64} disabled={saving}
              value={row.key} onChange={event=>changeTask(index,{key:event.target.value.toLowerCase()})}/>
          </label>
          <label className={label}>Sprint
            <Select className={input} value={row.sprintKey} disabled={saving}
              onChange={event=>changeTask(index,{sprintKey:event.target.value})}>
              {!sprints.some(item=>item.key===row.sprintKey)?
                <option value={row.sprintKey}>Unavailable sprint</option>:null}
              {sprints.map(item=><option key={item.key} value={item.key}>
                {item.title||item.key}</option>)}
            </Select>
          </label>
          <label className={label}>Title
            <Input className={input} maxLength={200} disabled={saving}
              value={row.title} onChange={event=>changeTask(index,{title:event.target.value})}/>
          </label>
          <label className={label}>Priority
            <Select className={input} value={row.priority} disabled={saving}
              onChange={event=>changeTask(index,{
                priority:event.target.value as TemplateCreateTask["priority"]})}>
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
            </Select>
          </label>
        </div>
        <label className={label}>Description
          <Textarea className={input} maxLength={4000} disabled={saving}
            value={row.description} onChange={event=>changeTask(index,{description:event.target.value})}/>
        </label>
        <label className={label}>Acceptance criteria
          <Textarea className={input} maxLength={4000} disabled={saving}
            value={row.acceptanceCriteria}
            onChange={event=>changeTask(index,{acceptanceCriteria:event.target.value})}/>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===0}
            onClick={()=>setTasks(previous=>move(previous,index,-1))}>Move up</Button>
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===tasks.length-1}
            onClick={()=>setTasks(previous=>move(previous,index,1))}>Move down</Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving}
            onClick={()=>setTasks(previous=>previous.filter((_,i)=>i!==index))}>Remove</Button>
        </div>
      </fieldset>)}
      <Button type="button" size="sm" variant="secondary"
        disabled={saving||tasks.length>=500||!sprints.length}
        onClick={()=>setTasks(previous=>[...previous,{
          key:uniqueKey(previous,"task"),sprintKey:sprints[0]!.key,
          title:"",description:"",acceptanceCriteria:"",priority:"MEDIUM"}])}>
        Add task
      </Button>
    </section>
    <section className="space-y-4 border-t border-border pt-4" aria-label="Resources">
      <h2 className="text-base font-semibold">Resources</h2>
      {!resources.length?<p className="text-sm text-body">No resources yet.</p>:null}
      {resources.map((row,index)=><fieldset key={index}
        className="space-y-3 border-b border-border pb-4">
        <legend className="font-semibold">Resource {index+1}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>Key
            <Input className={input} maxLength={64} disabled={saving}
              value={row.key} onChange={event=>changeResource(index,{
                key:event.target.value.toLowerCase()})}/>
          </label>
          <label className={label}>Title
            <Input className={input} maxLength={200} disabled={saving}
              value={row.title} onChange={event=>changeResource(index,{title:event.target.value})}/>
          </label>
        </div>
        <label className={label}>URL
          <Input className={input} type="url" maxLength={2048} disabled={saving}
            value={row.url} onChange={event=>changeResource(index,{url:event.target.value})}/>
        </label>
        <label className={label}>Description
          <Textarea className={input} maxLength={4000} disabled={saving}
            value={row.description} onChange={event=>changeResource(index,{description:event.target.value})}/>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===0}
            onClick={()=>setResources(previous=>move(previous,index,-1))}>Move up</Button>
          <Button type="button" size="sm" variant="secondary" disabled={saving||index===resources.length-1}
            onClick={()=>setResources(previous=>move(previous,index,1))}>Move down</Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving}
            onClick={()=>setResources(previous=>previous.filter((_,i)=>i!==index))}>Remove</Button>
        </div>
      </fieldset>)}
      <Button type="button" size="sm" variant="secondary"
        disabled={saving||resources.length>=500}
        onClick={()=>setResources(previous=>[...previous,{
          key:uniqueKey(previous,"resource"),title:"",url:"",description:""}])}>
        Add resource
      </Button>
    </section>
    {error?<Banner tone="error">
      {errorSection?errorSection[0]!.toUpperCase()+errorSection.slice(1)+": ":""}{error}
    </Banner>:null}
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
      <Button type="button" variant="secondary" disabled={saving}
        onClick={guard.requestClose}>Cancel</Button>
      <Button type="submit" loading={saving} disabled={saving}>
        {saving?"Creating…":"Create draft template"}
      </Button>
    </div>
    <ConfirmDialog open={guard.discardOpen}
      onOpenChange={guard.setDiscardOpen}
      title="Discard unsaved changes?"
      description="You have unsaved changes. Leave without saving them?"
      confirmLabel="Discard changes" pending={saving}
      onConfirm={guard.confirmDiscard}/>
  </form>;
}
