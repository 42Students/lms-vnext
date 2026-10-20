"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
export function TemplateMetadataEditControl({ templateId, title, summary, currentVersion, updatedAt }: {
  templateId: string; title: string; summary: string | null; currentVersion: number; updatedAt: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedTitle, setTitle] = useState(title), [editedSummary, setSummary] = useState(summary ?? "");
  const [changeNote, setNote] = useState(""), [confirmed, setConfirmed] = useState(false);
  const [token, setToken] = useState({ currentVersion, updatedAt });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !confirmed) return;
    setPending(true); setError(null);
    try {
      await projectMutation(`/api/projects/templates/${templateId}/metadata`, "PATCH", {
        title: editedTitle, summary: editedSummary, changeNote,
        expectedCurrentVersion: token.currentVersion, expectedUpdatedAt: token.updatedAt,
      });
      showToast({ tone: "success", title: "Template metadata revised", description: "A new immutable version preserves the existing blueprint." });
      setOpen(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not revise the template. Refresh before retrying a stale version."); }
    finally { setPending(false); }
  }
  return <>
    <Button size="sm" variant="secondary" onClick={() => {
      setTitle(title); setSummary(summary ?? ""); setNote(""); setConfirmed(false); setError(null);
      setToken({ currentVersion, updatedAt }); setOpen(true);
    }}>Edit draft metadata</Button>
    <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }} title="Revise draft metadata"
      description="Creates a new template version. The blueprint and existing college/workspace snapshots are preserved.">
      <form onSubmit={submit} className="grid min-w-0 gap-4">
        <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold leading-4 text-body">Title<Input required maxLength={200} disabled={pending}
          value={editedTitle} onChange={event => setTitle(event.target.value)} /></label>
        <details className="border-t border-[var(--lms-canvas-border)] pt-3" defaultOpen={Boolean(summary)}>
          <summary className="cursor-pointer py-2 text-[13px] font-semibold text-body">Summary</summary>
        <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold leading-4 text-body">Summary<Textarea maxLength={2000} disabled={pending}
          value={editedSummary} onChange={event => setSummary(event.target.value)} /></label>
        </details>
        <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold leading-4 text-body">Change note<Textarea required maxLength={1000} disabled={pending}
          value={changeNote} onChange={event => setNote(event.target.value)} /></label>
        <label className="flex min-w-0 items-start gap-3 border-t border-[var(--lms-canvas-border)] py-3 text-[13px] leading-5 text-body"><Checkbox className="size-5" checked={confirmed} disabled={pending}
          onChange={event => setConfirmed(event.target.checked)} />I confirm that this creates a new version and preserves pinned snapshots.</label>
        {error ? <p role="alert" className="text-sm text-error-text">{error}</p> : null}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--lms-canvas-border)] pt-4 sm:flex-row sm:justify-end"><Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" variant="secondary" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" type="submit" loading={pending} disabled={pending || !confirmed || !editedTitle.trim() || !changeNote.trim()}>{pending ? "Saving…" : "Save new version"}</Button></div>
      </form>
    </Dialog>
  </>;
}
