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

type MeetingRow = {
  id: string;status:string;title:string;agenda:string|null;
  meetingKey:string|null;meetingType:string;meetingUrl:string|null;
  outcome:string|null;
  startsAt: string; endsAt: string;
  linkedSprintId: string | null; linkedTaskId: string | null;
};
type Choice = { id: string; title: string };
type TaskChoice = Choice & { sprintId: string | null };
type Draft = Omit<MeetingRow,"status"|"meetingKey"|"outcome"> & {key:string;notes:string|null};

function localIst(iso: string) {
  const value = new Date(iso);
  return Number.isFinite(value.getTime())
    ? new Date(value.getTime() + 330 * 60_000).toISOString().slice(0, 16)
    : "";
}
function asIso(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) {
    throw new Error("Enter a valid IST meeting date and time.");
  }
  const value = new Date(local + ":00+05:30");
  if (!Number.isFinite(value.getTime())) throw new Error("Enter a valid meeting date.");
  return value.toISOString();
}
function toDraft(meeting: MeetingRow): Draft {
  return {
    id:meeting.id,title:meeting.title,agenda:meeting.agenda,
    meetingType:meeting.meetingType,meetingUrl:meeting.meetingUrl,
    notes:meeting.outcome,key:meeting.meetingKey??("meeting-"+meeting.id.slice(0,8)),
    startsAt: localIst(meeting.startsAt), endsAt: localIst(meeting.endsAt),
    linkedSprintId: meeting.linkedSprintId, linkedTaskId: meeting.linkedTaskId,
  };
}

