"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  designation: string | null;
  emailNorm: string | null;
  phoneNorm: string | null;
  companyName: string | null;
  source: string | null;
  manualStage: string;
  notNowReason: string | null;
  notNowUntil: string | null;
  inviteSentAt: string | null;
  recruiterUserId: string | null;
};
type Activity = {
  id: string;
  type: string;
  outcome: string | null;
  note: string | null;
  createdAt: string;
};
type Followup = {
  id: string;
  note: string | null;
  dueAt: string;
  doneAt: string | null;
};
type EditValues = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  companyName: string;
  source: string;
};
const input = "min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
const button = "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-secondary disabled:opacity-50";
const primary = "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50";
const SOURCES = [
  ["", "Added by hand / Imported"], ["ALUMNI", "Alumni"],
  ["REFERRAL", "Referral"], ["LINKEDIN", "LinkedIn"],
  ["JOB_PORTAL", "Job portal"], ["EVENT", "Event or job fair"],
  ["COLD_OUTREACH", "Cold outreach"], ["COMPANY_REACHED_OUT", "Company reached out"],
] as const;
const ACTIVITY_TYPES = ["CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE"] as const;

function messageFor(status: number, error?: string) {
  if (status === 503 && error === "DB09_MIGRATIONS_PENDING") {
    return "Recruiter CRM remains unavailable until DB09 migrations and database checks pass.";
  }
  if (status === 409) return "Another lead already has that contact, or this action conflicts with its current state.";
  if (status === 422) return "At least one valid contact is required.";
  if (status === 404) return "The recruiter lead was not found in this college.";
  if (status === 403) return "You do not have permission for this college.";
  return "Could not complete the request. Try again.";
}

async function readResponse<T>(response: Response): Promise<T> {
  let parsed: { error?: string } & Partial<T>;
  try {
    parsed = await response.json() as { error?: string } & Partial<T>;
  } catch {
    throw new Error("Unexpected response from the server.");
  }
  if (!response.ok) throw new Error(messageFor(response.status, parsed.error));
  return parsed as T;
}

