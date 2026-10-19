"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { studyGroupConflictMessage } from "@/modules/groups/college-group-management-model";

export type ManagedStudyGroup = {
  id: string;
  name: string;
  kind: string;
  status: string;
  description: string | null;
  capacity: number | null;
  activeCount: number;
  version: number;
};

type Draft = { name: string; description: string; capacity: string };
const EMPTY: Draft = { name: "", description: "", capacity: "" };

function draftOf(group: ManagedStudyGroup | null): Draft {
  return group ? {
    name: group.name,
    description: group.description ?? "",
    capacity: group.capacity?.toString() ?? "",
  } : EMPTY;
}

export function CollegeGroupActions({ group }: { group?: ManagedStudyGroup }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<"ACTIVATE" | "CLOSE" | "ARCHIVE" | null>(null);
  const [draft, setDraft] = useState<Draft>(() => draftOf(group ?? null));
  const [error, setError] = useState<string | null>(null);
  const manageable = !group || group.kind === "STUDY_GROUP";
  if (!manageable) return null;

  const update = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  async function send(body: Record<string, unknown>) {
    const response = await fetch(
      group ? `/api/college/groups/${group.id}` : "/api/college/groups",
      {
        method: group ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      const result: { error?: string; issues?: { message: string }[] } | null =
        await response.json().catch(() => null);
      throw new Error(result?.issues?.[0]?.message ??
        studyGroupConflictMessage(result?.error ?? ""));
    }
    setError(null);
    setOpen(false);
    setConfirm(null);
    router.refresh();

  }

  function save() {
    const name = draft.name.trim();
    const capacity = draft.capacity.trim() === "" ? null : Number(draft.capacity);
    if (name.length === 0 || name.length > 150) {
      setError("Name is required (maximum 150 characters).");
      return;
    }
    if (draft.description.length > 1000 || (
      capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000)
    )) {
      setError("Description must be at most 1000 characters and capacity must be 1–10000 if supplied.");
      return;
    }
    startTransition(async () => {
      try {
        await send(group
          ? { action: "EDIT", expectedVersion: group.version, name, description: draft.description, capacity }
          : { name, description: draft.description, capacity });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save group.");
      }
    });
  }

  function changeStatus() {
    if (!group || !confirm) return;
    startTransition(async () => {
      try {
        await send({
          action: "STATUS",
          transition: confirm,
          expectedVersion: group.version,
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to change group status.");
        setConfirm(null);
      }
    });
  }

  const inputClass = "min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground";
  return <>
    {group ? <span className="flex flex-wrap gap-2">
      {group.status !== "ARCHIVED" ? (
        <Button size="sm" variant="secondary" onClick={() => {
          setDraft(draftOf(group)); setError(null); setOpen(true);
        }}>Edit</Button>
      ) : null}
      {(group.status === "DRAFT" || group.status === "CLOSED") ? (
        <Button size="sm" variant="secondary" onClick={() => {
          setError(null); setConfirm("ACTIVATE");
        }}>Activate</Button>
      ) : null}
      {group.status === "ACTIVE" ? (
        <Button size="sm" variant="secondary" onClick={() => {
          setError(null); setConfirm("CLOSE");
        }}>Close</Button>
      ) : null}
      {(group.status === "DRAFT" || group.status === "CLOSED") ? (
        <Button size="sm" variant="danger" onClick={() => {
          setError(null); setConfirm("ARCHIVE");
        }}>Archive</Button>
      ) : null}
    </span> : (
      <Button onClick={() => { setDraft(EMPTY); setError(null); setOpen(true); }}>
        New study group
      </Button>
    )}
    <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}
      title={group ? "Edit study group" : "New study group"}
      description="This form manages college-owned study groups only.">
      <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4">
        <label className="block text-sm font-semibold text-body">Group name
          <Input required maxLength={150} value={draft.name}
            onChange={(event) => update("name", event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-body">Description
          <Textarea maxLength={1000} value={draft.description} rows={3}
            onChange={(event) => update("description", event.target.value)}
            className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-body">Capacity (optional)
          <Input inputMode="numeric" type="number" min={1} max={10000} value={draft.capacity}
            onChange={(event) => update("capacity", event.target.value)} className={inputClass} />
        </label>
        {error ? <p role="alert" className="text-sm text-[var(--lms-error)]">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save group"}</Button>
        </div>
      </form>
    </Dialog>
    <ConfirmDialog open={confirm !== null} onOpenChange={(value) => { if (!value && !pending) setConfirm(null); }}
      title={`${confirm === "ARCHIVE" ? "Archive" : confirm === "ACTIVATE" ? "Activate" : "Close"} study group?`}
      description={confirm === "ARCHIVE"
        ? "Archiving is permanent in this workflow. It is blocked while active, waitlisted or requested members remain."
        : "The status change will affect member access and group visibility."}
      confirmLabel={confirm === "ARCHIVE" ? "Archive group" : "Confirm status"}
      confirmVariant={confirm === "ARCHIVE" ? "danger" : "primary"}
      pending={pending} onConfirm={changeStatus} />
    {!open && !confirm && error ? <p role="alert" className="text-xs text-[var(--lms-error)]">{error}</p> : null}
  </>;
}
