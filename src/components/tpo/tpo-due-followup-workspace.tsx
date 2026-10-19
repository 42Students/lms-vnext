"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {calendarLocalIstToOffset} from "@/modules/placements/tpo-calendar-followup-model";
import {tpoFollowupContactLinks} from "@/modules/placements/tpo-followup-queue-model";

type DueRow = {
  id: string;
  leadId: string;
  leadName: string;
  companyName: string | null;
  dueAt: string;
  note: string | null;
  phoneNorm:string|null;
  canContact:boolean;
  overdue: boolean;
};
type Lead = { id: string; name: string; companyName: string | null };
type Outcome = "CONTACTED" | "NO_RESPONSE" | "DECLINED" | "OTHER";
type Queue = {
  rows: DueRow[];
  dueCount: number;
  hasMoreDue: boolean;
  leads: Lead[];
  hasMoreLeads: boolean;
  page:number;pageSize:number;total:number;totalPages:number;
  scope:"MINE"|"TEAM";
  window:"DUE"|"NEXT_7_DAYS";
};

const field = "min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-base text-foreground sm:text-sm";
const action = "min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50";
function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(value)) + " IST";
}

export function TpoDueFollowupWorkspace({ data }: { data: Queue }) {
  const router = useRouter();
  const [leadId, setLeadId] = useState(data.leads[0]?.id ?? "");
  const [dueLocal, setDueLocal] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("CONTACTED");
  const [doneNote, setDoneNote] = useState("");
  const [pending, setPending] = useState(false);
  const inFlightRef=useRef(false);
  const [confirmCreate,setConfirmCreate]=useState(false);
  const [confirmComplete,setConfirmComplete]=useState<DueRow|null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function post(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      throw new Error(result?.error === "DB09_MIGRATIONS_PENDING"
        ? "Recruiter follow-ups are unavailable until DB09 is verified."
        : result?.error === "TPO_CRM_FOLLOWUP_ALREADY_DONE"
          ? "The follow-up has already changed. Reload the due queue."
          : "The operation was not completed. Reload to check the current state.");
    }
  }

  async function create() {
    if(inFlightRef.current||pending)return;
    let parsedDue:Date|null=null;
    try{parsedDue=dueLocal?new Date(calendarLocalIstToOffset(dueLocal)):null;}catch{parsedDue=null;}
    if (!leadId || !parsedDue || Number.isNaN(parsedDue.getTime())) {
      setError("Select a recruiter and a valid follow-up date and time.");
      return;
    }
    inFlightRef.current=true;
    setPending(true); setError(""); setSuccess("");
    try {
      await post("/api/placements/tpo/follow-up-queue", {
        confirmed: true, leadId, dueAt: parsedDue.toISOString(),
        note: createNote.trim() || null,
      });
      setConfirmCreate(false);setDueLocal(""); setCreateNote("");
      setSuccess("Follow-up scheduled. Use the Due now / Next 7 days views to locate open tasks.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow-up scheduling failed.");
    } finally { inFlightRef.current=false;setPending(false); }
  }

  async function complete(row: DueRow) {
    if(inFlightRef.current||pending)return;
    if (!doneNote.trim()) {
      setError("Record a brief outcome note before completing the follow-up.");
      return;
    }
    setPending(true); setError(""); setSuccess("");
    try {
      await post(
        "/api/placements/tpo/follow-up-queue/" +
          encodeURIComponent(row.id) + "/complete",
        {
          confirmed: true, expectedDueAt: row.dueAt,
          outcome, note: doneNote.trim(),
        },
      );
      setConfirmComplete(null);setActiveId(null); setDoneNote("");
      setSuccess("Follow-up completed and recorded in the recruiter activity history.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow-up completion failed.");
    } finally { inFlightRef.current=false;setPending(false); }
  }

  return (
    <div className="space-y-6">
      {error ? <p role="alert" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-error">{error}</p> : null}
      {success ? <p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">{success}</p> : null}
      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Schedule a follow-up</h2>
        <p className="mt-1 text-sm text-body">
          Select a college recruiter, choose an India-local date and time, and confirm.
          Both the task and its staff-attributed activity record are saved together.
        </p>
        {data.hasMoreLeads ? (
          <p role="status" className="mt-2 text-xs text-muted-foreground">
            Showing 200 most recently updated eligible recruiter leads. Use individual lead detail for others.
          </p>
        ) : null}
        {data.leads.length === 0 ? (
          <p className="mt-3 text-sm text-body">
            There are no eligible recruiter leads to schedule. Add a recruiter lead first.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-foreground">
              Recruiter
              <Select className={"mt-1 " + field} value={leadId} disabled={pending}
                onChange={(event) => setLeadId(event.target.value)}>
                {data.leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name + (lead.companyName ? " · " + lead.companyName : "")}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Follow-up time (local)
              <Input type="datetime-local" className={"mt-1 " + field}
                value={dueLocal} disabled={pending} onChange={(event) => setDueLocal(event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-foreground sm:col-span-2">
              Preparation note (optional)
              <Textarea rows={2} maxLength={500} className={"mt-1 " + field}
                value={createNote} disabled={pending} onChange={(event) => setCreateNote(event.target.value)} />
            </label>
            <Button variant="secondary" type="button" disabled={pending || !leadId || !dueLocal}
              onClick={() => setConfirmCreate(true)} variant="primary" className={action}>
              {pending ? "Saving..." : "Review and confirm follow-up"}
            </Button>
          </div>
        )}
      </section>
      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
        <div className="border-b border-border p-5">
          <h2 className="text-base font-semibold text-foreground">
            {data.window==="DUE"?"Follow-ups due":"Upcoming follow-ups"} ({data.total})
          </h2>
          <p className="mt-1 text-sm text-body">
            {data.window==="DUE"?"Open tasks due now or earlier.":"Open tasks scheduled from now through the next seven days."}
            This is a 25-row page of the selected ownership and date window, not a college-wide total.
          </p>
        </div>
        {data.rows.length === 0 ? (
          <p role="status" className="p-5 text-sm text-body">
            {data.window==="DUE"?"No open follow-ups are due at this time.":"No open follow-ups are scheduled in the next seven days."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.rows.map((row) => (
              <article key={row.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link className="font-semibold text-[var(--lms-teal-deep)] hover:underline"
                      href={"/tpo/recruiters/" + encodeURIComponent(row.leadId)}>{row.leadName}</Link>
                    {row.companyName ? <p className="text-sm text-body">{row.companyName}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Due {displayDate(row.dueAt)}
                    </p>
                    {row.canContact?<div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                      {tpoFollowupContactLinks(row.phoneNorm,row.canContact).call?<a href={tpoFollowupContactLinks(row.phoneNorm,row.canContact).call!} className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] hover:underline">Call recruiter ↗</a>:null}
                      {tpoFollowupContactLinks(row.phoneNorm,row.canContact).whatsapp?<a href={tpoFollowupContactLinks(row.phoneNorm,row.canContact).whatsapp!} className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] hover:underline">Open WhatsApp ↗</a>:null}
                    </div>:null}
                  </div>
                  <Button variant="secondary" type="button" disabled={pending}
                    onClick={() => {
                      setError("");
                      setActiveId(activeId === row.id ? null : row.id);
                      setDoneNote(""); setOutcome("CONTACTED");
                    }}
                    className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground">
                    {activeId === row.id ? "Cancel" : "Record outcome and Done"}
                  </Button>
                </div>
                {row.note ? <p className="whitespace-pre-wrap text-sm text-body">{row.note}</p> : null}
                {activeId === row.id ? (
                  <div className="grid gap-3 rounded-[var(--lms-control-radius)] bg-surface-secondary p-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-foreground">
                      Outcome
                      <Select value={outcome} disabled={pending}
                        onChange={(event) => setOutcome(event.target.value as Outcome)}
                        className={"mt-1 " + field}>
                        <option value="CONTACTED">Contacted</option>
                        <option value="NO_RESPONSE">No response</option>
                        <option value="DECLINED">Declined</option>
                        <option value="OTHER">Other</option>
                      </Select>
                    </label>
                    <label className="block text-sm font-semibold text-foreground sm:col-span-2">
                      Outcome note (required)
                      <Textarea maxLength={500} value={doneNote} disabled={pending}
                        onChange={(event) => setDoneNote(event.target.value)}
                        className={"mt-1 " + field} rows={2} />
                    </label>
                    <Button variant="secondary" type="button" onClick={() => setConfirmComplete(row)}
                      disabled={pending || !doneNote.trim()} variant="primary" className={action}>
                      {pending ? "Recording..." : "Review and confirm Done"}
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
      <ConfirmDialog open={confirmCreate} onOpenChange={setConfirmCreate}
       title="Schedule this follow-up and record an immutable staff audit entry?"
       confirmLabel="Confirm" confirmVariant="primary" pending={pending}
       onConfirm={()=>void create()}/>
      <ConfirmDialog open={confirmComplete!==null} onOpenChange={open=>{if(!open)setConfirmComplete(null);}}
       title={confirmComplete?"Mark the follow-up for "+confirmComplete.leadName+
        " done with outcome "+outcome+"? This action is terminal and audited.":""}
       confirmLabel="Confirm" pending={pending}
       onConfirm={()=>{if(confirmComplete)void complete(confirmComplete);}}/>
    </div>
  );
}