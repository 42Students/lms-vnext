"use client";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { learnerTaskProgressSuccess } from "@/modules/projects/learner-task-progress-model";

export function LearnerTaskProgressControl(props: {
  projectId: string; taskId: string; status: string;
  blockerReason: string | null; updatedAt: string;
  canMoveUp: boolean; canMoveDown: boolean;
}) {
  const router = useRouter();
  const blockerId = useId();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [blockerNote, setBlockerNote] = useState(props.blockerReason ?? "");
  const [error, setError] = useState("");
  async function change(body: {
    action: "STATUS" | "MOVE_UP" | "MOVE_DOWN";
    status?: "TODO" | "IN_PROGRESS" | "BLOCKED";
    blockerNote?: string;
  }) {
    setPending(true); setError("");
    try {
      await projectMutation(
        "/api/projects/" + encodeURIComponent(props.projectId) +
        "/tasks/" + encodeURIComponent(props.taskId) + "/learner-progress",
        "PATCH", { ...body, expectedUpdatedAt: props.updatedAt },
      );
      showToast({ tone: "success", title: learnerTaskProgressSuccess(body.action, body.status) });
      setShowBlocker(false); router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Task update failed.";
      setError(message);
      showToast({ tone: "error", title: "Task update failed.", description: message });
    } finally { setPending(false); }
  }
  return <section className="mt-3 min-w-0 space-y-3 border-t border-border pt-3" aria-label="Task actions">
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {props.status !== "IN_PROGRESS" ? <Button variant="primary" size="sm" className="w-full sm:w-auto" disabled={pending}
        onClick={() => void change({ action: "STATUS", status: "IN_PROGRESS" })}>
        {props.status === "BLOCKED" ? "Resolve blocker" : "Start work"}
      </Button> : null}
      {props.status !== "TODO" ? <Button variant="secondary" size="sm" className="w-full sm:w-auto" disabled={pending}
        onClick={() => void change({ action: "STATUS", status: "TODO" })}>
        Move to To Do
      </Button> : null}
      {props.status !== "BLOCKED" ? <Button variant="secondary" size="sm" className="w-full sm:w-auto" disabled={pending}
        aria-expanded={showBlocker} aria-controls={blockerId}
        onClick={() => setShowBlocker(value => !value)}>Report blocker</Button> : null}
    </div>
    <div role="group" aria-label="Task order" className="flex min-w-0 flex-wrap items-center gap-2 border-t border-border pt-2">
      <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" disabled={pending || !props.canMoveUp}
        onClick={() => void change({ action: "MOVE_UP" })}>Move up</Button>
      <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" disabled={pending || !props.canMoveDown}
        onClick={() => void change({ action: "MOVE_DOWN" })}>Move down</Button>
    </div>
    {showBlocker ? <div id={blockerId} className="grid min-w-0 gap-3 border-t border-border pt-3">
      <label className="text-xs font-semibold text-body">Blocker note
        <Textarea className="mt-1"
          value={blockerNote} maxLength={2000} disabled={pending} aria-invalid={blockerNote.trim().length > 0 && blockerNote.trim().length < 3}
          onChange={event => { setBlockerNote(event.target.value); setError(""); }}
          placeholder="Describe what's blocking this task."/>
      </label>
      <p className="text-xs leading-5 text-muted-foreground">{blockerNote.trim().length}/2000 characters · at least 3 characters required</p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <Button size="sm" className="w-full sm:w-auto" loading={pending} disabled={pending || blockerNote.trim().length < 3}
          onClick={() => void change({ action: "STATUS", status: "BLOCKED", blockerNote: blockerNote.trim() })}>
          {pending ? "Saving your change…" : "Report blocker"}
        </Button>
        <Button variant="secondary" size="sm" className="w-full sm:w-auto" disabled={pending}
          onClick={() => { setShowBlocker(false); setError(""); }}>Cancel</Button>
      </div>
    </div> : null}
    {error ? <p role="alert" className="break-words text-sm text-error">{error}</p> : null}
  </section>;
}
