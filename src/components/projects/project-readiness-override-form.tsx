"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

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
  compactLayout = false,
}: {
  projectId: string;
  initialState: ReadinessOverrideState | null;
  initialNote: string | null;
  hasSubmission?: boolean;
  compactLayout?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ReadinessOverrideState | "">(initialState ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    if (!state) { setFeedback("Choose an override state"); return; }
    if (state !== "CLEAR" && !note.trim()) {
      setFeedback(copy.noteRequired);
      return;
    }
    setFeedback(null);
    setConfirmOpen(true);
  }

  async function save() {
    if (pendingRef.current || !state) return;
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
    } catch (error) {
      // Keep the selected direction and the entered note for a safe retry.
      setFeedback(error instanceof Error && error.message.trim() ? error.message : "Failed to update readiness");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={requestSave} className={compactLayout?"min-w-0 space-y-[var(--lms-space-4)] pb-[var(--lms-space-4)]":"min-w-0 space-y-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-5)]"}>
        {compactLayout?null:<h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">{copy.overrideTitle}</h2>}
        {feedback&&!confirmOpen ? <Alert tone={feedback === copy.updated ? "success" : "error"} role={feedback === copy.updated ? "status" : "alert"}>{feedback}</Alert> : null}
        {hasSubmission && state !== "CLEAR" ? (
          <Alert tone="warning">
            Force Unlock/Block will have no effect here while a submission already exists.
          </Alert>
        ) : null}
        <div className="grid min-w-0 gap-[6px]">
        <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]" htmlFor="project-readiness-override">{copy.stateLabel}</label>
        <Select
          id="project-readiness-override"
          className="w-full"
          value={state}
          disabled={pending}
          onChange={(event) => {
            const nextState = event.target.value as ReadinessOverrideState;
            if (nextState !== state) setNote("");
            setState(nextState);
            setFeedback(null);
          }}
        >
          <option value="" disabled>Choose an override state</option>
          <option value="FORCE_UNLOCK">{copy.unlock}</option>
          <option value="FORCE_BLOCK">{copy.block}</option>
          <option value="CLEAR">{copy.clear}</option>
        </Select>
        </div>
        {Boolean(state) && state !== "CLEAR" ? (
          <div className="grid min-w-0 gap-[6px]">
            <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]" htmlFor="project-readiness-note">{copy.note}</label>
            <Textarea
              id="project-readiness-note"
              value={note}
              disabled={pending}
              required
              aria-invalid={feedback === copy.noteRequired && !note.trim()}
              onChange={(event) => { setNote(event.target.value); setFeedback(null); }}
              placeholder={copy.notePlaceholder}
              maxLength={2000}
              rows={3}
              className="w-full"
            />
          </div>
        ) : null}
        <div className="flex min-w-0 justify-stretch md:justify-end">
        <Button type="submit" variant="primary" loading={pending} disabled={pending || !state} className="min-h-11 w-full md:min-h-9 md:w-auto">
          {copy.submit}
        </Button>
        </div>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={next=>{if(!pending)setConfirmOpen(next);}}
        title={state === "CLEAR" ? copy.clearConfirm : copy.applyConfirm}
        description={state === "CLEAR" ? "The manual override will be removed." : "The chosen override will be visible to mentors and learners."}
        confirmLabel="Apply override"
        confirmVariant="primary"
        pending={pending}
        onConfirm={() => { void save(); }}
      >
        {feedback && feedback !== copy.updated ? <Alert tone="error" role="alert">{feedback}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}
