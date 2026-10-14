"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { validateLearnerAssignmentReadGrant } from "@/modules/courses/learner-assignment-file-model";
import { courseApiError } from "./learner-course-api";

type ReadGrant = ReturnType<typeof validateLearnerAssignmentReadGrant>;
export function AssignmentFileOpenControl({ submissionId, enabled }: { submissionId: string; enabled: boolean }) {
  const [grant, setGrant] = useState<ReadGrant | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, []);
  useEffect(() => {
    if (!grant) return;
    const timer = window.setTimeout(() => setGrant(null), Math.max(0, Date.parse(grant.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [grant]);

  async function prepare() {
    if (!enabled || lock.current) return;
    lock.current = true; setBusy(true); setError(null); setGrant(null);
    const controller = new AbortController(); pending.current = controller;
    try {
      const response = await fetch(`/api/courses/assignment-submissions/${encodeURIComponent(submissionId)}/file`, {
        credentials: "same-origin", cache: "no-store", signal: controller.signal,
      });
      if (!response.ok) throw new Error(await courseApiError(response));
      const next = validateLearnerAssignmentReadGrant(await response.json(), Date.now());
      if (!controller.signal.aborted) setGrant(next);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "The file could not be opened. Try again.");
    } finally {
      pending.current = null; lock.current = false; setBusy(false);
    }
  }
  if (!enabled) return <p className="text-sm text-muted-foreground">File viewing is currently unavailable. Your submitted record remains saved.</p>;
  return <section aria-label="Submitted assignment file" className="mt-3 space-y-3">
    <Button type="button" disabled={busy} onClick={() => void prepare()}>{busy ? "Preparing file…" : grant ? "Prepare a new file link" : "Prepare file link"}</Button>
    {grant ? <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
      <p className="break-words text-sm text-body">{grant.originalName} · {(grant.sizeBytes / 1024).toFixed(1)} KB</p>
      <Link href={grant.readUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" prefetch={false}
        onClick={event => {
          if (Date.parse(grant.expiresAt) <= Date.now()) {
            event.preventDefault(); setGrant(null); setError("File link expired. Prepare a new link.");
          }
        }} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-primary-text sm:w-auto">Open submitted file ↗</Link>
      <p className="text-xs text-muted-foreground">This private link expires shortly. Prepare another link if it expires.</p>
    </div> : null}
    {error ? <p role="alert" className="break-words text-sm font-semibold text-error">{error}</p> : null}
  </section>;
}
