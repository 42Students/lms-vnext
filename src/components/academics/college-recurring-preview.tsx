"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";

type Option = { id: string; name: string };
type ClassOption = Option & { cohortName: string; periodStart: string; periodEnd: string; updatedAt: string };
type FacultyOption = { id: string; displayName: string | null };
type DeliveryOption = { id: string; sectionId: string; name: string; code: string };
type Result = { slots: Array<{ startsAt: string; endsAt: string; localDate: string; conflicts: string[] }>;
  ready: number; blocked: number; notice: string };

export function CollegeRecurringPreview({
  classes, halls, faculty, deliveries, defaultSectionId = "",
}: { classes: ClassOption[]; halls: Option[]; faculty: FacultyOption[]; deliveries: DeliveryOption[];
  defaultSectionId?: string }) {
  const chosen = classes.find(item => item.id === defaultSectionId);
  const [sectionId, setSectionId] = useState(chosen?.id ?? "");
  const [title, setTitle] = useState("Class session");
  const [deliveryId, setDeliveryId] = useState("");
  const [skipped, setSkipped] = useState<Array<{localDate:string;reasons:string[]}>>([]);
  const [created, setCreated] = useState<number | null>(null);
  const [lastPreviewKey, setLastPreviewKey] = useState("");
  function previewKey() {
    return JSON.stringify({sectionId,from,to,weekdays,startTime,endTime,title,facultyId,hallId,deliveryId});
  }
  const [from, setFrom] = useState(chosen?.periodStart ?? "");
  const [to, setTo] = useState(chosen?.periodEnd ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [hallId, setHallId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const selected = classes.find((item) => item.id === sectionId);
  function onClass(id: string) {
    setSectionId(id);
    setDeliveryId("");
    const entry = classes.find((item) => item.id === id);
    setFrom(entry?.periodStart ?? "");
    setTo(entry?.periodEnd ?? "");
    setResult(null);
    setCreated(null);
  }
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    startTransition(async () => {
      try {
        const payload=await apiFetch<Result>("/api/academics/sections/recurring-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sectionId, from, to, weekdays, startTime, endTime,
            facultyMembershipId: facultyId || null, lectureHallId: hallId || null,
            deliveryId: deliveryId || null,
          }),
        });
        setResult(payload);
        setLastPreviewKey(previewKey());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Schedule preview failed");
      }
    });
  }
  function execute() {
    if (!selected?.updatedAt || !result || result.ready===0) return;
    if (lastPreviewKey !== previewKey()) {
      setError("Schedule fields changed since the preview. Preview this pattern again before saving.");
      return;
    }
    setConfirming(true);
  }
  function confirmExecute() {
    setConfirming(false);
    const version = selected?.updatedAt;
    if (!version || !result || result.ready===0) return;
    if (lastPreviewKey !== previewKey()) {
      setError("Schedule fields changed since the preview. Preview this pattern again before saving.");
      return;
    }
    setError("");
    setCreated(null);
    setSkipped([]);
    startTransition(async () => {
      try {
        const value=await apiFetch<{created?:number;skipped?:Array<{localDate:string;reasons:string[]}>}>(
          "/api/academics/sections/recurring-execute",{
          method: "POST", headers: {"content-type":"application/json"},
          body: JSON.stringify({
            sectionId,from,to,weekdays,startTime,endTime,title,
            facultyMembershipId:facultyId||null,lectureHallId:hallId||null,
            deliveryId: deliveryId || null,
            expectedSectionUpdatedAt:version,confirm:true,
          }),
        });
        setCreated(value.created ?? 0);
        setSkipped(value.skipped ?? []);
        setResult(null);
        setLastPreviewKey("");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Scheduling failed");
      }
    });
  }
  return (
    <section className="space-y-5">
      <p className="text-sm text-body">Preview does not create sessions. Confirmed execution rechecks conflicts and creates only clear dates.</p>
      {classes.length === 0 ? (
        <p role="status" className="rounded-lg border border-border p-5 text-sm text-body">
          No active classes are registered for this college. Create a class before previewing a schedule.
        </p>
      ) : (
        <form onSubmit={preview} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
          <label className="grid gap-1 text-sm font-semibold text-body">Session title
            <input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Class
            <select required value={sectionId} onChange={(e) => onClass(e.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">Select a class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.cohortName}</option>)}
            </select>
          </label>
          {selected ? <p className="text-xs text-muted-foreground">Academic period: {selected.periodStart} to {selected.periodEnd}</p> : null}
          <label className="grid gap-1 text-sm font-semibold text-body">Course (optional)
            <select value={deliveryId} onChange={e => setDeliveryId(e.target.value)}
              disabled={!sectionId} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">No course linked</option>
              {deliveries.filter(item => item.sectionId === sectionId).map(item =>
                <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-sm font-semibold text-body">From
              <input type="date" required value={from} min={selected?.periodStart} max={selected?.periodEnd}
                onChange={(e) => setFrom(e.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">To (up to 93 days)
              <input type="date" required value={to} min={from || selected?.periodStart} max={selected?.periodEnd}
                onChange={(e) => setTo(e.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">Start (IST)
              <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">End (IST)
              <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-body">Repeat on weekdays</legend>
            <div className="flex flex-wrap gap-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <label key={day} className="flex items-center gap-2 text-sm text-body">
                  <input type="checkbox" checked={weekdays.includes(index)}
                    onChange={(e) => setWeekdays((current) => e.target.checked
                      ? [...current, index].sort()
                      : current.filter((n) => n !== index))} />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-body">Faculty (optional)
              <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="">No faculty selected</option>
                {faculty.map((f) => <option key={f.id} value={f.id}>{f.displayName || "Unnamed faculty"}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">Lecture hall (optional)
              <select value={hallId} onChange={(e) => setHallId(e.target.value)}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="">No lecture hall selected</option>
                {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </label>
          </div>
          <Button type="submit" disabled={pending || !sectionId || !from || !to || weekdays.length === 0}>
            {pending ? "Checking conflicts…" : "Preview sessions"}
          </Button>
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        </form>
      )}
      {created !== null ? <div role="status" className="space-y-2 text-sm">
        <p>Created {created} scheduled sessions.</p>
        {skipped.length > 0 && <>
          <p className="font-semibold">These dates were skipped:</p>
          <ul className="list-inside list-disc">{skipped.map(item =>
            <li key={item.localDate}>{item.localDate}: {item.reasons.map(reason => reason.replaceAll("_", " ")).join(", ")}</li>)}</ul>
        </>}
      </div> : null}
      {result ? <section aria-label="Schedule preview results" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Preview · {result.ready} clear, {result.blocked} blocked</h2>
        <p className="text-sm text-muted-foreground">{result.notice}</p>
        <Button type="button" disabled={pending || !title.trim() || result.ready===0}
          onClick={execute}>{pending?"Creating…":"Confirm and create "+result.ready+" sessions"}</Button>
        {result.blocked>0 ? <p className="text-xs text-error">Conflicting dates will be skipped; clear dates may still be created.</p> : null}
        {result.slots.length === 0 ? <p className="text-sm text-body">No selected weekdays match this date range.</p> : (
          <div className="max-h-[32rem] overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-muted"><tr><th className="px-3 py-2">Date (IST)</th>
                <th className="px-3 py-2">Time (IST)</th><th className="px-3 py-2">Conflicts</th></tr></thead>
              <tbody>{result.slots.map((slot) => <tr key={slot.startsAt} className="border-t border-border">
                <td className="px-3 py-2">{slot.localDate}</td>
                <td className="px-3 py-2">{new Intl.DateTimeFormat("en-IN", {
                  timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit",
                }).format(new Date(slot.startsAt))} – {new Intl.DateTimeFormat("en-IN", {
                  timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit",
                }).format(new Date(slot.endsAt))}</td>
                <td className="px-3 py-2">{slot.conflicts.length
                  ? slot.conflicts.map((c) => c.replaceAll("_", " ")).join(", ") : "None detected"}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section> : null}
      <ConfirmDialog open={confirming} onOpenChange={setConfirming}
        title="Create recurring sessions?"
        description={`Create ${result?.ready ?? 0} clear sessions? Conflicting dates will be skipped and listed after saving.`}
        confirmLabel="Create sessions" pending={pending} onConfirm={confirmExecute}/>
    </section>
  );
}
