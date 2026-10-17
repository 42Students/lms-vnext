"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api-fetch";
import { projectReadinessLegacyCopy as copy } from "@/modules/projects/readiness-override-copy";
import type { ReadinessOverrideState } from "@/modules/projects/readiness-override-model";

export function ProjectReadinessOverrideForm({
  projectId,
  initialState,
  initialNote,
  hasSubmission = false,
}: {
  projectId: string;
  initialState: ReadinessOverrideState | null;
  initialNote: string | null;
  hasSubmission?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ReadinessOverrideState>(initialState ?? "CLEAR");
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    if (state !== "CLEAR" && !note.trim()) {
      setFeedback(copy.noteRequired);
      return;
    }
    setFeedback(null);
    setConfirmOpen(true);
  }

  async function save() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setFeedback(null);
    try {
      await apiFetch("/api/projects/" + encodeURIComponent(projectId) + "/readiness/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state === "CLEAR" ? { state } : { state, note: note.trim() }),
      });
      setConfirmOpen(false);
      setFeedback(copy.updated);
      router.refresh();
    } catch {
      // Keep the selected direction and the entered note for a safe retry.
      setFeedback(copy.failed);
      setConfirmOpen(false);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={requestSave} className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{copy.overrideTitle}</h2>
        {hasSubmission && state !== "CLEAR" ? (
          <p role="status" className="text-sm text-warning-text">
            Force Unlock/Block will have no effect here while a submission already exists.
          </p>
        ) : null}
        <label className="block text-sm font-medium" htmlFor="project-readiness-override">{copy.stateLabel}</label>
        <select
          id="project-readiness-override"
          className="w-full rounded border border-border bg-surface p-2"
          value={state}
          disabled={pending}
          onChange={(event) => {
            const nextState = event.target.value as ReadinessOverrideState;
            if (nextState !== state) setNote("");
            setState(nextState);
          }}
        >
          <option value="FORCE_UNLOCK">{copy.unlock}</option>
          <option value="FORCE_BLOCK">{copy.block}</option>
          <option value="CLEAR">{copy.clear}</option>
        </select>
        {state !== "CLEAR" ? (
          <>
            <label className="block text-sm font-medium" htmlFor="project-readiness-note">{copy.note}</label>
            <textarea
              id="project-readiness-note"
              value={note}
              disabled={pending}
              required
              onChange={(event) => setNote(event.target.value)}
              placeholder={copy.notePlaceholder}
              maxLength={2000}
              rows={3}
              className="w-full rounded border border-border bg-surface p-2"
            />
          </>
        ) : null}
        <button type="submit" disabled={pending} className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
          {copy.submit}
        </button>
        {feedback ? <p role="status" className="text-sm text-body">{feedback}</p> : null}
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={state === "CLEAR" ? copy.clearConfirm : copy.applyConfirm}
        description={state === "CLEAR" ? "The manual override will be removed." : "The chosen override will be visible to mentors and learners."}
        confirmLabel="Apply override"
        confirmVariant="primary"
        pending={pending}
        onConfirm={() => { void save(); }}
      />
    </>
  );
}
