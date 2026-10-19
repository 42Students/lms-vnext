"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {
  APPLICANT_NOTE_MAX_LENGTH,
  type ApplicantNotesSnapshot,
} from "@/modules/placements/applicant-notes-model";

function formatIst(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function ApplicantNotesPanel({
  endpoint,
  snapshot,
  audience,
}: {
  endpoint: string;
  snapshot: ApplicantNotesSnapshot;
  audience: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    setPending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, expectedLatestNoteId: snapshot.latestNoteId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          payload?.error === "PLACEMENT_APPLICATION_NOTE_STALE"
            ? "A newer note was added. The list has been refreshed; review it and add your note again."
            : "The note could not be saved.",
        );
      }
      form.reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The note could not be saved.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="applicant-notes-title" className="space-y-3 border-b border-border pb-6">
      <h2 id="applicant-notes-title" className="font-semibold text-foreground">
        Private notes
      </h2>
      <p className="text-xs text-body">Visible only to {audience}. Notes cannot be edited or deleted; add a new note to correct one.</p>
      {snapshot.notes.length === 0 ? (
        <p className="text-sm text-body">No notes yet.</p>
      ) : (
        <ul className="grid gap-3">
          {snapshot.notes.map((note) => (
            <li key={note.id} className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-muted p-3">
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">{note.body}</p>
              <p className="mt-2 text-xs text-body">
                {note.mine ? "You" : note.authorName} · {formatIst(note.createdAt)} IST
              </p>
            </li>
          ))}
        </ul>
      )}
      {snapshot.truncated ? (
        <p role="status" className="text-xs text-body">
          Showing the newest {snapshot.notes.length} of {snapshot.total} notes.
        </p>
      ) : null}
      <form onSubmit={(e) => void submit(e)} className="space-y-2">
        <label className="block text-sm font-semibold text-body">
          Add a note
          <Textarea
            required
            name="body"
            rows={3}
            maxLength={APPLICANT_NOTE_MAX_LENGTH}
            className="mt-2 w-full"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending}
          
        >
          {pending ? "Saving…" : "Save note"}
        </Button>
      </form>
    </section>
  );
}
