"use client";
import { Textarea } from "@/components/ui/textarea";
import { Banner } from "@/components/ui/banner";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
const label = "block text-[13px] font-semibold text-body";

export function SuperAdminTemplatePlanEditor(props: Props) {
  const {askConfirm,dialog}=useConfirmFlow();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState(props.blueprint);
  const [version, setVersion] = useState(props.currentVersion);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      const sprintKey = current.sprints[0]?.key;
      if (!sprintKey) return current;
      return {
        ...current,
        tasks: [...current.tasks, {
          key: nextTemplatePlanKey(current.tasks.map(row => row.key), "task"),
          sprintKey, title: "New task", priority: "MEDIUM" as const,
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
    const normalized = normalizeTemplatePlan(draft);
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
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message :
        props.section === "sprints" ? "Failed to save sprints" : "Failed to save tasks");
    } finally {
      setPending(false);
    }
  }

  return <section className="border-b border-border pb-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="m-0 text-base font-semibold text-foreground">
          {props.section === "sprints" ? "Sprint plan" : "Task plan"}
        </h2>
        <p className="mt-1 text-sm text-body">
          {props.section === "sprints"
            ? "The sprints every workspace created from this template starts with."
            : "The tasks every workspace created from this template starts with."}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => {
        setDraft(props.blueprint); setVersion(props.currentVersion);
        setError(""); setMessage(""); setExpanded(value => !value);
      }}>{expanded ? "Cancel" : props.section === "sprints" ? "Edit sprints" : "Edit tasks"}</Button>
    </div>
    {message ? <Banner tone="success">{message}</Banner> : null}
    {expanded ? <form className="mt-4 grid gap-4" onSubmit={save}>
      {props.section === "sprints" ? <>
        <p className="m-0 text-xs text-muted-foreground">
          No start/end dates here on purpose — a template seeds many workspaces, each starting on a different day.
        </p>
        {draft.releases.length === 0 ? <p className="text-sm">No releases saved yet.</p> : null}
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
          className="grid gap-3 rounded-[var(--lms-canvas-radius)] border border-border p-3">
          <legend className="px-1 text-[13px] font-semibold text-foreground">Sprint {index + 1}</legend>
          <div className="grid gap-3 md:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateSprint(current, sprint.key, -1))}>Move up</Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateSprint(current, sprint.key, 1))}>Move down</Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending}
              onClick={() => removeSprint(sprint.key)}>Remove</Button>
          </div>
        </fieldset>)}
        <Button type="button" size="sm" variant="secondary"
          disabled={pending || !draft.releases.length || draft.sprints.length >= 200}
          onClick={addSprint}>Add sprint</Button>
        {!draft.sprints.length ? <p className="text-sm">No sprints yet.</p> : null}
      </> : <>
        {!draft.sprints.length ? <p className="text-sm">
          No sprints saved yet. A task can only be linked to a sprint that already exists on this template.{" "}
          <Link className="font-semibold text-primary-text"
            href={"/admin/projects/templates/" + props.templateId + "/sprints"}>Add sprints first</Link>.
        </p> : null}
        {draft.tasks.map((task, index) => <fieldset key={index}
          className="grid gap-3 rounded-[var(--lms-canvas-radius)] border border-border p-3">
          <legend className="px-1 text-[13px] font-semibold text-foreground">Task {index + 1}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={label}>Key (optional)
              <Input className={field} required maxLength={64} disabled={pending}
                value={task.key} onChange={event => updateTask(index, { key: event.target.value })}/>
            </label>
            <label className={label}>Sprint
              <Select className={field} disabled={pending} required value={task.sprintKey}
                onChange={event => updateTask(index, { sprintKey: event.target.value })}>
                {draft.sprints.map(sprint => <option key={sprint.key} value={sprint.key}>
                  {sprint.title}</option>)}
              </Select>
            </label>
            <label className={label}>Title
              <Input className={field} required maxLength={200} disabled={pending}
                value={task.title} onChange={event => updateTask(index, { title: event.target.value })}/>
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
          <label className={label}>What does done look like?
            <Textarea className={field} maxLength={4000} disabled={pending}
              value={task.acceptanceCriteria ?? ""} onChange={event =>
                updateTask(index, { acceptanceCriteria: event.target.value || undefined })}/>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateTask(current, task.key, -1))}>Move up</Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => moveTemplateTask(current, task.key, 1))}>Move down</Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending}
              onClick={() => setDraft(current => ({
                ...current, tasks: current.tasks.filter(item => item.key !== task.key),
              }))}>Remove</Button>
          </div>
        </fieldset>)}
        <Button type="button" size="sm" variant="secondary"
          disabled={pending || !draft.sprints.length || draft.tasks.length >= 2000}
          onClick={addTask}>Add task</Button>
        {!draft.tasks.length ? <p className="text-sm">No tasks yet.</p> : null}
      </>}
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="secondary" disabled={pending} onClick={() => {
          setDraft(props.blueprint); setError("");
        }}>Reset changes</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : props.section === "sprints" ? "Save sprints" : "Save tasks"}
        </Button>
      </div>
    </form> : null}
    {dialog}
  </section>;
}
