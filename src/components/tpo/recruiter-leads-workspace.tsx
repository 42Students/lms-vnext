"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  name: string;
  emailNorm: string | null;
  phoneNorm: string | null;
  companyName: string | null;
  designation: string | null;
  source: string | null;
  manualStage: string;
  notNowReason: string | null;
  inviteSentAt: string | null;
  recruiterUserId: string | null;
};

type Phase = "loading" | "ready" | "error" | "migration-pending";
type NewLead = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  source: string;
};
const EMPTY: NewLead = {
  name: "", email: "", phone: "", companyName: "",
  designation: "", source: "",
};
const SOURCE_CHOICES = [
  ["ALUMNI", "Alumni"], ["REFERRAL", "Referral"],
  ["LINKEDIN", "LinkedIn"], ["JOB_PORTAL", "Job portal"],
  ["EVENT", "Event or job fair"], ["COLD_OUTREACH", "Cold outreach"],
  ["COMPANY_REACHED_OUT", "Company reached out"],
] as const;
const STAGES = ["ALL", "NEW", "CONTACTED", "NOT_NOW"] as const;

function friendlyError(status: number, payload: { error?: string }) {
  if (status === 503 && payload.error === "DB09_MIGRATIONS_PENDING") {
    return "Recruiter CRM is awaiting database verification. No lead data has been loaded.";
  }
  if (status === 409 && payload.error === "TPO_CRM_LEAD_DUPLICATE") {
    return "This contact already belongs to another recruiter lead in your college.";
  }
  if (status === 403) return "You do not have permission to manage recruiters in this college.";
  if (status === 401) return "Your session expired. Sign in again to continue.";
  return "The request failed. Check your connection and try again.";
}

const inputStyle = "min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
const buttonStyle = "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50";
const primaryStyle = "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

