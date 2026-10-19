"use client";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  return <section className="mt-3 space-y-2" aria-label="Task actions">
    <div className="flex flex-wrap gap-2">
      {props.status !== "IN_PROGRESS" ? <Button variant="secondary" size="sm" disabled={pending}
        onClick={() => void change({ action: "STATUS", status: "IN_PROGRESS" })}>
        {props.status === "BLOCKED" ? "Resolve blocker" : "Start work"}
      </Button> : null}
      {props.status !== "TODO" ? <Button variant="secondary" size="sm" disabled={pending}
        onClick={() => void change({ action: "STATUS", status: "TODO" })}>
        Move to To Do
      </Button> : null}
      {props.status !== "BLOCKED" ? <Button variant="secondary" size="sm" disabled={pending}
        onClick={() => setShowBlocker(value => !value)}>Report blocker</Button> : null}
      <Button variant="secondary" size="sm" disabled={pending || !props.canMoveUp}
        onClick={() => void change({ action: "MOVE_UP" })}>Move up</Button>
      <Button variant="secondary" size="sm" disabled={pending || !props.canMoveDown}
        onClick={() => void change({ action: "MOVE_DOWN" })}>Move down</Button>
    </div>
    {showBlocker ? <div className="grid gap-2">
      <label className="text-xs font-semibold text-body">Blocker note
        <Textarea className="mt-1"
          value={blockerNote} maxLength={4000} disabled={pending}
          onChange={event => setBlockerNote(event.target.value)}
          placeholder="Describe what's blocking this task."/>
      </label>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending || !blockerNote.trim()}
          onClick={() => void change({ action: "STATUS", status: "BLOCKED", blockerNote: blockerNote.trim() })}>
          {pending ? "Saving your change…" : "Report blocker"}
        </Button>
        <Button variant="secondary" size="sm" disabled={pending}
          onClick={() => setShowBlocker(false)}>Cancel</Button>
      </div>
    </div> : null}
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
  </section>;
}
