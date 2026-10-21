"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { useProjectEditorDiscardGuard } from "./project-editor-discard-guard";
import type { ProjectTaskPlanRow } from "@/modules/projects/project-task-plan-model";

type SourceTask = ProjectTaskPlanRow & {
  status: string;
};
type SprintChoice = {
  id: string;
  title: string;
  status: string;
  releaseStatus: string;
};

const fields = (task: SourceTask): ProjectTaskPlanRow => ({
  id: task.id, key: task.key, title: task.title, priority: task.priority,
  sprintId: task.sprintId, estimatePoints: task.estimatePoints,
  taskType: task.taskType, dueLabel: task.dueLabel,
  description: task.description, acceptanceCriteria: task.acceptanceCriteria,
  approach: task.approach,
});

/** Admin-only task plan form. Changed rows are saved once under a whole-task-section CAS. */
export function ProjectTaskPlanEditor({ projectId, tasksToken, tasks, sprints }: {
  projectId: string;
  tasksToken: string;
  tasks: readonly SourceTask[];
  sprints: readonly SprintChoice[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const saving = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<ProjectTaskPlanRow[]>(() => tasks.map(fields));
  const baseline = tasks.map(fields);
  const changed = draft.filter((row, index) =>
    JSON.stringify(row) !== JSON.stringify(baseline[index]));
  const dirty = changed.length > 0;
  const eligibleSprints = sprints.filter(sprint =>
    ["PLANNED", "ACTIVE"].includes(sprint.status) && sprint.releaseStatus !== "SHIPPED");
  const bySprint = new Map(sprints.map(sprint => [sprint.id, sprint]));
  const activeRows = tasks.filter(task => !["DONE", "IN_REVIEW"].includes(task.status));
  const invalid = draft.some(row => {
    const old = baseline.find(task => task.id === row.id);
    const source = old?.sprintId ? bySprint.get(old.sprintId) : null;
    const target = row.sprintId ? bySprint.get(row.sprintId) : null;
    const sourceTask = tasks.find(task => task.id === row.id);
    const changedRow = JSON.stringify(old) !== JSON.stringify(row);
    const validWorkflowMove = old?.sprintId === row.sprintId || sourceTask?.status === "TODO" ||
      target?.status === "ACTIVE";
    const editable = validWorkflowMove &&
      (!source || (["PLANNED", "ACTIVE"].includes(source.status) &&
        source.releaseStatus !== "SHIPPED")) &&
      (!target || (["PLANNED", "ACTIVE"].includes(target.status) &&
        target.releaseStatus !== "SHIPPED"));
    return changedRow && (!editable || !row.key.trim() || row.key.length > 120 ||
      !row.title.trim() || row.title.length > 200 ||
      (row.dueLabel?.length ?? 0) > 160 ||
      (row.description?.length ?? 0) > 4000 ||
      (row.acceptanceCriteria?.length ?? 0) > 4000 ||
      (row.approach?.length ?? 0) > 4000);
  });
  const normalizedKeys = draft.map(row => row.key.trim().toLowerCase());
  const duplicatedKeys = draft.some((row, index) =>
    normalizedKeys[index] !== baseline[index]?.key.trim().toLowerCase() &&
    normalizedKeys.some((key, other) => other !== index && key === normalizedKeys[index]));
  const visible = tasks.map((task, index) => ({ task, row: draft[index]!, index }))
    .filter(({ row }) => !search.trim() ||
      (row.title + " " + row.key).toLowerCase().includes(search.trim().toLowerCase()));

  function close() {
    setDraft(tasks.map(fields));
    setOpen(false);
    setSearch("");
  }
  const guard = useProjectEditorDiscardGuard(open, dirty, pending, close);
  function setField<K extends keyof ProjectTaskPlanRow>(
    id: string, field: K, value: ProjectTaskPlanRow[K],
  ) {
    setDraft(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
  }
  function undo(id: string) {
    const old = baseline.find(row => row.id === id);
    if (old) setDraft(current => current.map(row => row.id === id ? { ...old } : row));
  }
  async function save() {
    if (pending || saving.current) return;
    if (!dirty) {
      showToast({ tone: "info", title: "No changes to save" });
      return;
    }
    if (invalid || duplicatedKeys || changed.length > 100) {
      showToast({ tone: "error", title: "Check task plan",
        description: changed.length > 100
          ? "Save up to 100 task edits at a time."
          : "Check task keys, titles and sprint choices before saving." });
      return;
    }
    saving.current = true;
    setPending(true);
    try {
      await projectMutation("/api/projects/" + encodeURIComponent(projectId) +
        "/tasks/plan", "PATCH", { expectedTasksToken: tasksToken, tasks: changed });
      showToast({ tone: "success", title: "Tasks saved" });
      setOpen(false);
      router.refresh();
    } catch (error) {
      showToast({ tone: "error", title: "Failed to update tasks",
        description: error instanceof Error ? error.message :
          "The task plan may have changed. Reload and try again." });
    } finally {
      saving.current = false;
      setPending(false);
    }
  }
  return <section aria-label="Task plan editor" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-5">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Work breakdown</p>
      <h3 className="mt-1 text-base font-semibold text-foreground">Task plan</h3>
      <p className="mt-1 text-sm leading-6 text-body">
        Define the work, estimate each task, and assign work to a sprint—or leave Sprint
        blank for the product backlog. Task workflow status and assignee are managed separately.
      </p>
    </div>
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {([
        ["Total tasks", tasks.length],
        ["Backlog", tasks.filter(task => task.sprintId === null).length],
        ["In progress", tasks.filter(task => task.status === "IN_PROGRESS").length],
        ["Completed", tasks.filter(task => task.status === "DONE").length],
      ] as const).map(([title, count]) => <div key={title}
        className="min-w-0 border-b border-[var(--lms-canvas-border)] py-2">
        <dt className="text-xs text-body">{title}</dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{count}</dd>
      </div>)}
    </dl>
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="secondary" aria-expanded={open} disabled={!tasks.length || activeRows.length === 0}
        onClick={() => { if (open) guard.requestClose(); else { setDraft(tasks.map(fields)); setOpen(true); } }}>
        {open ? "Close task plan" : "Edit task plan"}
      </Button>
      {!tasks.length ? <p className="text-xs text-body">No tasks yet. Create a task to start the plan.</p> : null}
      {tasks.length > 0 && activeRows.length === 0 ? <p className="text-xs text-body">
        Completed and in-review tasks cannot be edited in the plan.</p> : null}
    </div>
    {open ? <div className="space-y-3">
      {tasks.length > 12 ? <label className="block text-sm font-semibold text-body">
        Find an item in this section
        <Input type="search" className="mt-1" value={search}
          placeholder="Find by task title or key"
          onChange={event => setSearch(event.target.value)} />
      </label> : null}
      <p role="status" className="text-xs text-body">
        Showing {visible.length} of {tasks.length} tasks · {changed.length} unsaved edit{changed.length === 1 ? "" : "s"}.
      </p>
      {visible.map(({ task, row, index }) => {
        const sourceSprint = task.sprintId ? bySprint.get(task.sprintId) : null;
        const locked = ["DONE", "IN_REVIEW"].includes(task.status) ||
          (sourceSprint && (sourceSprint.status === "COMPLETED" ||
            sourceSprint.releaseStatus === "SHIPPED"));
        const rowDirty = JSON.stringify(row) !== JSON.stringify(baseline[index]);
        return <details key={task.id} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-2">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-foreground">
            {row.title || "Untitled task"} · {row.key} {locked ? " · Read only" : ""}
            {rowDirty ? " · Edited" : ""}
          </summary>
          <fieldset disabled={pending || Boolean(locked)} className="grid min-w-0 gap-3 py-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-body">Key
              <Input className="mt-1" maxLength={120} value={row.key}
                onChange={event => setField(row.id, "key", event.target.value)} />
            </label>
            <label className="text-xs font-semibold text-body">Priority
              <Select className="mt-1" value={row.priority}
                onChange={event => setField(row.id, "priority",
                  event.target.value as ProjectTaskPlanRow["priority"])}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </Select>
            </label>
            <label className="text-xs font-semibold text-body md:col-span-2">Title
              <Input className="mt-1" required maxLength={200} value={row.title}
                onChange={event => setField(row.id, "title", event.target.value)} />
            </label>
            <label className="text-xs font-semibold text-body">Sprint
              <Select className="mt-1" value={row.sprintId ?? ""}
                onChange={event => setField(row.id, "sprintId", event.target.value || null)}>
                <option value="">Backlog (no sprint)</option>
                {eligibleSprints.map(sprint =>
                  <option key={sprint.id} value={sprint.id}>{sprint.title}</option>)}
                {row.sprintId && !eligibleSprints.some(sprint => sprint.id === row.sprintId)
                  ? <option value={row.sprintId} disabled>Unavailable sprint</option> : null}
              </Select>
            </label>
            <label className="text-xs font-semibold text-body">Estimate
              <Select className="mt-1" value={row.estimatePoints === null ? "" : String(row.estimatePoints)}
                onChange={event => setField(row.id, "estimatePoints",
                  event.target.value === "" ? null : Number(event.target.value))}>
                <option value="">Not estimated</option>
                {[0, 1, 2, 3, 5, 8, 13, 21, 34, 55].map(points =>
                  <option key={points} value={points}>{points} pts</option>)}
                {row.estimatePoints !== null &&
                  ![0, 1, 2, 3, 5, 8, 13, 21, 34, 55].includes(row.estimatePoints)
                  ? <option value={row.estimatePoints}>{row.estimatePoints} pts (existing)</option> : null}
              </Select>
            </label>
            <label className="text-xs font-semibold text-body">Type
              <Select className="mt-1" value={row.taskType ?? ""}
                onChange={event => setField(row.id, "taskType",
                  (event.target.value || null) as ProjectTaskPlanRow["taskType"])}>
                <option value="">Not specified</option>
                <option value="STORY">Story</option><option value="BUG">Bug</option>
                <option value="CHORE">Chore</option><option value="SPIKE">Spike</option>
              </Select>
            </label>
            <label className="text-xs font-semibold text-body">Due (label, not calendar date)
              <Input className="mt-1" maxLength={160} value={row.dueLabel ?? ""}
                placeholder="e.g. Before sprint 1"
                onChange={event => setField(row.id, "dueLabel", event.target.value || null)} />
            </label>
            {(["description", "acceptanceCriteria", "approach"] as const).map(field =>
              <label key={field} className="text-xs font-semibold text-body md:col-span-2">
                {field === "description" ? "Description" :
                  field === "acceptanceCriteria" ? "Done when (optional)" : "Approach (optional)"}
                <Textarea className="mt-1" value={row[field] ?? ""} maxLength={4000} rows={3}
                  onChange={event => setField(row.id, field, event.target.value || null)} />
              </label>)}
            <div className="md:col-span-2">
              <Button size="sm" variant="ghost" disabled={!rowDirty || pending}
                onClick={() => undo(row.id)}>Undo row</Button>
            </div>
          </fieldset>
        </details>;
      })}
      {invalid || duplicatedKeys ? <p role="alert" className="text-sm text-error">
        Resolve invalid titles, repeated keys, or unavailable sprint choices before saving.
      </p> : null}
      <div className="flex flex-wrap gap-2">
        <Button loading={pending} disabled={pending || invalid || duplicatedKeys || changed.length > 100}
          onClick={() => void save()}>{pending ? "Saving…" : "Save task plan"}</Button>
        <Button variant="secondary" disabled={pending || !dirty}
          onClick={() => setDraft(baseline)}>Undo all changes</Button>
        <Button variant="ghost" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
      </div>
    </div> : null}
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard task plan changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard} />
  </section>;
}
