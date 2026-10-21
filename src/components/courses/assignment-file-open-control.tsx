"use client";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";


import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { fileStatusDescriptor, formatFileSize } from "@/modules/storage/ui-models";
import {
  parseFileDownloadGrant, parseSubmissionFiles, storageApiError,
  type SubmissionFile,
} from "@/modules/courses/learner-storage-ui-model";

/** Submitted files are discovered through the new private-file API. Signed URLs
 * are used once on demand, never put in React state or persistent storage. */
export function AssignmentFileOpenControl({ submissionId, enabled }: {
  submissionId: string; enabled: boolean;
}) {
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    pending.current = controller;
    async function load() {
      if (!enabled) return;
      try {
        const response = await fetch(
          `/api/courses/assignment-submissions/${encodeURIComponent(submissionId)}/files`,
          { credentials: "same-origin", cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error(await storageApiError(response));
        if (!controller.signal.aborted) setFiles(parseSubmissionFiles(await response.json()));
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load your submitted files.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    if (!enabled) queueMicrotask(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [submissionId, enabled, retryKey]);

  async function download(fileId: string, disposition: "inline" | "attachment" = "attachment") {
    if (busyId) return;
    const controller = new AbortController();
    pending.current = controller; setBusyId(fileId); setError(null);
    try {
      const response = await fetch(
        `/api/courses/assignment-submission-files/${encodeURIComponent(fileId)}/download-grant`,
        { method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ disposition }) },
      );
      if (!response.ok) throw new Error(await storageApiError(response));
      // Event-handler only (async click); the purity rule misreads this closure as render.
      // eslint-disable-next-line react-hooks/purity
      const grant = parseFileDownloadGrant(await response.json(), Date.now());
      if (grant.file.id !== fileId) throw new Error("The file permission did not match the requested file.");
      if (disposition === "inline" && (grant.file.contentType !== "application/pdf" ||
          grant.file.sizeBytes > 25 * 1024 * 1024 || grant.file.status !== "READY"))
        throw new Error("Unable to display the document inline.");
      if (controller.signal.aborted) return;
      // An ephemeral navigation only: never render, save, or log the signed URL.
      const link = document.createElement("a");
      link.href = grant.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.referrerPolicy = "no-referrer";
      if (disposition === "attachment") link.download = grant.file.originalName;
      document.body.append(link);
      link.click();
      link.remove();
    } catch (failure) {
      if (!controller.signal.aborted) setError(disposition === "inline"
        ? "Unable to display the document inline. Download the PDF instead."
        : failure instanceof Error ? failure.message : "File download failed. Try again.");
    } finally {
      pending.current = null; setBusyId(null);
    }
  }

  if (!enabled) return <p className="text-sm text-muted-foreground">File viewing is currently unavailable. Your submitted record remains saved.</p>;
  return <section aria-label="Submitted assignment files" className="min-w-0 space-y-3">
    {loading ? <PageLoading label="Loading submitted files" variant="row" count={2} /> : null}
    {!loading && !error && files.length === 0 ? <EmptyState title="No submitted files" description="No submitted files are available." /> : null}
    {!loading && files.length>0 ? <ul className="min-w-0 divide-y divide-border border-y border-border">
      {files.map(file => {
        const descriptor = fileStatusDescriptor(file.status);
        return <li key={file.id} className="flex min-w-0 flex-col items-stretch gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="min-w-0 flex-1 break-words text-sm text-body">{file.originalName} · {formatFileSize(file.sizeBytes)}</span>
          <span title={descriptor.detail} className="self-start sm:self-auto"><StatusBadge tone={descriptor.tone}>{descriptor.label}</StatusBadge></span>
          {descriptor.usable && file.contentType === "application/pdf" &&
           file.sizeBytes <= 25 * 1024 * 1024 ?
            <Button type="button" variant="secondary" size="sm"
              className="min-h-11 w-full sm:w-auto md:min-h-9"
              aria-label={`Open PDF ${file.originalName} in a new tab`}
              disabled={busyId !== null} onClick={() => void download(file.id,"inline")}>
              {busyId === file.id ? "Preparing PDF…" : "View PDF"}
            </Button> : null}
          {descriptor.usable ? <Button type="button" variant="secondary" size="sm" className="min-h-11 w-full sm:w-auto md:min-h-9"
            disabled={busyId !== null} onClick={() => void download(file.id)}>
            {busyId === file.id ? "Preparing file…" : "Download"}
          </Button> : null}
        </li>;
      })}
    </ul> : null}
    {error ? <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-start">
      <Alert tone="error">{error}</Alert>
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
        onClick={() => { setError(null); setLoading(true); setRetryKey(key => key + 1); }}>Retry</Button>
    </div> : null}
  </section>;
}
