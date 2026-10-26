"use client";
import { Alert } from "@/components/ui/alert";


import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authoringLocalDateTime } from "@/modules/courses/faculty-authoring-datetime-model";
import { courseApiError } from "./learner-course-api";
import { facultyContentPatch, facultyContentDraftChanged, facultyContentMayChangeOpen, facultyContentSaveReceiptMatches, facultyContentMaySave, type EditableContent } from "@/modules/courses/faculty-content-edit-model";

type Item = {
  id: string;
  contentType: EditableContent;
  title: string;
  notes: string | null;
  externalUrl: string | null;
  storageKey: string | null;
  durationSeconds: number | null;
  points: number;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
};

export function FacultyContentEditor({ item,compact=false }: { item: Item;compact?:boolean }) {
  const router = useRouter();
  const mutationLock=useRef(false);
  const [open, setOpen] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [url, setUrl] = useState(item.externalUrl ?? "");
  const [duration, setDuration] = useState(String(item.durationSeconds ?? ""));
  const [points,setPoints]=useState(String(item.points));
  const [starts, setStarts] = useState(authoringLocalDateTime(item.startsAt));
  const [ends, setEnds] = useState(authoringLocalDateTime(item.endsAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = facultyContentDraftChanged({
    title:item.title, notes:item.notes??"", url:item.externalUrl??"",
    duration:String(item.durationSeconds??""),points:String(item.points),
    starts:authoringLocalDateTime(item.startsAt), ends:authoringLocalDateTime(item.endsAt),
  }, {title,notes,url,duration,starts,ends,points});

  function openEditor() {
    // Each RSC refresh can change the persisted item while this Client
    // Component remains mounted. Rebase only when opening, not mid-edit.
    setTitle(item.title);
    setNotes(item.notes ?? "");
    setUrl(item.externalUrl ?? "");
    setDuration(String(item.durationSeconds ?? ""));
    setPoints(String(item.points));
    setStarts(authoringLocalDateTime(item.startsAt));
    setEnds(authoringLocalDateTime(item.endsAt));
    setError(null);
    setOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!facultyContentMaySave(saving,mutationLock.current,dirty)) return;
    setError(null);
    let body: ReturnType<typeof facultyContentPatch>;
    try {
      body = facultyContentPatch({
        kind: item.contentType, title, notes, url, duration, starts, ends, points,
        hasStoredResource: Boolean(item.storageKey),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid content.");
      return;
    }
    mutationLock.current=true;
    setSaving(true);
    try {
      const response = await fetch("/api/courses/lesson-contents/" + encodeURIComponent(item.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError((await courseApiError(response)) ?? "Could not save this content.");
        return;
      }
      const receipt:unknown = await response.json().catch(() => null);
      if (!facultyContentSaveReceiptMatches(item.id,body,receipt)) {
        setError("Save status could not be verified. Reload this Section before another edit.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not save this content. Retry after checking your connection.");
    } finally {
      mutationLock.current=false;
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="md" variant="secondary" className={compact?"!min-h-9 !px-3 !py-1.5 !text-xs":"min-h-11 md:min-h-[var(--lms-control-height)]"} onClick={openEditor}>
        {compact?"Edit":"Edit content"}
      </Button>
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (facultyContentMayChangeOpen(nextOpen, dirty, saving, () => {
            setDiscardConfirm(true);
            return false;
          })) {
            setOpen(nextOpen);
          }
        }}
        title={"Edit " + item.contentType.replaceAll("_", " ")}
        description={item.contentType==="VIDEO"?"Edit the title and notes. The stored video file is not changed.":"Changes to this item stay scoped to your assigned teaching Section."}
        footer={<Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]" form={"faculty-content-edit-" + item.id} disabled={saving || !dirty}>
          {saving ? "Saving…" : dirty ? "Save content" : "No changes"}
        </Button>}
      >
        <form id={"faculty-content-edit-" + item.id} onSubmit={save} className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block min-w-0 leading-4 font-semibold md:col-span-2 text-[13px] text-[var(--lms-neutral-400)]">
            Title
            <Input className="mt-[6px]" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required />
          </label>
          <label className="block min-w-0 leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
            Points
            <Input className="mt-[6px]" type="number" min={0} max={1000}
              value={points} onChange={(event)=>setPoints(event.target.value)} required/>
          </label>
          <label className="block min-w-0 leading-4 font-semibold md:col-span-2 text-[13px] text-[var(--lms-neutral-400)]">
            Notes
            <Textarea className="mt-[6px] min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} />
          </label>
          {item.contentType !== "VIDEO" ? <label className="block min-w-0 leading-4 font-semibold md:col-span-2 text-[13px] text-[var(--lms-neutral-400)]">
            {item.contentType === "YOUTUBE" ? "YouTube URL" : item.contentType === "LIVE_CLASS" ? "Meeting URL" : "Resource URL"}
            <Input className="mt-[6px]" type="url" value={url} onChange={(event) => setUrl(event.target.value)}
              required={item.contentType !== "RESOURCE"} placeholder="https://…" />
          </label>:null}
          {item.contentType === "YOUTUBE" ? (
            <label className="block min-w-0 leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
              Actual video duration (seconds)
              <Input className="mt-[6px]" type="number" min={1} max={86400} value={duration}
                onChange={(event) => setDuration(event.target.value)} required />
            </label>
          ) : null}
          {item.contentType === "LIVE_CLASS" ? (
            <div className="grid min-w-0 gap-3 md:col-span-2 md:grid-cols-2">
              <label className="leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
                Start (IST)
                <Input className="mt-[6px]" type="datetime-local" value={starts}
                  onChange={(event) => setStarts(event.target.value)} required />
              </label>
              <label className="leading-4 font-semibold text-[13px] text-[var(--lms-neutral-400)]">
                End (IST)
                <Input className="mt-[6px]" type="datetime-local" value={ends}
                  onChange={(event) => setEnds(event.target.value)} required />
              </label>
            </div>
          ) : null}
          {error ? <div className="md:col-span-2"><Alert tone="error">{error}</Alert></div> : null}
        </form>
      </Drawer>
      <ConfirmDialog
        open={discardConfirm}
        onOpenChange={setDiscardConfirm}
        title="Discard unsaved changes?"
        description="Discard unsaved changes to this lesson content?"
        confirmLabel="Discard changes"
        onConfirm={() => {
          setDiscardConfirm(false);
          setOpen(false);
        }}
      />
    </>
  );
}
