"use client";
import { Textarea } from "@/components/ui/textarea";
import { Banner } from "@/components/ui/banner";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ProjectTemplateBlueprint } from "@/modules/projects/validation";
import { projectTemplateBlueprintSchema } from "@/modules/projects/validation";
import {
  moveTemplateSprint, moveTemplateTask, nextTemplatePlanKey,
  normalizeTemplatePlan, removeTemplateSprint, updateTemplateSprint,
} from "@/modules/projects/template-plan-editor-model";
import { Button } from "@/components/ui/button";
import { projectMutation } from "./project-api";

type Props = {
  templateId: string;
  templateTitle: string;
  templateSummary: string | null;
  currentVersion: number;
  blueprint: ProjectTemplateBlueprint;
  section: "sprints" | "tasks";
};
type Sprint = ProjectTemplateBlueprint["sprints"][number];
type Task = ProjectTemplateBlueprint["tasks"][number];
const field = "mt-1 w-full";
const label = "block text-[var(--lms-font-sm)] font-semibold text-body";

export function SuperAdminTemplatePlanEditor(props: Props) {
  const {askConfirm,dialog}=useConfirmFlow();
  const router = useRouter();
  const {showToast}=useToast();
  const [taskSearch,setTaskSearch]=useState("");
  const [taskPage,setTaskPage]=useState(1);
  const [collapsedTaskIds,setCollapsedTaskIds]=useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [removedTask,setRemovedTask]=useState<{task:Task;index:number}|null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState(props.blueprint);
  const [version, setVersion] = useState(props.currentVersion);
  const [error, setError] = useState("");
  const [rowErrors,setRowErrors]=useState<Record<string,string>>({});
  const [message, setMessage] = useState("");
  const dirty=JSON.stringify(draft)!==JSON.stringify(props.blueprint);
  const reset=()=>{setDraft(props.blueprint);setVersion(props.currentVersion);
    setExpanded(false);setRemovedTask(null);setError("");setRowErrors({});};
  const guard=useProjectEditorDiscardGuard(expanded,dirty,pending,reset);
  const filteredTasks=draft.tasks.map((task,index)=>({task,index}))
    .filter(({task})=>(task.title+" "+task.key+" "+(task.sprintKey??"Backlog"))
      .toLowerCase().includes(taskSearch.trim().toLowerCase()));
  const taskPageCount=Math.max(1,Math.ceil(filteredTasks.length/25));
  const visibleTasks=filteredTasks.slice((Math.min(taskPage,taskPageCount)-1)*25,
    Math.min(taskPage,taskPageCount)*25);
  function preparePlanKeys(blueprint:ProjectTemplateBlueprint):ProjectTemplateBlueprint{
    // Legacy fields permit an empty key; generate it only when saved, and
    // preserve child sprint references if the parent key changes.
    const sprintTaken=blueprint.sprints.map(row=>row.key.trim()).filter(Boolean);
    const sprintRemap=new Map<string,string>();
    const sprints=blueprint.sprints.map(sprint=>{
      if(sprint.key.trim())return sprint;
      const key=nextTemplatePlanKey(sprintTaken,"sprint");
      sprintTaken.push(key);
      if(sprint.key) sprintRemap.set(sprint.key,key);
      return {...sprint,key};
    });
    const taskTaken=blueprint.tasks.map(task=>task.key.trim()).filter(Boolean);
    const tasks=blueprint.tasks.map(task=>{
      const sprintKey=task.sprintKey&&sprintRemap.has(task.sprintKey)
        ?sprintRemap.get(task.sprintKey)??null:task.sprintKey;
      if(task.key.trim())return {...task,sprintKey};
      const key=nextTemplatePlanKey(taskTaken,"task");
      taskTaken.push(key);
      return {...task,key,sprintKey};
    });
    return {...blueprint,sprints,tasks};
  }

  function updateSprint(index: number, patch: Partial<Sprint>) {
    setDraft(current => updateTemplateSprint(current, index, patch));
    setError("");setRowErrors({});
  }
  function updateTask(index: number, patch: Partial<Task>) {
    setDraft(current => ({
      ...current,
      tasks: current.tasks.map((row, at) => at === index ? { ...row, ...patch } : row),
    }));
    setError("");setRowErrors({});
  }
  function addSprint() {
    setDraft(current => {
      const releaseKey = current.releases[0]?.key;
      if (!releaseKey) return current;
      return {
        ...current,
        sprints: [...current.sprints, {
          key: nextTemplatePlanKey(current.sprints.map(row => row.key), "sprint"),
          releaseKey, title: "New sprint",
          sequence: Math.max(-1, ...current.sprints.filter(row => row.releaseKey === releaseKey)
            .map(row => row.sequence)) + 1,
        }],
      };
    });
  }
  function addTask() {
    setDraft(current => {
      const sprintKey = current.sprints[0]?.key??null;
      return {
        ...current,
        tasks: [...current.tasks, {
          key: nextTemplatePlanKey(current.tasks.map(row => row.key), "task"),
          sprintKey, title: "New task",taskType:"STORY" as const, priority: "MEDIUM" as const,
          sequence: Math.max(-1, ...current.tasks.filter(row => row.sprintKey === sprintKey)
            .map(row => row.sequence)) + 1,
        }],
      };
    });
  }
  function removeSprint(key: string) {
    const result = removeTemplateSprint(draft, key);
    if (result.error) { setError("Could not remove this sprint. Review the plan and try again."); return; }
    setDraft(result.blueprint);
    setError("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if(!dirty){showToast({tone:"info",title:"No changes to save"});return;}
    if(draft.tasks.length>500){
      setError("Remove "+(draft.tasks.length-500)+" tasks. Maximum 500 items.");return;
    }
    // Collect all invalid rows before returning so a single Save exposes
    // every missing title rather than only the first row.
    const titleIssues:Record<string,string>={};
    const currentSection=props.section==="tasks"?draft.tasks:draft.sprints;
    currentSection.forEach((row,index)=>{
      if(!row.title.trim())titleIssues[props.section+":"+index]="Title required";
    });
    if(props.section==="sprints")draft.releases.forEach((row,index)=>{
      if(!row.title.trim())titleIssues["releases:"+index]="Title required";
    });
    if(Object.keys(titleIssues).length){
      setRowErrors(titleIssues);
      if(props.section==="tasks"){
        const index=draft.tasks.findIndex(row=>!row.title.trim());
        setTaskSearch("");setTaskPage(Math.floor(Math.max(0,index)/25)+1);
        const invalid=draft.tasks[index];
        if(invalid)setCollapsedTaskIds(current=>current.filter(key=>key!==invalid.key));
      }
      setError("Complete the highlighted "+Object.keys(titleIssues).length+
        " required title field(s) before saving.");return;
    }
    const normalized = normalizeTemplatePlan(preparePlanKeys(draft));
    const parsed = projectTemplateBlueprintSchema.safeParse(normalized);
    if (!parsed.success) {
      const rowIssues:Record<string,string>={};
      for(const issue of parsed.error.issues){
        const [section,index]=issue.path;
        if((section==="sprints"||section==="tasks"||section==="releases")&&
          typeof index==="number"){
          const key=section+":"+index;
          // Keep distinct validation messages for each row; do not mask
          // secondary key, sequence or parent-reference errors.
          const prior=rowIssues[key];
          if(!prior)rowIssues[key]=issue.message;
          else if(!prior.split(" · ").includes(issue.message))
            rowIssues[key]=prior+" · "+issue.message;
        }
      }
      setRowErrors(rowIssues);
      const first=parsed.error.issues[0];
      const section=first?.path[0],index=first?.path[1];
      const rowKind=section==="releases"||section==="sprints"||section==="tasks"?section:null;
      if(section==="tasks"&&typeof index==="number"){
        setTaskSearch("");setTaskPage(Math.floor(index/25)+1);
        const task=normalized.tasks[index];
        if(task)setCollapsedTaskIds(current=>current.filter(key=>key!==task.key));
      }
      setError((typeof index==="number"&&rowKind?
        rowKind.slice(0,-1)+" "+(index+1)+": ":"")+
        (first?.message??"Invalid template plan."));
      return;
    }
    if (!(await askConfirm("Save changes as a new template version?"))) return;
    setPending(true); setError(""); setMessage("");
    try {
      const result = await projectMutation(
        "/api/projects/templates/" + encodeURIComponent(props.templateId), "PATCH", {
          expectedVersion: version,
          title: props.templateTitle,
          summary: props.templateSummary ?? undefined,
          blueprint: parsed.data,
          changeNote: props.section === "sprints" ? "Updated template sprints" : "Updated template tasks",
        },
      );
      setDraft(parsed.data);setRowErrors({});
      setVersion(result.template.currentVersion);
      setExpanded(false);
      setMessage(props.section === "sprints" ? "Sprints saved" : "Tasks saved");
      showToast({tone:"success",title:props.section==="sprints"?"Sprints saved":"Tasks saved"});
      router.refresh();
    } catch (caught) {
      setError(props.section === "sprints" ? "Failed to save sprints. Review the template and try again." :
        "Failed to save tasks. Review the template and try again.");
    } finally {
      setPending(false);
    }
  }

  return <section className="min-w-0 border-b border-border pb-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          {props.section === "sprints" ? "Sprint plan" : "Task plan"}
        </h2>
        <p className="mt-1 text-sm text-body leading-[22px]">
          {props.section === "sprints"
            ? "The sprints every workspace created from this template starts with."
            : "The tasks every workspace created from this template starts with."}
        </p>
      </div>
      <Button variant="secondary" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto"
        aria-expanded={expanded} disabled={pending} onClick={()=>{
          if(expanded){guard.requestClose();return;}
          setDraft(props.blueprint);setVersion(props.currentVersion);
          setError("");setMessage("");setRemovedTask(null);setExpanded(true);
        }}>{expanded?"Cancel":props.section==="sprints"?"Edit sprints":"Edit tasks"}</Button>
    </div>
    {message ? <Banner tone="success">{message}</Banner> : null}
    {expanded ? <form className="mt-4 grid min-w-0 gap-4" onSubmit={save}>
      {props.section === "sprints" ? <>
        <p className="m-0 text-xs text-muted-foreground leading-[20px]">
          Template releases and sprints use relative due labels rather than fixed dates, so workspaces created later can retain the same plan. Task type, due label, approach and backlog items are saved together.
        </p>
        {draft.releases.length === 0 ? <p className="text-sm leading-[22px]">No releases saved yet.</p> : null}
        {draft.releases.map((release, index) => <label key={release.key} className={label}>
          Release {index + 1} title
          <Input className={field} maxLength={200} required disabled={pending}
            aria-invalid={Boolean(rowErrors["releases:"+index])}
            value={release.title} onChange={event => {
              setRowErrors({});setDraft(current => ({
                ...current, releases: current.releases.map((row, at) =>
                  index === at ? { ...row, title: event.target.value } : row),
              }));
            }}/>
          {rowErrors["releases:"+index]?<span role="alert" className="mt-1 block text-xs text-danger-text">
            {rowErrors["releases:"+index]}</span>:null}
        </label>)}
        <Button type="button" variant="secondary" size="sm" disabled={pending || draft.releases.length >= 50}
          onClick={() => setDraft(current => ({
            ...current, releases: [...current.releases, {
              key: nextTemplatePlanKey(current.releases.map(row => row.key), "release"),
              title: "New release", sequence: Math.max(-1, ...current.releases.map(row => row.sequence)) + 1,
            }],
          }))}>Add release</Button>
        {draft.sprints.map((sprint, index) => <fieldset key={index}
          className="grid min-w-0 gap-3 border-b border-border py-4">
          <legend className="px-1 text-[var(--lms-font-sm)] font-semibold text-foreground">Sprint {index + 1}</legend>
          {rowErrors["sprints:"+index]?<p role="alert" className="text-sm text-danger-text">
            {rowErrors["sprints:"+index]}</p>:null}
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <label className={label}>Key (optional)
              <Input className={field} maxLength={64} value={sprint.key}
                placeholder="Auto-generated from title if left blank"
                disabled={pending} onChange={event => updateSprint(index, { key: event.target.value })}/>
            </label>
            <label className={label}>Release (required)
              <Select className={field} disabled={pending} required
                aria-invalid={!sprint.releaseKey||
                  !draft.releases.some(item=>item.key===sprint.releaseKey)}
                value={sprint.releaseKey}
                onChange={event => updateSprint(index, { releaseKey: event.target.value })}>
                {draft.releases.map(release => <option key={release.key} value={release.key}>
                  {release.key}</option>)}
              </Select>
            </label>
            <label className={label}>Title
              <Input className={field} required maxLength={200} disabled={pending}
                placeholder="e.g. Discovery and design" aria-invalid={!sprint.title.trim()}
                value={sprint.title} onChange={event => updateSprint(index, { title: event.target.value })}/>
            </label>
            <label className={label}>Due (optional)
              <Input className={field} maxLength={160} disabled={pending}
                placeholder="e.g. Before sprint 1" value={sprint.dueLabel ?? ""}
                onChange={event => updateSprint(index, { dueLabel: event.target.value || undefined })}/>
            </label>
          </div>
          <label className={label}>Sprint goal (optional)
            <Textarea className={field} maxLength={1000} disabled={pending}
              value={sprint.goal ?? ""} onChange={event =>
                updateSprint(index, { goal: event.target.value || undefined })}/>
          </label>
          <label className={label}>Description
            <Textarea className={field} maxLength={4000} disabled={pending}
              value={sprint.description ?? ""} onChange={event =>
                updateSprint(index, { description: event.target.value || undefined })}/>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateSprint(current, sprint.key, -1))}>Move up</Button>
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateSprint(current, sprint.key, 1))}>Move down</Button>
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => removeSprint(sprint.key)}>Remove</Button>
          </div>
        </fieldset>)}
        <Button type="button" size="sm" variant="secondary"
          disabled={pending || !draft.releases.length || draft.sprints.length >= 200}
          onClick={addSprint}>Add sprint</Button>
        {!draft.sprints.length ? <p className="text-sm leading-[22px]">No sprints yet. Add one to start the template sprint plan.</p> : null}
      </> : <>
        {!draft.sprints.length ? <Banner tone="info">
          Tasks without a sprint stay in the backlog until assigned to a sprint.{" "}
          <Link className="font-semibold text-primary-text hover:underline focus-visible:underline"
            href={"/admin/projects/templates/" + encodeURIComponent(props.templateId) + "/sprints"}>Add sprints</Link>.
        </Banner> : null}
        {draft.tasks.length>12?<label className={label}>Find a task
          <Input className={field} value={taskSearch} type="search"
            placeholder="Search title, key or sprint"
            onChange={event=>{setTaskSearch(event.target.value);setTaskPage(1);}}/>
        </label>:null}
        {visibleTasks.map(({task,index}) => <fieldset key={task.key+":"+index}
          className="grid min-w-0 gap-3 border-b border-border py-4">
          <legend className="px-1 text-[var(--lms-font-sm)] font-semibold text-foreground">
            Task {index+1} · {task.title||"Untitled task"}
          </legend>
          {rowErrors["tasks:"+index]?<p role="alert" className="text-sm text-danger-text">
            {rowErrors["tasks:"+index]}</p>:null}
          <Button type="button" size="sm" variant="secondary"
            aria-expanded={!collapsedTaskIds.includes(task.key)}
            aria-controls={"template-task-fields-"+index}
            disabled={pending}
            onClick={()=>setCollapsedTaskIds(current=>current.includes(task.key)?
              current.filter(key=>key!==task.key):[...current,task.key])}>
            {collapsedTaskIds.includes(task.key)?"Expand task":"Collapse task"}
          </Button>
          {!collapsedTaskIds.includes(task.key)?<div id={"template-task-fields-"+index}
            className="grid min-w-0 gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className={label}>Key (optional)
              <Input className={field} maxLength={64} disabled={pending}
                value={task.key} placeholder="Auto-generated when saved"
                onChange={event => updateTask(index, { key: event.target.value })}/>
              {!task.key.trim()?<span className="mt-1 block text-xs font-normal text-body">
                Preview: {nextTemplatePlanKey(draft.tasks.map(item=>item.key).filter(Boolean),"task")} (auto-generated when saved).
              </span>:null}
            </label>
            <label className={label}>Sprint
              <Select className={field} disabled={pending} value={task.sprintKey??""}
                onChange={event => updateTask(index, { sprintKey: event.target.value||null })}>
                <option value="">Backlog (no sprint)</option>
                {draft.sprints.map(sprint => <option key={sprint.key} value={sprint.key}>
                  {sprint.title}</option>)}
              </Select>
            </label>
            <label className={label}>Title
              <Input className={field} required maxLength={200} disabled={pending}
                aria-invalid={!task.title.trim()}
                value={task.title} placeholder="e.g. Draft submission checklist"
                onChange={event => updateTask(index, { title: event.target.value })}/>
            </label>
            <label className={label}>Type
              <Select className={field} value={task.taskType??"STORY"} disabled={pending}
                onChange={event=>updateTask(index,{taskType:event.target.value as Task["taskType"]})}>
                <option value="STORY">Story</option><option value="BUG">Bug</option>
                <option value="CHORE">Chore</option><option value="SPIKE">Spike</option>
              </Select>
            </label>
            <label className={label}>Due (optional)
              <Input className={field} maxLength={160} disabled={pending}
                placeholder="e.g. Before sprint 1" value={task.dueLabel??""}
                onChange={event=>updateTask(index,{dueLabel:event.target.value||undefined})}/>
            </label>
            <label className={label}>Priority
              <Select className={field} value={task.priority} disabled={pending}
                onChange={event => updateTask(index, { priority: event.target.value as Task["priority"] })}>
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map(priority =>
                  <option key={priority} value={priority}>{priority[0] + priority.slice(1).toLowerCase()}</option>)}
              </Select>
            </label>
            <label className={label}>Estimate (optional)
              <Select className={field} disabled={pending} value={String(task.estimatePoints??"")}
                onChange={event=>updateTask(index,{estimatePoints:event.target.value?Number(event.target.value):undefined})}>
                <option value="">Not yet estimated</option>
                {([1,2,3,5,8,13] as const).map(points=><option key={points} value={String(points)}>
                  {points} pt{points===1?"":"s"}</option>)}
              </Select>
            </label>
          </div>
          <label className={label}>Description
            <Textarea className={field} maxLength={4000} disabled={pending}
              value={task.description ?? ""} placeholder="What this task involves" onChange={event =>
                updateTask(index, { description: event.target.value || undefined })}/>
          </label>
          <label className={label}>Approach (optional)
            <Textarea className={field} maxLength={4000} disabled={pending}
              placeholder="The worked, how-to-do-this guidance for this task"
              value={task.approach??""}
              onChange={event=>updateTask(index,{approach:event.target.value||undefined})}/>
          </label>
          <label className={label}>Done when (optional)
            <Textarea className={field} maxLength={4000} disabled={pending}
              placeholder="The concrete condition that makes this task finished — not a restatement of the description"
              value={task.acceptanceCriteria ?? ""} onChange={event =>
                updateTask(index, { acceptanceCriteria: event.target.value || undefined })}/>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateTask(current, task.key, -1))}>Move up</Button>
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateTask(current, task.key, 1))}>Move down</Button>
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => {
                setRemovedTask({task,index});
                setDraft(current=>({...current,
                  tasks:current.tasks.filter((_,at)=>at!==index),
                }));
              }}>Remove</Button>
          </div>
          </div>:null}
        </fieldset>)}
        {filteredTasks.length>25?<div className="flex flex-wrap items-center gap-3 text-sm">
          <span>Showing page {Math.min(taskPage,taskPageCount)} of {taskPageCount}</span>
          <Button type="button" size="sm" variant="secondary"
            disabled={taskPage<=1}
            onClick={()=>setTaskPage(n=>Math.max(1,n-1))}>Previous</Button>
          <Button type="button" size="sm" variant="secondary"
            disabled={taskPage>=taskPageCount}
            onClick={()=>setTaskPage(n=>Math.min(taskPageCount,n+1))}>Next</Button>
        </div>:null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" disabled={pending || draft.tasks.length >= 500}
            onClick={addTask}>Add task</Button>
          {removedTask?<Button type="button" size="sm" variant="secondary" disabled={pending}
            onClick={()=>{const restore=removedTask;setDraft(current=>({...current,
              tasks:[...current.tasks.slice(0,restore.index),restore.task,...current.tasks.slice(restore.index)],
            }));setRemovedTask(null);}}>Undo remove {removedTask.task.title||"task"}</Button>:null}
        </div>
        {draft.tasks.length>=500?<p className="text-xs text-body">
          Maximum 500 tasks. Remove a task before adding another.
        </p>:null}
        {!draft.tasks.length ? <p className="text-sm leading-[22px]">No tasks yet. Add a task when you are ready to plan work.</p> : null}
      </>}
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <Button type="button" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending} onClick={() => {
          setDraft(props.blueprint); setError("");
        }}>Reset changes</Button>
        <Button type="submit" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={pending}>
          {pending ? "Saving…" : props.section === "sprints" ? "Save sprints" : "Save tasks"}
        </Button>
      </div>
    </form> : null}
    {dialog}
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard unsaved changes?"
      description="You have unsaved changes. Leave without saving them?"
      confirmLabel="Discard changes" pending={pending}
      onConfirm={guard.confirmDiscard}/>
  </section>;
}