export function RecruiterLeadDetailWorkspace({
  collegeId, leadId,
}: { collegeId: string; leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<EditValues>({
    name: "", email: "", phone: "", designation: "", companyName: "", source: "",
  });
  const [logType, setLogType] = useState<(typeof ACTIVITY_TYPES)[number]>("CALL");
  const [logNote, setLogNote] = useState("");
  const [logOutcome, setLogOutcome] = useState("");
  const [followAt, setFollowAt] = useState("");
  const [followNote, setFollowNote] = useState("");
  const [notNowOpen, setNotNowOpen] = useState(false);
  const [notNowReason, setNotNowReason] = useState("");
  const [revisitDate, setRevisitDate] = useState("");

  const base = "/api/placements/tpo/leads/" + encodeURIComponent(leadId);
  const params = "?collegeId=" + encodeURIComponent(collegeId);
  const load = useCallback(async (signal?: AbortSignal) => {
    setPhase("loading");
    setError("");
    try {
      const [l, a, f] = await Promise.all([
        fetch(base + params, { signal, cache: "no-store", credentials: "same-origin" }),
        fetch(base + "/activity" + params, { signal, cache: "no-store", credentials: "same-origin" }),
        fetch(base + "/follow-ups" + params, { signal, cache: "no-store", credentials: "same-origin" }),
      ]);
      const result = await Promise.all([
        readResponse<{ lead: Lead }>(l),
        readResponse<{ activities: Activity[] }>(a),
        readResponse<{ followups: Followup[] }>(f),
      ]);
      if (signal?.aborted) return;
      setLead(result[0].lead);
      setActivities(result[1].activities);
      setFollowups(result[2].followups);
      setPhase("ready");
    } catch (cause) {
      if (signal?.aborted) return;
      setLead(null);
      setActivities([]);
      setFollowups([]);
      setError(cause instanceof Error ? cause.message : "Could not load recruiter.");
      setPhase("error");
    }
  }, [base, params]);

  useEffect(() => {
    setLead(null);
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function mutate(url: string, method: "PATCH" | "POST", body: unknown) {
    setSaving(true);
    setActionError("");
    try {
      await readResponse(await fetch(url, {
        method, credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }));
      await load();
      return true;
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Save failed.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function openEdit() {
    if (!lead) return;
    setEdit({
      name: lead.name,
      email: lead.emailNorm ?? "",
      phone: lead.phoneNorm ?? "",
      designation: lead.designation ?? "",
      companyName: lead.companyName ?? "",
      source: SOURCES.some(([code]) => code === lead.source) ? lead.source ?? "" : "",
    });
    setActionError("");
    setEditing(true);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await mutate(base, "PATCH", {
      collegeId,
      name: edit.name,
      email: edit.email.trim() || null,
      phone: edit.phone.trim() || null,
      designation: edit.designation.trim() || null,
      ...(edit.companyName.trim() ? { companyName: edit.companyName.trim() } : {}),
      source: edit.source || null,
    });
    if (ok) setEditing(false);
  }

  async function addActivity(event: React.FormEvent) {
    event.preventDefault();
    const ok = await mutate(base + "/activity", "POST", {
      collegeId, type: logType,
      outcome: logOutcome.trim() || null,
      note: logNote.trim() || null,
    });
    if (ok) { setLogNote(""); setLogOutcome(""); }
  }

  async function addFollowup(event: React.FormEvent) {
    event.preventDefault();
    const time = new Date(followAt);
    if (!followAt || Number.isNaN(time.getTime())) {
      setActionError("Provide a valid follow-up date and time.");
      return;
    }
    const ok = await mutate(base + "/follow-ups", "POST", {
      collegeId, dueAt: time.toISOString(), note: followNote.trim() || null,
    });
    if (ok) { setFollowAt(""); setFollowNote(""); }
  }

  async function markNotNow(event: React.FormEvent) {
    event.preventDefault();
    const ok = await mutate(base + "/not-now", "POST", {
      collegeId,
      reason: notNowReason.trim() || null,
      revisitDate: revisitDate || null,
    });
    if (ok) setNotNowOpen(false);
  }

  return (
    <section className="space-y-6">
      <Link href="/tpo/recruiters" className="text-sm font-medium text-primary-text hover:underline">
        ← Recruiter leads
      </Link>
      {phase === "loading" ? (
        <p role="status" className="rounded-lg border border-border bg-surface p-6">Loading recruiter details…</p>
      ) : phase === "error" || !lead ? (
        <div role="alert" className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <p>{error || "Recruiter unavailable."}</p>
          <button type="button" className={button} onClick={() => void load()}>Retry</button>
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">
                {lead.companyName || "Company not provided"}
                {lead.designation ? " · " + lead.designation : ""}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Stage: {lead.manualStage.replace("_", " ")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={openEdit}>Edit details</button>
              <button type="button" className={button} onClick={() => setNotNowOpen(true)}>Not now…</button>
            </div>
          </header>
          {lead.manualStage === "NOT_NOW" ? (
            <div role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm">
              Not now: {lead.notNowReason || "No reason recorded"}.
              {lead.notNowUntil ? " Revisit on " + lead.notNowUntil : ""}
            </div>
          ) : null}
          {actionError ? <p role="alert" className="rounded-md border border-border p-3 text-sm text-destructive">{actionError}</p> : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-3 rounded-lg border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Contact</h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-muted-foreground">Email</dt>
                  <dd>{lead.emailNorm ? <a href={"mailto:" + lead.emailNorm} className="text-primary-text underline">{lead.emailNorm}</a>
                    : <button type="button" className="text-primary-text underline" onClick={openEdit}>Add email</button>}</dd></div>
                <div><dt className="text-muted-foreground">Phone</dt>
                  <dd>{lead.phoneNorm ? <a href={"tel:" + lead.phoneNorm} className="text-primary-text underline">{lead.phoneNorm}</a>
                    : <button type="button" className="text-primary-text underline" onClick={openEdit}>Add phone</button>}</dd></div>
                <div><dt className="text-muted-foreground">Source</dt><dd>{lead.source || "Added by hand"}</dd></div>
              </dl>
              <p className="text-xs text-muted-foreground">
                Invites and joined-recruiter access require the pending recruiter invite lifecycle integration.
              </p>
            </section>

            <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Log an interaction</h2>
              <form className="space-y-3" onSubmit={e => void addActivity(e)}>
                <label className="block text-sm">Type
                  <select className={input + " mt-1"} value={logType}
                    onChange={e => setLogType(e.target.value as typeof logType)}>
                    {ACTIVITY_TYPES.map(type => <option value={type} key={type}>{type}</option>)}
                  </select>
                </label>
                <label className="block text-sm">Outcome
                  <input className={input + " mt-1"} maxLength={30} value={logOutcome}
                    onChange={e => setLogOutcome(e.target.value)} />
                </label>
                <label className="block text-sm">Notes
                  <textarea className={input + " mt-1"} maxLength={2000} rows={3} value={logNote}
                    onChange={e => setLogNote(e.target.value)} />
                </label>
                <button className={primary} type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Log activity"}
                </button>
              </form>
              <h3 className="font-semibold">Timeline</h3>
              {activities.length ? (
                <ol className="space-y-3">
                  {activities.map(a => (
                    <li key={a.id} className="border-l-2 border-border pl-3 text-sm">
                      <span className="font-semibold">{a.type}</span>
                      {a.outcome ? " · " + a.outcome : ""}
                      <time className="ml-2 text-muted-foreground" dateTime={a.createdAt}>
                        {new Date(a.createdAt).toLocaleString()}
                      </time>
                      {a.note ? <p className="mt-1 whitespace-pre-wrap">{a.note}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted-foreground">No recorded interactions yet.</p>}
            </section>
          </div>

          <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">Follow-ups</h2>
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end"
              onSubmit={e => void addFollowup(e)}>
              <label className="block text-sm">Due date and time
                <input className={input + " mt-1"} type="datetime-local" required
                  value={followAt} onChange={e => setFollowAt(e.target.value)} />
              </label>
              <label className="block text-sm">Next step
                <input className={input + " mt-1"} maxLength={500}
                  value={followNote} onChange={e => setFollowNote(e.target.value)} />
              </label>
              <button className={primary} type="submit" disabled={saving}>
                Add follow-up
              </button>
            </form>
            {followups.length ? (
              <ul className="space-y-2">
                {followups.map(f => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                    <div>
                      <time className="font-medium" dateTime={f.dueAt}>{new Date(f.dueAt).toLocaleString()}</time>
                      <p className="text-muted-foreground">{f.note || "No note"}</p>
                    </div>
                    {f.doneAt ? <span className="text-muted-foreground">Done</span> : (
                      <button className={button} type="button" disabled={saving} onClick={() => void mutate(
                        "/api/placements/tpo/follow-ups/" + encodeURIComponent(f.id) + "/done",
                        "POST", { collegeId },
                      )}>Mark done</button>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No next step yet. Add a follow-up above.</p>}
          </section>

          {editing ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
              <form className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl bg-surface p-6 shadow-xl"
                role="dialog" aria-modal="true" aria-label="Edit recruiter lead"
                onSubmit={e => void saveEdit(e)}>
                <h2 className="text-lg font-semibold">Edit recruiter lead</h2>
                {(["name", "email", "phone", "designation", "companyName"] as const).map(name => (
                  <label key={name} className="block text-sm">
                    {name === "companyName" ? "Company name" : name[0].toUpperCase() + name.slice(1)}
                    <input className={input + " mt-1"} value={edit[name]}
                      required={name === "name"}
                      onChange={e => setEdit(current => ({ ...current, [name]: e.target.value }))} />
                  </label>
                ))}
                <label className="block text-sm">Found through
                  <select className={input + " mt-1"} value={edit.source}
                    onChange={e => setEdit(current => ({ ...current, source: e.target.value }))}>
                    {SOURCES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </label>
                {actionError ? <p role="alert" className="text-destructive">{actionError}</p> : null}
                <div className="flex justify-end gap-2">
                  <button className={button} type="button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
                  <button className={primary} type="submit" disabled={saving}>{saving ? "Saving…" : "Save details"}</button>
                </div>
              </form>
            </div>
          ) : null}

          {notNowOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
              <form className="w-full max-w-md space-y-4 rounded-xl bg-surface p-6 shadow-xl"
                role="dialog" aria-modal="true" aria-label="Mark recruiter not now"
                onSubmit={e => void markNotNow(e)}>
                <h2 className="text-lg font-semibold">Mark not now</h2>
                <label className="block text-sm">Reason
                  <textarea className={input + " mt-1"} maxLength={255} rows={3}
                    value={notNowReason} onChange={e => setNotNowReason(e.target.value)} />
                </label>
                <label className="block text-sm">Revisit on
                  <input className={input + " mt-1"} type="date" value={revisitDate}
                    onChange={e => setRevisitDate(e.target.value)} />
                </label>
                {actionError ? <p role="alert" className="text-destructive">{actionError}</p> : null}
                <div className="flex justify-end gap-2">
                  <button className={button} type="button" disabled={saving} onClick={() => setNotNowOpen(false)}>Cancel</button>
                  <button className={primary} type="submit" disabled={saving}>Mark not now</button>
                </div>
              </form>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
