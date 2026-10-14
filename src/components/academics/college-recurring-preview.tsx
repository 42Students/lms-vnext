"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { collegePreviewErrorLabel } from "@/modules/academics/college-recurring-preview-ui-model";

type Option = { id: string; name: string };
type ClassOption = Option & { cohortName: string; periodStart: string; periodEnd: string };
type FacultyOption = { id: string; displayName: string | null };
type Result = { slots: Array<{ startsAt: string; endsAt: string; localDate: string; conflicts: string[] }>;
  ready: number; blocked: number; notice: string };

export function CollegeRecurringPreview({
  classes, halls, faculty,
}: { classes: ClassOption[]; halls: Option[]; faculty: FacultyOption[] }) {
  const [sectionId, setSectionId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [hallId, setHallId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const selected = classes.find((item) => item.id === sectionId);
  function onClass(id: string) {
    setSectionId(id);
    const entry = classes.find((item) => item.id === id);
    setFrom(entry?.periodStart ?? "");
    setTo(entry?.periodEnd ?? "");
    setResult(null);
  }
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/academics/sections/recurring-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sectionId, from, to, weekdays, startTime, endTime,
            facultyMembershipId: facultyId || null, lectureHallId: hallId || null,
          }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(collegePreviewErrorLabel(payload));
        setResult(payload as Result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Schedule preview failed");
      }
    });
  }
  return (
    <section className="space-y-5">
      <p className="text-sm text-body">Preview is read-only. No class sessions will be created.</p>
      {classes.length === 0 ? (
        <p role="status" className="rounded-lg border border-border p-5 text-sm text-body">
          No active classes are registered for this college. Create a class before previewing a schedule.
        </p>
      ) : (
        <form onSubmit={preview} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
          <label className="grid gap-1 text-sm font-semibold text-body">Class
            <select required value={sectionId} onChange={(e) => onClass(e.target.value)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">Select a class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.cohortName}</option>)}
            </select>
          </label>
          {selected ? <p className="text-xs text-muted-foreground">Academic period: {selected.periodStart} to {selected.periodEnd}</p> : null}
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
      {result ? <section aria-label="Schedule preview results" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Preview · {result.ready} clear, {result.blocked} blocked</h2>
        <p className="text-sm text-muted-foreground">{result.notice}</p>
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
    </section>
  );
}
