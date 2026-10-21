"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { useProjectEditorDiscardGuard } from "./project-editor-discard-guard";

type SprintRow = {
  id: string;
  key:string;
  dueLabel:string|null;
  title: string;
  description: string | null;
  goal: string | null;
  definitionOfDone: string | null;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  updatedAt: string;
  status: string;
  sequence: number;
};

type Draft = Omit<SprintRow, "status" | "sequence">;
const draftFrom = (row: SprintRow): Draft => ({
  id: row.id,key:row.key,dueLabel:row.dueLabel,
  title: row.title, description: row.description,
  goal: row.goal, definitionOfDone: row.definitionOfDone,
  startDate: row.startDate, endDate: row.endDate, dueDate: row.dueDate,
  updatedAt: row.updatedAt,
});

/** A single save for an entire release's planned sprints, with local move/undo. */
export function ProjectSprintPlanEditor({ projectId, releaseId, sprints }: {
  projectId: string;
  releaseId: string;
  sprints: readonly SprintRow[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [draft, setDraft] = useState<Draft[]>(() => sprints.map(draftFrom));
  const baseline = sprints.map(draftFrom);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const editable = sprints.length > 0 && sprints.length <= 500 &&
    sprints.every(sprint => sprint.status === "PLANNED");
  const datesValid = draft.every(sprint =>
    (!sprint.startDate || !sprint.endDate || sprint.endDate >= sprint.startDate) &&
    (!sprint.startDate || !sprint.dueDate || sprint.dueDate >= sprint.startDate));
  const textValid = draft.every(sprint =>
    sprint.title.trim().length > 0 && sprint.title.trim().length <= 200 &&
    sprint.key.trim().length>0 && sprint.key.length<=120 &&
    (sprint.dueLabel?.length??0)<=160 &&
    (sprint.description?.length ?? 0) <= 4000 &&
    (sprint.goal?.length ?? 0) <= 4000 &&
    (sprint.definitionOfDone?.length ?? 0) <= 4000);

  function reset() {
    setDraft(sprints.map(draftFrom));
    setOpen(false);
  }
  const guard = useProjectEditorDiscardGuard(open, dirty, pending, reset);
  function change(id: string, field: keyof Pick<Draft,
    "title" | "key" | "dueLabel" | "description" | "goal" | "definitionOfDone" |
    "startDate" | "endDate" | "dueDate">,
    value: string) {
    setDraft(current => current.map(row => row.id === id
      ? { ...row, [field]: field === "title" ? value : value || null } : row));
  }
  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    setDraft(current => {
      if (index < 0 || other < 0 || other >= current.length) return current;
      const result = [...current];
      [result[index], result[other]] = [result[other]!, result[index]!];
      return result;
    });
  }
  function restore(id: string) {
    const source = baseline.find(row => row.id === id);
    if (source) setDraft(current => current.map(row => row.id === id ? { ...source } : row));
  }
  async function save() {
    if (pending || saving.current || !editable) return;
    if (!dirty) {
      showToast({ tone: "info", title: "No changes to save" });
      return;
    }
    if (!datesValid || !textValid) {
      showToast({ tone: "error", title: "Check sprint plan details",
        description: "Enter a title and valid sprint dates before saving." });
      return;
    }
    saving.current = true;
    setPending(true);
    try {
      await projectMutation("/api/projects/" + encodeURIComponent(projectId) +
        "/sprints/plan", "PATCH", {
        releaseId,
        sprints: draft.map(row => ({
          id: row.id, expectedUpdatedAt: row.updatedAt,
          key:row.key.trim(),dueLabel:row.dueLabel?.trim()||null,
          title: row.title.trim(), description: row.description?.trim() || null,
          goal: row.goal?.trim() || null,
          definitionOfDone: row.definitionOfDone?.trim() || null,
          startDate: row.startDate, endDate: row.endDate, dueDate: row.dueDate,
        })),
      });
      setOpen(false);
      showToast({ tone: "success", title: "Sprints updated" });
      router.refresh();
    } catch (error) {
      showToast({ tone: "error", title: "Failed to update sprints",
        description: error instanceof Error ? error.message : "Reload the current plan and try again." });
    } finally {
      saving.current = false;
      setPending(false);
    }
  }
  if (!editable) return <p className="text-xs text-body">
    {sprints.length > 500 ? "This release has more than 500 sprints. Edit them individually." :
      "Bulk sprint editing is available while every sprint in the release is Planned."}
  </p>;

  return <section aria-label="Bulk sprint plan editor" className="min-w-0 space-y-3">
    <Button size="sm" variant="secondary" aria-expanded={open}
      onClick={() => { if (open) guard.requestClose(); else { setDraft(sprints.map(draftFrom)); setOpen(true); } }}>
      {open ? "Close sprint plan" : "Edit sprint plan"}
    </Button>
    {open ? <div className="min-w-0 space-y-4 border-y border-[var(--lms-canvas-border)] py-4">
      <p className="text-sm text-body">
        Edit planned sprints, move rows Up or Down, then Save sprint plan once.
        Only this release is updated; tasks, meetings and resources are unchanged.
      </p>
      {draft.map((row, index) => {
        const original = baseline.find(sprint => sprint.id === row.id);
        return <fieldset key={row.id} disabled={pending}
          className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4 last:border-b-0">
          <legend className="text-sm font-semibold text-foreground">
            Sprint {index + 1}
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" disabled={pending || index === 0}
              onClick={() => move(index, -1)}>Up</Button>
            <Button size="sm" variant="secondary" disabled={pending || index === draft.length - 1}
              onClick={() => move(index, 1)}>Down</Button>
            <Button size="sm" variant="ghost" disabled={pending ||
              (original ? JSON.stringify(original) === JSON.stringify(row) : false)}
              onClick={() => restore(row.id)}>Undo row</Button>
          </div>
          <label className="block text-[13px] font-semibold text-body">Sprint title
            <Input className="mt-1" required maxLength={200}
              aria-invalid={!row.title.trim()}
              value={row.title} onChange={event => change(row.id, "title", event.target.value)} />
            {!row.title.trim()?<span role="alert" className="text-xs text-error">
              Item {index+1}: Title required
            </span>:null}
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-[13px] font-semibold text-body">Sprint key
              <Input className="mt-1" maxLength={120} value={row.key}
                onChange={event=>change(row.id,"key",event.target.value)}/>
            </label>
            <label className="text-[13px] font-semibold text-body">Due label
              <Input className="mt-1" maxLength={160} value={row.dueLabel??""}
                onChange={event=>change(row.id,"dueLabel",event.target.value)}/>
            </label>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {(["description", "goal", "definitionOfDone"] as const).map(field =>
              <label key={field} className="block text-[13px] font-semibold text-body">
                {field === "description" ? "Description" :
                  field === "goal" ? "Sprint goal" : "What does done look like?"}
                <Textarea className="mt-1" maxLength={4000}
                  value={row[field] ?? ""}
                  onChange={event => change(row.id, field, event.target.value)} />
              </label>)}
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            {(["startDate", "endDate", "dueDate"] as const).map(field =>
              <label key={field} className="block text-[13px] font-semibold text-body">
                {field === "startDate" ? "Start date" :
                  field === "endDate" ? "End date" : "Due date"}
                <Input className="mt-1" type="date" value={row[field] ?? ""}
                  onChange={event => change(row.id, field, event.target.value)} />
              </label>)}
          </div>
        </fieldset>;
      })}
      {!datesValid ? <p role="alert" className="text-sm font-semibold text-error">
        Sprint end and due dates must not come before the start date.
      </p> : null}
      <div className="flex flex-wrap gap-2">
        <Button loading={pending} disabled={pending || !datesValid || !textValid}
          onClick={() => void save()}>{pending ? "Saving…" : "Save sprint plan"}</Button>
        <Button variant="secondary" disabled={pending} onClick={() => setDraft(baseline)}>
          Undo all changes
        </Button>
        <Button variant="ghost" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
      </div>
    </div> : null}
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard sprint plan changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard} />
  </section>;
}
