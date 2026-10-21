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
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState(props.blueprint);
  const [version, setVersion] = useState(props.currentVersion);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dirty=JSON.stringify(draft)!==JSON.stringify(props.blueprint);
  const reset=()=>{setDraft(props.blueprint);setVersion(props.currentVersion);
    setExpanded(false);setError("");};
  const guard=useProjectEditorDiscardGuard(expanded,dirty,pending,reset);
  const filteredTasks=draft.tasks.map((task,index)=>({task,index}))
    .filter(({task})=>(task.title+" "+task.key+" "+(task.sprintKey??"Backlog"))
      .toLowerCase().includes(taskSearch.trim().toLowerCase()));
  const taskPageCount=Math.max(1,Math.ceil(filteredTasks.length/25));
  const visibleTasks=filteredTasks.slice((Math.min(taskPage,taskPageCount)-1)*25,
    Math.min(taskPage,taskPageCount)*25);
  function prepareTaskKeys(blueprint:ProjectTemplateBlueprint):ProjectTemplateBlueprint{
    const taken=blueprint.tasks.map(task=>task.key).filter(Boolean);
    return {...blueprint,tasks:blueprint.tasks.map(task=>{
      if(task.key.trim())return task;
      const key=nextTemplatePlanKey(taken,"task");
      taken.push(key);
      return {...task,key};
    })};
  }

  function updateSprint(index: number, patch: Partial<Sprint>) {
    setDraft(current => updateTemplateSprint(current, index, patch));
    setError("");
  }
  function updateTask(index: number, patch: Partial<Task>) {
    setDraft(current => ({
      ...current,
      tasks: current.tasks.map((row, at) => at === index ? { ...row, ...patch } : row),
    }));
    setError("");
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
    if (result.error) { setError(result.error); return; }
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
    const firstEmpty=props.section==="tasks"?draft.tasks.findIndex(row=>!row.title.trim()):
      draft.sprints.findIndex(row=>!row.title.trim());
    if(firstEmpty>=0){
      setError("Item "+(firstEmpty+1)+": Title required");return;
    }
    const normalized = normalizeTemplatePlan(prepareTaskKeys(draft));
    const parsed = projectTemplateBlueprintSchema.safeParse(normalized);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid template plan.");
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
      setDraft(parsed.data);
      setVersion(result.template.currentVersion);
      setExpanded(false);
      setMessage(props.section === "sprints" ? "Sprints saved" : "Tasks saved");
      showToast({tone:"success",title:props.section==="sprints"?"Sprints saved":"Tasks saved"});
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message :
        props.section === "sprints" ? "Failed to save sprints" : "Failed to save tasks");
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
          setError("");setMessage("");setExpanded(true);
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
            value={release.title} onChange={event => setDraft(current => ({
              ...current, releases: current.releases.map((row, at) =>
                index === at ? { ...row, title: event.target.value } : row),
            }))}/>
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
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <label className={label}>Key (optional)
              <Input className={field} required maxLength={64} value={sprint.key}
                disabled={pending} onChange={event => updateSprint(index, { key: event.target.value })}/>
            </label>
            <label className={label}>Release key
              <Select className={field} disabled={pending} required value={sprint.releaseKey}
                onChange={event => updateSprint(index, { releaseKey: event.target.value })}>
                {draft.releases.map(release => <option key={release.key} value={release.key}>
                  {release.key}</option>)}
              </Select>
            </label>
            <label className={label}>Title
              <Input className={field} required maxLength={200} disabled={pending}
                value={sprint.title} onChange={event => updateSprint(index, { title: event.target.value })}/>
            </label>
            <label className={label}>Due (optional)
              <Input className={field} maxLength={120} disabled={pending}
                placeholder="e.g. Week 2" value={sprint.dueLabel ?? ""}
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
        {!draft.sprints.length ? <p className="text-sm leading-[22px]">No sprints yet.</p> : null}
      </> : <>
        {!draft.sprints.length ? <p className="text-sm leading-[22px]">
          No sprints saved yet. Tasks will remain in the backlog until assigned to a sprint.{" "}
          <Link className="font-semibold text-primary-text hover:underline focus-visible:underline"
            href={"/admin/projects/templates/" + props.templateId + "/sprints"}>Add sprints</Link>.
        </p> : null}
        {draft.tasks.length>12?<label className={label}>Find a task
          <Input className={field} value={taskSearch} type="search"
            placeholder="Search title, key or sprint"
            onChange={event=>{setTaskSearch(event.target.value);setTaskPage(1);}}/>
        </label>:null}
        {visibleTasks.map(({task,index}) => <fieldset key={task.key+":"+index}
          className="grid min-w-0 gap-3 border-b border-border py-4">
          <legend className="px-1 text-[var(--lms-font-sm)] font-semibold text-foreground">Task {index + 1}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={label}>Key (optional)
              <Input className={field} maxLength={64} disabled={pending}
                value={task.key} placeholder="Auto-generated when saved"
                onChange={event => updateTask(index, { key: event.target.value })}/>
              {!task.key.trim()?<span className="mt-1 block text-xs font-normal text-body">
                A unique task key will be generated on Save.
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
                value={task.title} onChange={event => updateTask(index, { title: event.target.value })}/>
            </label>
            <label className={label}>Task type
              <Select className={field} value={task.taskType??"STORY"} disabled={pending}
                onChange={event=>updateTask(index,{taskType:event.target.value as Task["taskType"]})}>
                <option value="STORY">Story</option><option value="BUG">Bug</option>
                <option value="CHORE">Chore</option><option value="SPIKE">Spike</option>
              </Select>
            </label>
            <label className={label}>Due label
              <Input className={field} maxLength={160} disabled={pending}
                placeholder="e.g. Week 2" value={task.dueLabel??""}
                onChange={event=>updateTask(index,{dueLabel:event.target.value||undefined})}/>
            </label>
            <label className={label}>Priority
              <Select className={field} value={task.priority} disabled={pending}
                onChange={event => updateTask(index, { priority: event.target.value as Task["priority"] })}>
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map(priority =>
                  <option key={priority} value={priority}>{priority[0] + priority.slice(1).toLowerCase()}</option>)}
              </Select>
            </label>
            <label className={label}>Estimate (points)
              <Input type="number" min={1} max={13} step={1} className={field}
                disabled={pending} value={task.estimatePoints ?? ""}
                onChange={event => updateTask(index, {
                  estimatePoints: event.target.value === "" ? undefined : Number(event.target.value),
                })}/>
            </label>
          </div>
          <label className={label}>Description
            <Textarea className={field} maxLength={4000} disabled={pending}
              value={task.description ?? ""} onChange={event =>
                updateTask(index, { description: event.target.value || undefined })}/>
          </label>
          <label className={label}>Approach
            <Textarea className={field} maxLength={4000} disabled={pending}
              value={task.approach??""}
              onChange={event=>updateTask(index,{approach:event.target.value||undefined})}/>
          </label>
          <label className={label}>What does done look like?
            <Textarea className={field} maxLength={4000} disabled={pending}
              value={task.acceptanceCriteria ?? ""} onChange={event =>
                updateTask(index, { acceptanceCriteria: event.target.value || undefined })}/>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateTask(current, task.key, -1))}>Move up</Button>
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateTask(current, task.key, 1))}>Move down</Button>
            <Button type="button" size="sm" className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => ({
                ...current, tasks: current.tasks.filter(item => item.key !== task.key),
              }))}>Remove</Button>
          </div>
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
        <Button type="button" size="sm" variant="secondary"
          disabled={pending || draft.tasks.length >= 500}
          onClick={addTask}>Add task</Button>
        {draft.tasks.length>=500?<p className="text-xs text-body">
          Maximum 500 tasks. Remove a task before adding another.
        </p>:null}
        {!draft.tasks.length ? <p className="text-sm leading-[22px]">No tasks yet.</p> : null}
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
