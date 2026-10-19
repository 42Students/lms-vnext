"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
type Choice = {
  id: string; jobId: string; jobTitle: string; companyName: string; name: string;
  kind: string; status: string; updatedAt: string; scheduledAt: string | null;
  mode: string | null; venue: string | null; meetingUrl: string | null;
  durationMinutes: number | null;
};
const localIst = (value: string | null) => value
  ? new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(new Date(value)).replace(", ", "T").replace(" ", "T")
  : "";
export function TpoRoundCalendarControl({ choices,blockedDates,blockedDatesAvailable }: {
 choices: readonly Choice[];blockedDates:readonly string[];blockedDatesAvailable:boolean;
}) {
  const router = useRouter();
  const [id, setId] = useState(choices[0]?.id ?? "");
  const round = useMemo(() => choices.find((item) => item.id === id), [choices, id]);
  const [dateInput, setDateInput] = useState(choices[0] ? localIst(choices[0].scheduledAt) : "");
  const [mode, setMode] = useState<"ON_CAMPUS" | "VIRTUAL">(
    choices[0]?.mode === "VIRTUAL" ? "VIRTUAL" : "ON_CAMPUS",
  );
  const [venue, setVenue] = useState(choices[0]?.venue ?? "");
  const [meetingUrl, setMeetingUrl] = useState(choices[0]?.meetingUrl ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const blockedDay=blockedDates.find(day=>day===dateInput.slice(0,10));
  function choose(next: string) {
    setId(next);
    const value = choices.find((item) => item.id === next);
    setDateInput(localIst(value?.scheduledAt ?? null));
    setMode(value?.mode === "VIRTUAL" ? "VIRTUAL" : "ON_CAMPUS");
    setVenue(value?.venue ?? "");
    setMeetingUrl(value?.meetingUrl ?? "");
    setReason("");
    setError(null);
  }
  async function submit(action: "SCHEDULE" | "CANCEL") {
    if (!round || pending) return;
    const note = action === "CANCEL" ? reason.trim() : "";
    if (action === "CANCEL" && note.length < 3) { setError("Enter a cancellation reason."); return; }
    if(action==="SCHEDULE"&&blockedDay&&!window.confirm(
      "This is a blocked date ("+blockedDay+"). Schedule this round anyway?"
    ))return;
    if(action==="SCHEDULE"&&!blockedDatesAvailable){setError("Blocked-date settings are unavailable. Round scheduling is disabled until conflicts can be checked.");return;}
    if (!window.confirm(
      (action === "CANCEL" ? "Cancel " : "Create or reschedule ") +
      round.name + " for " + round.companyName +
      "? The action is recorded in the permanent round event history.",
    )) return;
    setPending(true); setError(null);
    try {
      const response = await fetch("/api/placements/tpo/calendar/round", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          confirmed: true, roundId: round.id,
          expectedUpdatedAt: round.updatedAt,
          action,
          ...(action === "SCHEDULE" ? {
            localDateTime: dateInput, mode, acknowledgedBlockedDate:Boolean(blockedDay),
            ...(mode === "ON_CAMPUS" ? { venue } : { meetingUrl }),
          } : { reason: note }),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "Schedule conflicted or has changed. Refresh and review.");
      }
      setId(""); setReason(""); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Calendar update failed."); }
    finally { setPending(false); }
  }
  if (choices.length === 0) return <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-[var(--lms-space-5)] text-sm text-body">
    No pending or scheduled rounds exist in published drives. Create a round in its job workspace first.
  </p>;
  return <section className="space-y-4 border-b border-border pb-6">
    <label className="block text-sm font-semibold text-foreground">Drive round
      <Select className="mt-1 block min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-body"
        value={id} onChange={(event) => choose(event.target.value)}>
        <option value="">Select a round</option>
        {choices.map((item) => <option key={item.id} value={item.id}>
          {item.companyName} · {item.jobTitle} · {item.name} ({item.status})
        </option>)}
      </Select>
    </label>
    {round ? <>
      <p className="text-sm text-body">Status: {round.status}. Kind: {round.kind}.
        Duration: {round.durationMinutes ?? "Unknown"} minutes. On-campus rounds
        need a recorded duration for venue collision checking.</p>
      <label className="block text-sm font-semibold text-foreground">Date/time (IST)
        <Input type="datetime-local" className="mt-1 block min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
          value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
      </label>
      {blockedDay?<p role="alert" className="rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm text-[var(--lms-gold-accent)]">
       This day is blocked in placement settings. Review the clash before scheduling a round.
      </p>:null}
      {!blockedDatesAvailable?<p role="status" className="text-sm text-[var(--lms-gold-accent)]">
       Blocked-date storage is unavailable; schedule clashes cannot be verified.
      </p>:null}
      <label className="block text-sm font-semibold text-foreground">Mode
        <Select className="mt-1 block min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
          value={mode} onChange={(event) => setMode(event.target.value as "ON_CAMPUS" | "VIRTUAL")}>
          <option value="ON_CAMPUS">On campus</option>
          <option value="VIRTUAL">Virtual</option>
        </Select>
      </label>
      <label className="block text-sm font-semibold text-foreground">
        {mode === "ON_CAMPUS" ? "Venue" : "Meeting URL"}
        <Input value={mode === "ON_CAMPUS" ? venue : meetingUrl}
          onChange={(event) => mode === "ON_CAMPUS" ? setVenue(event.target.value) : setMeetingUrl(event.target.value)}
          className="mt-1 block min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2" />
      </label>
      <label className="block text-sm font-semibold text-foreground">Cancellation reason (for Cancel only)
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000}
          className="mt-1 block min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 md:min-h-9" />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" disabled={pending} type="button" onClick={() => void submit("SCHEDULE")}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary disabled:opacity-50 text-on-primary">
          {round.status === "PENDING" ? "Confirm schedule" : "Confirm reschedule"}
        </Button>
        <Button variant="secondary" disabled={pending} type="button" onClick={() => void submit("CANCEL")}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold disabled:opacity-50">
          Confirm cancellation
        </Button>
      </div>
    </> : null}
    {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
  </section>;
}
