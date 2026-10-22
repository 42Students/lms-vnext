"use client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MetricBar } from "@/components/ui/metric-bar";
import uploadStyles from "./legacy-upload-meter.module.css";
import { Alert } from "@/components/ui/alert";
import {AssignmentMultipartPartsEditor,type AssignmentLinkPart} from "./assignment-multipart-parts-editor";
import {ALL_ASSIGNMENT_METHODS,type AssignmentMethod} from "@/modules/courses/assignment-submission-methods";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  acceptAttributeFor, fileStatusDescriptor, formatFileSize, limitsSummary,
  MAX_ASSIGNMENT_FILES_PER_SUBMISSION, storageErrorMessage,
} from "@/modules/storage/ui-models";
import {
  canRemoveStagedFile, canSubmitStagedFiles, parseSubmissionFiles, readySubmissionFileIds,
  storageApiError, type SubmissionFile,
} from "@/modules/courses/learner-storage-ui-model";
import {
  checkedAssignmentFileDeclaration, refreshStagedAssignmentFile, uploadStagedAssignmentFile,
} from "./assignment-staged-file-transfer";

export function AssignmentFileSubmissionControl({
  assignmentId, deliveryId, onBusyChange, onSubmitted, multipartEnabled=false,pdfOnly=false,uploadsAllowed=true,allowedMethods=ALL_ASSIGNMENT_METHODS,
}: { assignmentId: string; deliveryId: string; onBusyChange: (busy: boolean) => void; onSubmitted: () => void;
 multipartEnabled?:boolean;pdfOnly?:boolean;uploadsAllowed?:boolean;
 allowedMethods?:readonly AssignmentMethod[] }) {
  const [selected, setSelected] = useState<File[]>([]);
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [responseText,setResponseText]=useState("");
  const [links,setLinks]=useState<AssignmentLinkPart[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const active = useRef<AbortController | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(
          `/api/courses/assignments/${encodeURIComponent(assignmentId)}/submission-files?deliveryId=${encodeURIComponent(deliveryId)}`,
          { credentials: "same-origin", cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error(await storageApiError(response));
        const listed = parseSubmissionFiles(await response.json());
        if (!controller.signal.aborted) setFiles(listed.filter(file => file.submissionId === null));
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load your files.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => { controller.abort(); active.current?.abort(); };
  }, [assignmentId, deliveryId, retryKey]);

  async function refresh(signal: AbortSignal) {
    const response = await fetch(
      `/api/courses/assignments/${encodeURIComponent(assignmentId)}/submission-files?deliveryId=${encodeURIComponent(deliveryId)}`,
      { credentials: "same-origin", cache: "no-store", signal },
    );
    if (!response.ok) throw new Error(await storageApiError(response));
    setFiles(parseSubmissionFiles(await response.json()).filter(file => file.submissionId === null));
  }

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setError(null); onBusyChange(true);
    try {
      await action(controller.signal);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "The file action failed. Try again.");
    } finally {
      active.current = null; locked.current = false;
      setBusy(false); onBusyChange(false); setActiveName(null); setProgress(0);
    }
  }

  function select(input: FileList | null) {
    const next = Array.from(input ?? []);
    const slots = MAX_ASSIGNMENT_FILES_PER_SUBMISSION - files.length;
    if (next.length > slots) {
      setError(`You can add up to ${MAX_ASSIGNMENT_FILES_PER_SUBMISSION} files. Remove a staged file first.`);
      setSelected([]); return;
    }
    for (const file of next) {
      if(pdfOnly && (file.name.split(".").at(-1)?.toLowerCase()!=="pdf" || (file.type && file.type!=="application/pdf"))){
        setError("Only PDF files are allowed.");setSelected([]);return;
      }
      const checked = checkedAssignmentFileDeclaration(file, deliveryId);
      if (!checked.ok) {
        setError(storageErrorMessage(checked.error)); setSelected([]); return;
      }
    }
    setError(null); setSelected(next); setConfirmed(false);
  }

  function upload() {
    if (!selected.length || loading) return;
    void run(async signal => {
      for (const file of selected) {
        setActiveName(file.name); setProgress(0);
        try {
          const completed = await uploadStagedAssignmentFile(
            assignmentId, deliveryId, file, signal, setProgress,
          );
          setFiles(previous => [...previous.filter(item => item.id !== completed.id), completed]);
        } catch (failure) {
          await refresh(signal);
          throw failure;
        }
      }
      setSelected([]); setConfirmed(false);
    });
  }

  function remove(fileId: string) {
    void run(async signal => {
      const response = await fetch(
        `/api/courses/assignments/${encodeURIComponent(assignmentId)}/submission-files/${encodeURIComponent(fileId)}`,
        { method: "DELETE", credentials: "same-origin", cache: "no-store", signal },
      );
      if (!response.ok) throw new Error(await storageApiError(response));
      await refresh(signal); setConfirmed(false);
    });
  }
  function retry(fileId: string) {
    void run(async signal => {
      await refreshStagedAssignmentFile(assignmentId, fileId, signal);
      await refresh(signal);
    });
  }
  function submit() {
    const hasWrittenOrLinkParts=multipartEnabled&&(Boolean(responseText.trim())||links.length>0);
    if (!confirmed || (files.length===0&&!hasWrittenOrLinkParts) ||
      (files.length>0&&!canSubmitStagedFiles(files))) return;
    if(multipartEnabled){
      if((Boolean(responseText.trim())&&!allowedMethods.includes("WRITTEN_RESPONSE"))||
         links.some(link=>!allowedMethods.includes(link.kind))){
        setError("This submission method is not allowed for this assignment.");
        return;
      }
      const seen=new Set<string>();
      for(const part of links){
        try{
          const url=new URL(part.url);
          if(url.protocol!=="https:"||url.username||url.password||seen.has(url.toString().toLowerCase()))
            throw new Error("Use distinct secure HTTPS links.");
          seen.add(url.toString().toLowerCase());
        }catch{setError("Use distinct secure HTTPS repository or website links.");return;}
      }
    }
    void run(async signal => {
      const response = await fetch(
        `/api/courses/assignments/${encodeURIComponent(assignmentId)}/submit-files`,
        {
          method: "POST", credentials: "same-origin", cache: "no-store", signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryId,fileIds:readySubmissionFileIds(files),
            ...(multipartEnabled?{textContent:responseText.trim()||null,links}:{}),
          }),
        },
      );
      if (!response.ok) throw new Error(await storageApiError(response));
      onSubmitted();
    });
  }
  const staged = files.filter(file => file.submissionId === null);
  const hasPending = staged.some(file => file.status !== "READY");
  const hasWrittenOrLinkParts=multipartEnabled&&(Boolean(responseText.trim())||links.length>0);
  const maySubmit=staged.length>0?canSubmitStagedFiles(files):hasWrittenOrLinkParts;

  return <section aria-label="Assignment file submission" className="mt-4 min-w-0 space-y-3">
    <h3 className="text-sm font-semibold text-foreground">{multipartEnabled?"Combined assignment submission":"File Upload"}</h3>
    {uploadsAllowed?<p className="text-xs text-muted-foreground">{limitsSummary("assignment-submission")} Up to {MAX_ASSIGNMENT_FILES_PER_SUBMISSION} files.</p>:null}
    {uploadsAllowed?<label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Choose a file to upload
      <Input type="file" multiple accept={pdfOnly?".pdf":acceptAttributeFor("assignment-submission")}
        disabled={loading || busy || staged.length >= MAX_ASSIGNMENT_FILES_PER_SUBMISSION}
        className="mt-2 min-h-11 max-w-full md:min-h-9"
        onChange={event => { select(event.currentTarget.files); event.currentTarget.value = ""; }} />
    </label>:null}
    {uploadsAllowed?<details className="min-w-0 text-xs text-muted-foreground">
      <summary className="min-h-11 cursor-pointer py-3 font-semibold md:min-h-9 md:py-2">Google Drive import is not configured.</summary>
      <p className="max-w-prose pb-2">To add a file from Google Drive, download it to your device first, then use Choose a file to upload. The uploaded file must pass private-storage security checks.</p>
    </details>:null}
    {uploadsAllowed && selected.length>0 ? <Button type="button" disabled={busy || loading || selected.length === 0} onClick={upload} className="min-h-11 w-full sm:w-auto md:min-h-9">
      {busy && activeName ? "Uploading…" : staged.length > 0 ? "Add another file" : "Choose a file to upload"}
    </Button>:null}
    {busy && activeName ? <div className="space-y-2" role="status">
      <p className="break-words text-sm text-body">{activeName}: {progress}%</p>
      <MetricBar label="File upload progress" role="progressbar" value={progress} maximum={100} unit="percent" className={uploadStyles.upload} />
      <Button type="button" variant="secondary" onClick={() => active.current?.abort()} className="min-h-11 md:min-h-9">Cancel upload</Button>
      <p className="text-xs text-muted-foreground">Your submission is being sent. Keep this window open until it finishes.</p>
    </div> : null}
    {loading ? <p role="status" className="text-sm text-muted-foreground">Loading your files…</p> : null}
    <ul className={staged.length ? "min-w-0 divide-y divide-border border-y border-border" : "min-w-0"} aria-label="Staged assignment files">
      {staged.map(file => {
        const state = fileStatusDescriptor(file.status);
        return <li key={file.id} className="flex min-w-0 flex-col items-stretch gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="min-w-0 flex-1 break-words text-sm text-body">{file.originalName} · {formatFileSize(file.sizeBytes)}</span>
          <span title={state.detail} className="self-start sm:self-auto"><StatusBadge tone={state.tone}>{state.label}</StatusBadge></span>
          {file.status === "VERIFYING" || file.status === "UPLOADING" ? <Button type="button" size="sm" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy} onClick={() => retry(file.id)}>Check file</Button> : null}
          {canRemoveStagedFile(file) ? <Button type="button" size="sm" variant="danger" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy} onClick={() => remove(file.id)} aria-label="Remove this file">Remove</Button> : null}
        </li>;
      })}
    </ul>
    {multipartEnabled?<AssignmentMultipartPartsEditor text={responseText}
      onTextChange={value=>{setResponseText(value);setConfirmed(false);}}
      links={links} onLinksChange={value=>{setLinks(value);setConfirmed(false);}}
      allowText={allowedMethods.includes("WRITTEN_RESPONSE")}
      allowedLinkKinds={(["REPOSITORY_LINK","EXTERNAL_LINK"] as const).filter(kind=>allowedMethods.includes(kind))}
      disabled={busy||loading}/>:null}
    {staged.length||hasWrittenOrLinkParts ? <div className="min-w-0 space-y-3 border-t border-border pt-4">
      {hasPending ? <p role="status" className="text-sm text-muted-foreground">Files must pass security checks before final submission.</p> : null}
      <label className="flex min-h-11 items-start gap-2 text-sm text-body">
        <Checkbox checked={confirmed} disabled={busy || hasPending} className="mt-1"
          onChange={event => setConfirmed(event.target.checked)} />
        <span>I confirm this is my final assignment submission and cannot be replaced after it is recorded.</span>
      </label>
      <Button type="button" loading={busy&&!activeName} disabled={busy || loading || !confirmed || !maySubmit} onClick={submit} className="min-h-11 w-full sm:w-auto md:min-h-9">
        {busy && !activeName ? "Submitting…" : "Submit Your Work"}
      </Button>
    </div> : null}
    {error ? <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-start">
      <Alert tone="error">{error}</Alert>
      {!busy ? <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
        onClick={() => { setError(null); setLoading(true); setRetryKey(key => key + 1); }}>Retry</Button> : null}
    </div> : null}
  </section>;
}
