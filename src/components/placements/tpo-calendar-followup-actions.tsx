"use client";

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

const inputClass =
  "min-h-10 w-full rounded-[9px] border border-border bg-surface px-3 text-sm text-foreground";

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
    <section aria-label="Create recruiter follow-up" className="border-t border-border pt-4 sm:p-5">
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
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Recruiter lead
            <input type="search" value={leadQuery} className={inputClass}
              placeholder="Search name, company or email" aria-label="Search recruiter leads"
              onChange={(event) => { setLeadQuery(event.target.value); setLeadId(""); }} />
            <select name="leadId" required value={leadId} disabled={matchingLeads.length===0}
              onChange={(event) => setLeadId(event.target.value)} className={inputClass}>
              <option value="">Select a matching lead</option>
              {matchingLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} · {lead.companyName || "Unspecified company"}
                  {lead.email ? " · " + lead.email : ""}
                </option>
              ))}
            </select>
            {search.length>=2&&matchingLeads.length===0 ? (
              <span role="status" className="text-xs text-muted-foreground">No matching recruiter leads.</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Due date and time (IST)
            <input name="dueAt" type="datetime-local" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Note (optional)
            <input name="note" maxLength={500} className={inputClass} />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={busy || !leadId} className="min-h-10 w-full rounded-[9px] bg-primary px-4 text-sm font-[650] text-on-primary disabled:opacity-50">
              {busy ? "Saving…" : "Create follow-up"}
            </button>
          </div>
        </form>
      )}
      <p role="status" aria-live="polite" className="mt-2 text-sm text-body">{message}</p>
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reschedule follow-up.");
    } finally {
      setBusy(false);
    }
  }

  async function onDone() {
    if (busy) return;
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
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold text-body">
        Move follow-up (IST)
        <input
          name="dueAt"
          type="datetime-local"
          key={currentIst}
          defaultValue={currentIst}
          required
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="min-h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle disabled:opacity-50"
      >
        {busy ? "Moving…" : "Reschedule"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onDone()}
        className="min-h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle disabled:opacity-50"
      >
        {busy ? "Saving…" : "Done"}
      </button>
      <p role="status" aria-live="polite" className="w-full text-xs text-body">{message}</p>
    </form>
  );
}