export function RecruiterLeadsWorkspace({ collegeId }: { collegeId: string }) {
  const [rows, setRows] = useState<Lead[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<(typeof STAGES)[number]>("ALL");
  const [view, setView] = useState<"table" | "board">("table");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<NewLead>(EMPTY);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<Lead | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setPhase("loading");
    setError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/leads?collegeId=" + encodeURIComponent(collegeId),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const data = await response.json() as { leads?: Lead[]; error?: string };
      if (!response.ok) {
        if (signal?.aborted) return;
        setPhase(response.status === 503 && data.error === "DB09_MIGRATIONS_PENDING"
          ? "migration-pending" : "error");
        setError(friendlyError(response.status, data));
        return;
      }
      if (signal?.aborted) return;
      setRows(Array.isArray(data.leads) ? data.leads : []);
      setPhase("ready");
    } catch {
      if (signal?.aborted) return;
      setPhase("error");
      setError("Recruiter leads could not be loaded. Try again.");
    }
  }, [collegeId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const visible = useMemo(() => rows.filter(lead => {
    if (stage !== "ALL" && lead.manualStage !== stage) return false;
    const terms = [lead.name, lead.emailNorm, lead.phoneNorm, lead.companyName]
      .filter(Boolean).join(" ").toLowerCase();
    return terms.includes(query.trim().toLowerCase());
  }), [rows, stage, query]);

  function field(name: keyof NewLead, value: string) {
    setForm(current => ({ ...current, [name]: value }));
    setDuplicate(null);
    setSaveError("");
  }

  async function checkContact() {
    const contact = form.email.trim() || form.phone.trim();
    if (!contact) return;
    setChecking(true);
    setSaveError("");
    try {
      const response = await fetch(
        "/api/placements/tpo/leads/check?collegeId=" +
          encodeURIComponent(collegeId) + "&contact=" + encodeURIComponent(contact),
        { credentials: "same-origin", cache: "no-store" },
      );
      if (response.status === 204) {
        setDuplicate(null);
      } else {
        const data = await response.json() as { lead?: Lead; error?: string };
        if (!response.ok) throw new Error(friendlyError(response.status, data));
        setDuplicate(data.lead ?? null);
      }
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not check contact.");
    } finally {
      setChecking(false);
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !(form.email.trim() || form.phone.trim())) {
      setSaveError("Enter a name and at least one contact method.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/placements/tpo/leads", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeId,
          name: form.name.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          ...(form.companyName.trim() ? { companyName: form.companyName.trim() } : {}),
          ...(form.designation.trim() ? { designation: form.designation.trim() } : {}),
          ...(form.source ? { source: form.source } : {}),
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(friendlyError(response.status, data));
      setAdding(false);
      setForm(EMPTY);
      setDuplicate(null);
      await load();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not create lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5" aria-label="Recruiter leads">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recruiter Leads</h1>
          <p className="text-sm text-muted-foreground">
            Track employer contacts, outreach and follow-ups for your college.
          </p>
        </div>
        <button type="button" className={primaryStyle} disabled={phase !== "ready"}
          onClick={() => { setAdding(true); setForm(EMPTY); setSaveError(""); setDuplicate(null); }}>
          Add recruiter lead
        </button>
      </div>

      {phase !== "ready" ? (
        <div role={phase === "loading" ? "status" : "alert"}
          className="rounded-lg border border-border bg-surface p-5">
          {phase === "loading" ? "Loading recruiter leads…" : error}
          {phase === "error" ? (
            <button className={buttonStyle + " ml-3"} onClick={() => void load()}>Retry</button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface p-4">
            <label className="min-w-48 flex-1 text-sm">
              Search name, company or contact
              <input className={inputStyle + " mt-1"} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search recruiter leads" />
            </label>
            <label className="min-w-40 text-sm">
              Stage
              <select className={inputStyle + " mt-1"} value={stage}
                onChange={e => setStage(e.target.value as typeof stage)}>
                {STAGES.map(x => <option value={x} key={x}>{x === "ALL" ? "All stages" : x.replace("_", " ")}</option>)}
              </select>
            </label>
            <label className="min-w-36 text-sm">
              View
              <select className={inputStyle + " mt-1"} value={view}
                onChange={e => setView(e.target.value as typeof view)}>
                <option value="table">Table</option><option value="board">Board</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {visible.length} of {rows.length} recruiter leads
          </p>
          {visible.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted-foreground">
              {rows.length ? "No leads match your filters." : "No recruiter leads yet. Add your first contact."}
            </div>
          ) : view === "table" ? (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-secondary text-muted-foreground">
                  <tr>{["Contact", "Company", "Stage", "Source", "Email", "Phone"].map(x =>
                    <th key={x} scope="col" className="px-4 py-3 font-semibold">{x}</th>)}</tr>
                </thead>
                <tbody>
                  {visible.map(lead => (
                    <tr key={lead.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <Link className="text-primary-text underline-offset-2 hover:underline"
                          href={"/tpo/recruiters/" + encodeURIComponent(lead.id)}>{lead.name}</Link>
                      </td>
                      <td className="px-4 py-3">{lead.companyName || "—"}</td>
                      <td className="px-4 py-3">{lead.manualStage.replace("_", " ")}</td>
                      <td className="px-4 py-3">{lead.source || "Manual"}</td>
                      <td className="px-4 py-3">{lead.emailNorm || "—"}</td>
                      <td className="px-4 py-3">{lead.phoneNorm || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {(["NEW", "CONTACTED", "NOT_NOW"] as const).map(column => (
                <section key={column} className="rounded-lg border border-border bg-surface p-4">
                  <h2 className="mb-3 font-semibold">{column.replace("_", " ")} · {visible.filter(x => x.manualStage === column).length}</h2>
                  <div className="space-y-2">
                    {visible.filter(x => x.manualStage === column).map(lead => (
                      <Link key={lead.id} href={"/tpo/recruiters/" + encodeURIComponent(lead.id)}
                        className="block rounded-md border border-border p-3 hover:bg-surface-secondary">
                        <span className="block font-medium">{lead.name}</span>
                        <span className="block text-sm text-muted-foreground">{lead.companyName || lead.emailNorm || lead.phoneNorm}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Invited, Joined, Drive Planned and Recruited are derived workflow stages and will appear only after their persisted relationships are integrated.
          </p>
        </>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <form role="dialog" aria-modal="true" aria-label="Add recruiter lead"
            onSubmit={e => void create(e)}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Add recruiter lead</h2>
              <button type="button" className={buttonStyle} onClick={() => setAdding(false)} disabled={saving}>Close</button>
            </div>
            <label className="block text-sm">Name *<input className={inputStyle + " mt-1"} required maxLength={150}
              value={form.name} onChange={e => field("name", e.target.value)} /></label>
            <label className="block text-sm">Email<input className={inputStyle + " mt-1"} type="email" maxLength={150}
              value={form.email} onChange={e => field("email", e.target.value)} /></label>
            <label className="block text-sm">Phone<input className={inputStyle + " mt-1"} type="tel" maxLength={30}
              value={form.phone} onChange={e => field("phone", e.target.value)} /></label>
            <button type="button" className={buttonStyle} disabled={checking || !(form.email || form.phone)}
              onClick={() => void checkContact()}>{checking ? "Checking…" : "Check for existing contact"}</button>
            {duplicate ? <p role="alert" className="text-sm text-destructive">
              Contact already exists: <Link className="underline" href={"/tpo/recruiters/" + duplicate.id}>{duplicate.name}</Link>.
            </p> : null}
            <label className="block text-sm">Company<input className={inputStyle + " mt-1"} maxLength={150}
              value={form.companyName} onChange={e => field("companyName", e.target.value)} /></label>
            <label className="block text-sm">Designation<input className={inputStyle + " mt-1"} maxLength={100}
              value={form.designation} onChange={e => field("designation", e.target.value)} /></label>
            <label className="block text-sm">Found through
              <select className={inputStyle + " mt-1"} value={form.source}
                onChange={e => field("source", e.target.value)}>
                <option value="">Added by hand</option>
                {SOURCE_CHOICES.map(([code,label]) => <option value={code} key={code}>{label}</option>)}
              </select>
            </label>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="flex justify-end">
              <button type="submit" className={primaryStyle}
                disabled={saving || checking || Boolean(duplicate)}>
                {saving ? "Creating…" : "Create recruiter lead"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
