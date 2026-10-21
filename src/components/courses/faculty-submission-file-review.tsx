"use client";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";


import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { fileStatusDescriptor, formatFileSize } from "@/modules/storage/ui-models";
import { parseFileDownloadGrant, parseSubmissionFiles, storageApiError, type SubmissionFile } from "@/modules/courses/learner-storage-ui-model";

/** Teaching scope is enforced by the server, not by the learner-provided submission ID.
 * Legacy submissionAssets mixed files, URLs and written parts. vNext keeps
 * each verified file attachment separate, while the review card renders the
 * text answer and the sibling links panel renders all repository/website parts.
 * No legacy numeric asset IDs are trusted as storage grants. */
export function FacultySubmissionFileReview({ submissionId }: { submissionId: string }) {
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef<AbortController | null>(null);
  const grantRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadingRef.current = controller;
    async function list() {
      try {
        const response = await fetch(
          `/api/courses/assignment-submissions/${encodeURIComponent(submissionId)}/files`,
          { credentials: "same-origin", cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error(await storageApiError(response));
        const listed = parseSubmissionFiles(await response.json());
        if (listed.some(file => file.submissionId !== submissionId))
          throw new Error("The submitted files did not match this submission.");
        if (!controller.signal.aborted) setFiles(listed);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load submitted files.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void list();
    return () => { controller.abort(); grantRef.current?.abort(); };
  }, [submissionId]);

  async function open(file: SubmissionFile) {
    if (workingId || !fileStatusDescriptor(file.status).usable) return;
    const controller = new AbortController();
    grantRef.current = controller;
    setWorkingId(file.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/courses/assignment-submission-files/${encodeURIComponent(file.id)}/download-grant`,
        { method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disposition: "inline" }) },
      );
      if (!response.ok) throw new Error(await storageApiError(response));
      // Event-handler only (async click); the purity rule misreads this closure as render.
      // eslint-disable-next-line react-hooks/purity
      const grant = parseFileDownloadGrant(await response.json(), Date.now());
      if (grant.file.id !== file.id || grant.file.submissionId !== submissionId)
        throw new Error("The file permission does not match this submission.");
      if (controller.signal.aborted) return;
      // The signed URL is never rendered, cached, persisted or logged.
      const link = document.createElement("a");
      link.href = grant.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.referrerPolicy = "no-referrer";
      document.body.append(link);
      link.click();
      link.remove();
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load this submitted file");
    } finally {
      grantRef.current = null;
      setWorkingId(null);
    }
  }

  return <section aria-label="Uploaded file attachments" className="mt-3 space-y-2">
    <p className="text-sm font-semibold text-foreground">Uploaded file attachments</p>
    <p className="text-xs text-muted-foreground">Text answers and website or repository links are shown in the other submission details. Every file part appears here separately.</p>
    {loading ? <PageLoading label="Loading submitted files" variant="row" count={2} /> : null}
    {!loading && !error && files.length === 0 ?
      <EmptyState title="No uploaded file attachments" description="This submission may contain text or website links instead." /> : null}
    <ul className="space-y-2">
      {files.map(file => {
        const state = fileStatusDescriptor(file.status);
        return <li key={file.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded-[var(--lms-canvas-radius)] border border-border bg-surface px-3 py-2">
          <span className="min-w-0 flex-1 break-words text-sm text-body"><span className="sr-only">Uploaded File: </span>{file.originalName} · {formatFileSize(file.sizeBytes)}</span>
          <span title={state.detail}><StatusBadge tone={state.tone}>{state.label}</StatusBadge></span>
          {state.usable ? <Button size="md" className="min-h-11 md:min-h-[var(--lms-control-height)]" loading={workingId===file.id} type="button" variant="secondary"
            disabled={workingId !== null} onClick={() => void open(file)}>
            {workingId === file.id ? "Preparing file…" : "Open file"}
          </Button> : null}
        </li>;
      })}
    </ul>
    {error ? <Alert tone="error">{error}</Alert> : null}
  </section>;
}
