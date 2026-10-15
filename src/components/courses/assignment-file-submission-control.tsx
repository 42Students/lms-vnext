"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { learnerAssignmentFileAccept, learnerAssignmentFilePayload } from "@/modules/courses/learner-assignment-file-model";
import { transferLearnerAssignmentFile } from "./assignment-file-transfer";
import { selectLearnerAssignmentFile } from "@/modules/courses/learner-assignment-file-selection-model";
import { courseApiError } from "./learner-course-api";

type UploadedFile = Awaited<ReturnType<typeof transferLearnerAssignmentFile>>;
export function AssignmentFileSubmissionControl({ assignmentId, deliveryId, onBusyChange, onSubmitted }: {
  assignmentId: string; deliveryId: string; onBusyChange: (busy: boolean) => void; onSubmitted: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, []);

  async function perform(action: "UPLOAD" | "SUBMIT") {
    if (lock.current) return;
    if (action === "UPLOAD" && !file) { setError("Choose a file first."); return; }
    if (action === "SUBMIT" && (!uploaded || !confirmed)) {
      setError("Upload a file and confirm the final submission first."); return;
    }
    lock.current = true;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); onBusyChange(true); setError(null);
    try {
      if (action === "UPLOAD" && file) {
        const receipt = await transferLearnerAssignmentFile(assignmentId, deliveryId, file, controller.signal);
        setUploaded(receipt); setConfirmed(false);
      } else if (uploaded) {
        if (Date.parse(uploaded.expiresAt) <= Date.now()) {
          setUploaded(null); throw new Error("Upload permission expired. Upload the file again.");
        }
        const { confirmed: _confirmation, ...payload } = learnerAssignmentFilePayload(deliveryId, uploaded.receiptId, confirmed);
        void _confirmation;
        const response = await fetch(`/api/courses/assignments/${encodeURIComponent(assignmentId)}/submit`, {
          method: "POST", credentials: "same-origin", signal: controller.signal,
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(await courseApiError(response));
        onSubmitted();
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "The file action failed. Try again.");
    } finally {
      lock.current = false; pending.current = null; setBusy(false); onBusyChange(false);
    }
  }
  return <section aria-label="Assignment file submission" className="mt-4 space-y-3">
    <label className="block text-sm font-semibold text-body">Assignment file
      <input type="file" accept={learnerAssignmentFileAccept} disabled={busy}
        className="mt-2 block min-h-11 w-full max-w-full text-sm"
        onChange={event => { const selection = selectLearnerAssignmentFile(deliveryId, event.target.files?.[0] ?? null); setFile(selection.file); setUploaded(null); setConfirmed(false); setError(selection.error); }} />
    </label>
    <p className="text-xs leading-5 text-muted-foreground">Choose one supported document, image or ZIP file up to 50 MB. Uploading does not submit the assignment. Files must pass security checks before final submission.</p>
    <Button type="button" disabled={busy || !file} onClick={() => void perform("UPLOAD")}>{busy && !uploaded ? "Uploading…" : "Upload file"}</Button>
    {uploaded ? <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <p role="status" className="break-words text-sm text-body">Uploaded: {uploaded.originalName}. Confirm below to submit it.</p>
      <label className="flex min-h-11 items-start gap-2 text-sm text-body">
        <input type="checkbox" checked={confirmed} disabled={busy} className="mt-1"
          onChange={event => setConfirmed(event.target.checked)} />
        <span>I confirm this is my final assignment submission and cannot be replaced after it is recorded.</span>
      </label>
      <Button type="button" disabled={busy || !confirmed} onClick={() => void perform("SUBMIT")}>{busy ? "Submitting…" : "Submit file"}</Button>
    </div> : null}
    {error ? <p role="alert" className="break-words text-sm font-semibold text-error">{error}</p> : null}
  </section>;
}
