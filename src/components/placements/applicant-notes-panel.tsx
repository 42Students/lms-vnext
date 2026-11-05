"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {
  APPLICANT_NOTE_MAX_LENGTH,
  type ApplicantNotesSnapshot,
} from "@/modules/placements/applicant-notes-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { istDateTimeFormatter } from "@/lib/format-date";

function formatIst(value: string) {
  return istDateTimeFormatter.format(new Date(value));
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
  const inFlightRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlightRef.current || pending) return;
    inFlightRef.current = true;
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
      inFlightRef.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="applicant-notes-title" className="space-y-3 border-b border-border pb-6">
      <Heading level={2} size="base" id="applicant-notes-title" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">
        Private notes
      </Heading>
      <p className="text-xs text-body leading-[20px]">Visible only to {audience}. Notes cannot be edited or deleted; add a new note to correct one.</p>
      {snapshot.notes.length === 0 ? (
        <p className="text-sm text-body leading-[22px]">No notes yet.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {snapshot.notes.map((note) => (
            <li key={note.id} className="min-w-0 py-4">
              <p className="whitespace-pre-wrap break-words text-sm text-foreground leading-[22px]">{note.body}</p>
              <p className="mt-2 text-xs text-body leading-[20px]">
                {note.mine ? "You" : note.authorName} · {formatIst(note.createdAt)} IST
              </p>
            </li>
          ))}
        </ul>
      )}
      {snapshot.truncated ? (
        <p role="status" className="text-xs text-body leading-[20px]">
          Showing the newest {snapshot.notes.length} of {snapshot.total} notes.
        </p>
      ) : null}
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <Label className="block">
          Add a note
          <Textarea
            required
            name="body"
            rows={3}
            maxLength={APPLICANT_NOTE_MAX_LENGTH}
            disabled={pending}
            className="mt-2 w-full"
          />
        </Label>
        {error ? (
          <InlineNotice tone="error" message={error}/>
        ) : null}
        <Button
          type="submit"
          disabled={pending}
          loading={pending}
          className="min-h-11 w-full md:min-h-9 md:w-auto"
        >
          {pending ? "Saving…" : "Save note"}
        </Button>
      </form>
    </section>
  );
}