/** Only unannounced DRAFT meetings may be edited together; live meetings use lifecycle controls. */
export function ProjectMeetingPlanEditor({ projectId, meetingsToken, meetings, sprints, tasks }: {
  projectId: string;
  meetingsToken: string;
  meetings: readonly MeetingRow[];
  sprints: readonly Choice[];
  tasks: readonly TaskChoice[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const saving = useRef(false);
  const sourceDrafts = meetings.filter(row => row.status === "DRAFT");
  // The legacy Meetings page opens its repeating form without an extra click.
  const [open, setOpen] = useState(sourceDrafts.length > 0);
  const [pending, setPending] = useState(false);
  const baseline = sourceDrafts.map(toDraft);
  const [draft, setDraft] = useState<Draft[]>(() => baseline);
  const changed = draft.filter(row => {
    const original = baseline.find(item => item.id === row.id);
    return JSON.stringify(row) !== JSON.stringify(original);
  });
  const dirty = changed.length > 0;
  // Legacy RepeatingItemEditor reports the first row missing its title as "Item N: Title required".
  const missingTitleAt = draft.findIndex(row => !row.title.trim() &&
    changed.some(item => item.id === row.id));
  // A historic untouched draft must not prevent saving a different, valid draft.
  const valid = changed.every(row => {
    const start = Date.parse(row.startsAt + ":00+05:30");
    const end = Date.parse(row.endsAt + ":00+05:30");
    return row.title.trim().length>0 && row.title.trim().length<=200 &&
      row.key.trim().length>0 && row.key.length<=120 &&
      (row.notes?.length??0)<=4000 &&
      (!row.meetingUrl||/^https?:\/\//.test(row.meetingUrl)) &&
      (row.agenda?.length ?? 0) <= 4000 &&
      Number.isFinite(start) && Number.isFinite(end) && end > start &&
      (!row.linkedSprintId || sprints.some(sprint => sprint.id === row.linkedSprintId)) &&
      (!row.linkedTaskId || tasks.some(task => task.id === row.linkedTaskId &&
        (!row.linkedSprintId || task.sprintId === row.linkedSprintId)));
  });
  function reset() {
    setDraft(sourceDrafts.map(toDraft));
    setOpen(false);
  }
  const guard = useProjectEditorDiscardGuard(open, dirty, pending, reset);
  function update<K extends keyof Draft>(id:string,field:K,value:Draft[K]){
    setDraft(current=>current.map(row=>row.id===id?{...row,[field]:value}:row));
  }
  function changeTimePart(id:string,field:"startsAt"|"endsAt",
    part:"date"|"time",value:string){
    setDraft(current=>current.map(row=>{
      if(row.id!==id)return row;
      const [date="",time=""]=row[field].split("T");
      return {...row,[field]:part==="date"?value+"T"+time:date+"T"+value};
    }));
  }
  async function save() {
    if (pending || saving.current) return;
    if (!changed.length) {
      showToast({ tone: "info", title: "No changes to save" });
      return;
    }
    if (!valid || changed.length > 500) {
      showToast({ tone: "error", title: "Check meeting plan details",
        description: "Check titles, IST date and time windows, and work links before saving." });
      return;
    }
    saving.current = true;
    setPending(true);
    try {
      await projectMutation("/api/projects/" + encodeURIComponent(projectId) +
        "/meetings/plan", "PATCH", {
          expectedMeetingsToken: meetingsToken,
          meetings: changed.map(row => ({
            id:row.id,title:row.title.trim(),agenda:row.agenda?.trim()||null,
            key:row.key.trim(),meetingType:row.meetingType,
            meetingUrl:row.meetingUrl?.trim()||null,notes:row.notes?.trim()||null,
            startsAt: asIso(row.startsAt), endsAt: asIso(row.endsAt),
            linkedSprintId: row.linkedSprintId, linkedTaskId: row.linkedTaskId,
          })),
        });
      setOpen(false);
      showToast({ tone: "success", title: "Meetings updated" });
      router.refresh();
    } catch (error) {
      showToast({ tone: "error", title: "Failed to update meetings",
        description: error instanceof Error ? error.message : "Reload the current meeting plan and try again." });
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return <section aria-label="Meeting plan"
    className="min-w-0 space-y-4 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 sm:p-5">
    <div>
      <h2 className="text-lg font-semibold text-foreground">Meeting plan</h2>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-body">Team cadence</p>
      <h3 className="mt-1 text-base font-semibold text-foreground">
        Keep project conversations attached to the work they move forward
      </h3>
      <p className="mt-1 text-sm leading-6 text-body">
        Use the date and time controls for scheduling, and link meetings to a sprint or task when the
        conversation is about specific delivery work.
      </p>
    </div>
    <dl aria-label="Meeting plan summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {([
        ["Meetings", meetings.length],
        ["Upcoming / requested", meetings.filter(row =>
          ["REQUESTED", "SCHEDULED", "RESCHEDULED"].includes(row.status)).length],
        ["Completed", meetings.filter(row => row.status === "COMPLETED").length],
        ["Linked to work", meetings.filter(row => row.linkedSprintId || row.linkedTaskId).length],
      ] as const).map(([name, count]) => <div key={name} className="border-b border-border px-2 py-2">
        <dt className="text-xs text-muted-foreground">{name}</dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums">{count}</dd>
      </div>)}
    </dl>
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="secondary" aria-expanded={open}
        disabled={!sourceDrafts.length}
        onClick={() => { if (open) guard.requestClose(); else {
          setDraft(sourceDrafts.map(toDraft)); setOpen(true);
        } }}>{open ? "Close meeting plan" : "Edit meeting plan"}</Button>
      {!sourceDrafts.length ? <p className="text-xs text-body">
        No draft meetings to edit together. Use Schedule meeting for new meetings.
      </p> : null}
    </div>
    {open ? <div className="min-w-0 space-y-4">
      <p className="text-sm text-body">
        Only unscheduled drafts can be saved together. Requested, scheduled and completed
        meetings retain their dedicated controls and notifications.
      </p>
      {draft.map((row, index) => <fieldset key={row.id} disabled={pending}
        className="min-w-0 space-y-3 border-t border-[var(--lms-canvas-border)] pt-4">
        <legend className="text-sm font-semibold text-foreground">
          {row.title || "Meeting " + (index + 1)}
        </legend>
        <label className="block text-[13px] font-semibold text-body">Title
          <Input className="mt-1" required maxLength={200} value={row.title}
            aria-invalid={!row.title.trim()} placeholder="e.g. Weekly sync"
            onChange={event => update(row.id, "title", event.target.value)} />
        </label>
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <label className="text-[13px] font-semibold text-body">Meeting key
            <Input className="mt-1" maxLength={120} value={row.key}
              onChange={event=>update(row.id,"key",event.target.value)}/>
          </label>
          <label className="text-[13px] font-semibold text-body">Ceremony
            <Select className="mt-1" value={row.meetingType}
              onChange={event=>update(row.id,"meetingType",event.target.value)}>
              <option value="GENERAL">General</option>
              <option value="PLANNING">Planning</option>
              <option value="STANDUP">Standup</option>
              <option value="REVIEW">Review</option>
              <option value="RETRO">Retrospective</option>
            </Select>
          </label>
        </div>
        <label className="block text-[13px] font-semibold text-body">Meeting URL
          <Input className="mt-1" type="url" maxLength={2048} value={row.meetingUrl??""}
            placeholder="https://…" onChange={event=>update(row.id,"meetingUrl",event.target.value||null)}/>
        </label>
        <label className="block text-[13px] font-semibold text-body">Notes
          <Textarea className="mt-1" maxLength={4000} value={row.notes??""}
            onChange={event=>update(row.id,"notes",event.target.value||null)}/>
        </label>
        <label className="block text-[13px] font-semibold text-body">Agenda (optional)
          <Textarea className="mt-1" maxLength={4000} value={row.agenda ?? ""}
            placeholder="What this meeting covers"
            onChange={event => update(row.id, "agenda", event.target.value || null)} />
        </label>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="block text-[13px] font-semibold text-body">Date · IST
            <Input className="mt-1" type="date" required
              value={row.startsAt.slice(0,10)}
              onChange={event=>changeTimePart(row.id,"startsAt","date",event.target.value)}/>
          </label>
          <label className="block text-[13px] font-semibold text-body">Start time · IST
            <Input className="mt-1" type="time" required value={row.startsAt.slice(11,16)}
              onChange={event=>changeTimePart(row.id,"startsAt","time",event.target.value)}/>
          </label>
          <label className="block text-[13px] font-semibold text-body">End date · IST
            <Input className="mt-1" type="date" required value={row.endsAt.slice(0,10)}
              onChange={event=>changeTimePart(row.id,"endsAt","date",event.target.value)}/>
          </label>
          <label className="block text-[13px] font-semibold text-body">End time · IST
            <Input className="mt-1" type="time" required value={row.endsAt.slice(11,16)}
              onChange={event=>changeTimePart(row.id,"endsAt","time",event.target.value)}/>
          </label>
          <label className="block text-[13px] font-semibold text-body">Linked sprint
            <Select className="mt-1" value={row.linkedSprintId ?? ""}
              onChange={event => update(row.id, "linkedSprintId", event.target.value || null)}>
              <option value="">No sprint</option>
              {sprints.map(sprint => <option key={sprint.id} value={sprint.id}>{sprint.title}</option>)}
            </Select>
          </label>
          <label className="block text-[13px] font-semibold text-body">Linked task
            <Select className="mt-1" value={row.linkedTaskId ?? ""}
              onChange={event => update(row.id, "linkedTaskId", event.target.value || null)}>
              <option value="">No task</option>
              {tasks.filter(task => !row.linkedSprintId || task.sprintId === row.linkedSprintId)
                .map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
              {row.linkedTaskId && !tasks.some(task => task.id === row.linkedTaskId &&
                (!row.linkedSprintId || task.sprintId === row.linkedSprintId))
                ? <option value={row.linkedTaskId} disabled>Unavailable task</option> : null}
            </Select>
          </label>
        </div>
        <Button size="sm" variant="ghost"
          disabled={pending || JSON.stringify(row) === JSON.stringify(baseline[index])}
          onClick={() => {
            const original = baseline.find(item => item.id === row.id);
            if (original) setDraft(current =>
              current.map(item => item.id === row.id ? { ...original } : item));
          }}>Undo row</Button>
      </fieldset>)}
      {missingTitleAt >= 0 ? <p role="alert" className="text-sm font-semibold text-error">
        Item {missingTitleAt + 1}: Title required
      </p> : null}
      {changed.length > 500 ? <p role="alert" className="text-sm font-semibold text-error">
        This section holds {changed.length} changed rows; the server accepts at most 500. Remove {changed.length - 500} before saving.
      </p> : null}
      {!valid ? <p role="alert" className="text-sm font-semibold text-error">
        Check meeting dates in IST: the end must follow the start.
        Linked tasks must belong to the selected sprint.
      </p> : null}
      <div className="flex flex-wrap gap-2">
        <Button loading={pending} disabled={pending || !valid || changed.length > 500}
          onClick={() => void save()}>{pending ? "Saving…" : "Save meeting plan"}</Button>
        <Button variant="secondary" disabled={pending || !dirty}
          onClick={() => setDraft(baseline)}>Undo all changes</Button>
        <Button variant="ghost" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Calendar sync and follow-up state remain system-managed.
      </p>
    </div> : null}
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard meeting plan changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard} />
  </section>;
}
