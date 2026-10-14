"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authoringLocalDateTime } from "@/modules/courses/faculty-authoring-datetime-model";
import { courseApiError } from "./learner-course-api";
import { facultyContentPatch, type EditableContent } from "@/modules/courses/faculty-content-edit-model";

type Item = {
  id: string;
  contentType: EditableContent;
  title: string;
  notes: string | null;
  externalUrl: string | null;
  storageKey: string | null;
  durationSeconds: number | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
};

export function FacultyContentEditor({ item }: { item: Item }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [url, setUrl] = useState(item.externalUrl ?? "");
  const [duration, setDuration] = useState(String(item.durationSeconds ?? 300));
  const [starts, setStarts] = useState(authoringLocalDateTime(item.startsAt));
  const [ends, setEnds] = useState(authoringLocalDateTime(item.endsAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openEditor() {
    // Each RSC refresh can change the persisted item while this Client
    // Component remains mounted. Rebase only when opening, not mid-edit.
    setTitle(item.title);
    setNotes(item.notes ?? "");
    setUrl(item.externalUrl ?? "");
    setDuration(String(item.durationSeconds ?? 300));
    setStarts(authoringLocalDateTime(item.startsAt));
    setEnds(authoringLocalDateTime(item.endsAt));
    setError(null);
    setOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);
    let body: ReturnType<typeof facultyContentPatch>;
    try {
      body = facultyContentPatch({
        kind: item.contentType, title, notes, url, duration, starts, ends,
        hasStoredResource: Boolean(item.storageKey),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid content.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/courses/lesson-contents/" + encodeURIComponent(item.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await courseApiError(response));
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not save this content. Retry after checking your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={openEditor}>
        Edit content
      </Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title={"Edit " + item.contentType.replaceAll("_", " ")}
        description="Changes to this item stay scoped to your assigned teaching Section."
        footer={<Button type="submit" form={"faculty-content-edit-" + item.id} disabled={saving}>
          {saving ? "Saving…" : "Save content"}
        </Button>}
      >
        <form id={"faculty-content-edit-" + item.id} onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold text-body">
            Title
            <Input className="mt-1.5" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required />
          </label>
          <label className="block text-sm font-semibold text-body">
            Notes
            <Textarea className="mt-1.5 min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} />
          </label>
          <label className="block text-sm font-semibold text-body">
            {item.contentType === "YOUTUBE" ? "YouTube URL" : item.contentType === "LIVE_CLASS" ? "Meeting URL" : "Resource URL"}
            <Input className="mt-1.5" type="url" value={url} onChange={(event) => setUrl(event.target.value)}
              required={item.contentType !== "RESOURCE"} placeholder="https://…" />
          </label>
          {item.contentType === "YOUTUBE" ? (
            <label className="block text-sm font-semibold text-body">
              Duration (seconds)
              <Input className="mt-1.5" type="number" min={1} max={86400} value={duration}
                onChange={(event) => setDuration(event.target.value)} required />
            </label>
          ) : null}
          {item.contentType === "LIVE_CLASS" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-body">
                Start (IST)
                <Input className="mt-1.5" type="datetime-local" value={starts}
                  onChange={(event) => setStarts(event.target.value)} required />
              </label>
              <label className="text-sm font-semibold text-body">
                End (IST)
                <Input className="mt-1.5" type="datetime-local" value={ends}
                  onChange={(event) => setEnds(event.target.value)} required />
              </label>
            </div>
          ) : null}
          {error ? <p role="alert" className="text-sm font-semibold text-error">{error}</p> : null}
        </form>
      </Drawer>
    </>
  );
}
