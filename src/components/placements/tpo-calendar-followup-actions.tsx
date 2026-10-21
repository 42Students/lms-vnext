"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Dialog } from "@/components/ui/dialog";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {tpoCalendarFollowupSuccess,tpoCalendarFollowupError,type TpoFollowupAction} from "@/modules/placements/tpo-calendar-followup-messages";
import { calendarLocalIstToOffset } from "@/modules/placements/tpo-calendar-followup-model";

export type TpoCalendarLeadOption = {
  id: string;
  name: string;
  companyName: string | null;
  email?: string | null;
};

async function submitFollowup(
  url: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
  action:TpoFollowupAction,
) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const code =
      result &&
      typeof result === "object" &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : null;
    throw new Error(tpoCalendarFollowupError(action,code));
  }
}

// One lock shared by every rendered move/done form for a given follow-up ID.
const pendingFollowupIds = new Set<string>();
function beginFollowupChange(followupId:string):boolean {
  if (pendingFollowupIds.has(followupId)) return false;
  pendingFollowupIds.add(followupId);
  return true;
}
function endFollowupChange(followupId:string):void {
  pendingFollowupIds.delete(followupId);
}

const inputClass =
  "min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground";

export function TpoCalendarCreateFollowup({
  leads,
  totalLeads,
}: {
  leads: readonly TpoCalendarLeadOption[];
  totalLeads: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [leadQuery, setLeadQuery] = useState("");
  const [leadId, setLeadId] = useState("");
  const search = leadQuery.trim().toLowerCase();
  const matchingLeads = search.length < 2 ? [] : leads.filter((lead) =>
    [lead.name, lead.companyName, lead.email].some(
      (part) => part?.toLowerCase().includes(search),
    ),
  ).slice(0, 50);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      await submitFollowup("/api/placements/tpo/calendar/follow-ups", "POST", {
        leadId: String(data.get("leadId") ?? ""),
        dueAt: calendarLocalIstToOffset(String(data.get("dueAt") ?? "")),
        note: String(data.get("note") ?? "").trim() || null,
      },"ADD");
      form.reset();
      setLeadQuery("");
      setLeadId("");
      setMessage(tpoCalendarFollowupSuccess("ADD"));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create follow-up.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Create recruiter follow-up" className="border-t border-border pt-4">
      <h2 className="m-0 text-base font-semibold text-foreground">Create recruiter follow-up</h2>
      <p className="mt-1 text-sm text-body">
        Schedule for an existing recruiter lead. Enter the due date and time in IST.
      </p>
      {totalLeads > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Search all {totalLeads} recruiter leads by name, company or email (at least two characters).
        </p>
      ) : null}
      {leads.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No recruiter leads found. Create a lead in Engage first.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
            Recruiter lead
            <Input type="search" value={leadQuery} className={inputClass}
              placeholder="Search name, company or email" aria-label="Search recruiter leads"
              onChange={(event) => { setLeadQuery(event.target.value); setLeadId(""); }} />
            <Select name="leadId" required value={leadId} disabled={matchingLeads.length===0}
              onChange={(event) => setLeadId(event.target.value)} className={inputClass}>
              <option value="">Select a matching lead</option>
              {matchingLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} · {lead.companyName || "Unspecified company"}
                  {lead.email ? " · " + lead.email : ""}
                </option>
              ))}
            </Select>
            {search.length>=2&&matchingLeads.length===0 ? (
              <span role="status" className="text-xs text-muted-foreground">No matching recruiter leads.</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
            Due date and time (IST)
            <Input name="dueAt" type="datetime-local" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-2 text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
            Note (optional)
            <Input name="note" maxLength={500} className={inputClass} />
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={busy || !leadId} className="min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary disabled:opacity-50">
              {busy ? "Saving…" : "Create follow-up"}
            </Button>
          </div>
        </form>
      )}
      {message?<InlineNotice tone={message===tpoCalendarFollowupSuccess("ADD")?"success":"error"} message={message}/>:null}
    </section>
  );
}

export function TpoCalendarMoveFollowup({
  followupId,
  currentIst,
}: {
  followupId: string;
  currentIst: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !beginFollowupChange(followupId)) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await submitFollowup(
        `/api/placements/tpo/calendar/follow-ups/${encodeURIComponent(followupId)}`,
        "PATCH",
        { dueAt: calendarLocalIstToOffset(String(data.get("dueAt") ?? "")) },
        "MOVE",
      );
      setMessage(tpoCalendarFollowupSuccess("MOVE"));
      setMoveOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reschedule follow-up.");
    } finally {
      endFollowupChange(followupId);
      setBusy(false);
    }
  }

  async function onDone() {
    if (busy || !beginFollowupChange(followupId)) return;
    setBusy(true);
    setMessage("");
    try {
      await submitFollowup(
        `/api/placements/tpo/calendar/follow-ups/${encodeURIComponent(followupId)}/complete`,
        "POST",
        {},
        "DONE",
      );
      setMessage(tpoCalendarFollowupSuccess("DONE"));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not mark follow-up done.");
    } finally {
      endFollowupChange(followupId);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-[var(--lms-space-3)]">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" type="button" disabled={busy}
          onClick={() => { setMessage(""); setMoveOpen(true); }}>
          Move follow-up
        </Button>
        <Button variant="secondary" type="button" disabled={busy}
          onClick={() => void onDone()}>
          {busy ? "Saving…" : "Done"}
        </Button>
      </div>
      <Dialog open={moveOpen} onOpenChange={(open) => { if (!busy) setMoveOpen(open); }}
        title="Move this follow-up" description="Choose the new due date and time in IST."
        dismissible={!busy}>
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
            Due date and time (IST)
            <Input name="dueAt" type="datetime-local" key={currentIst}
              defaultValue={currentIst} required className={inputClass} />
          </label>
          {message && message !== tpoCalendarFollowupSuccess("MOVE")
            ? <InlineNotice tone="error" message={message} /> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" disabled={busy}
              onClick={() => setMoveOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? "Moving…" : "Move follow-up"}
            </Button>
          </div>
        </form>
      </Dialog>
      {message ? <InlineNotice
        tone={message === tpoCalendarFollowupSuccess("MOVE") || message === tpoCalendarFollowupSuccess("DONE") ? "success" : "error"}
        message={message} /> : null}
    </div>
  );
}
