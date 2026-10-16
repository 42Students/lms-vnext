"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { calendarLocalIstToOffset } from "@/modules/placements/tpo-calendar-followup-model";
import {searchTpoCalendarLeads} from "@/modules/placements/tpo-calendar-lead-search-model";

export type TpoCalendarLeadOption = {
  id: string;
  name: string;
  companyName: string | null;
  emailNorm: string | null;
};

async function submitFollowup(
  url: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
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
    throw new Error(code ? `Request failed: ${code}` : "The follow-up could not be saved.");
  }
}

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground";

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
  const [query,setQuery]=useState("");
  const [selectedLeadId,setSelectedLeadId]=useState("");
  const matches=searchTpoCalendarLeads(leads,query,30);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      await submitFollowup("/api/placements/tpo/calendar/follow-ups", "POST", {
        leadId: selectedLeadId,
        dueAt: calendarLocalIstToOffset(String(data.get("dueAt") ?? "")),
        note: String(data.get("note") ?? "").trim() || null,
      });
      form.reset();setQuery("");setSelectedLeadId("");
      setMessage("Follow-up created. The calendar is refreshing.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create follow-up.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Create recruiter follow-up" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="m-0 text-base font-semibold text-foreground">Create recruiter follow-up</h2>
      <p className="mt-1 text-sm text-body">
        Schedule for an existing recruiter lead. Enter the due date and time in IST.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
       Search all {totalLeads} recruiter leads by name, company or email. Enter at least two characters.
      </p>
      {leads.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No recruiter leads found. Create a lead in Engage first.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
           <label className="flex flex-col gap-1 text-sm font-semibold text-body">Search recruiter
            <input type="search" className={inputClass} placeholder="Name, company or email"
             value={query} onChange={e=>{setQuery(e.target.value);setSelectedLeadId("");}}
             minLength={2}/>
           </label>
           <label className="flex flex-col gap-1 text-sm font-semibold text-body">Recruiter lead
            <select name="leadId" value={selectedLeadId} onChange={e=>setSelectedLeadId(e.target.value)}
             required disabled={matches.length===0} className={inputClass}>
             <option value="">Choose a recruiter</option>
             {matches.map(lead=><option key={lead.id} value={lead.id}>
              {lead.name} · {lead.companyName||"Unspecified company"}
             </option>)}
            </select>
           </label>
           {query.trim().length>=2&&matches.length===0?<p role="status" className="text-xs text-muted-foreground">No matching recruiters.</p>:null}
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Due date and time (IST)
            <input name="dueAt" type="datetime-local" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Note (optional)
            <input name="note" maxLength={500} className={inputClass} />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="min-h-10 w-full rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
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
      );
      setMessage("Follow-up rescheduled. The calendar is refreshing.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reschedule follow-up.");
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
      <p role="status" aria-live="polite" className="w-full text-xs text-body">{message}</p>
    </form>
  );
}

/** TPO-calendar-reports-06: complete an open follow-up from its calendar card. */
export function TpoCalendarDoneFollowup({followupId}:{followupId:string}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function finish(){
  if(busy)return;
  setBusy(true);setMessage("");
  try{
   await submitFollowup(
    "/api/placements/tpo/calendar/follow-ups/"+encodeURIComponent(followupId)+"/done",
    "POST",{},
   );
   setMessage("Follow-up marked done.");
   router.refresh();
  }catch{setMessage("Could not mark follow-up done. Try again.");}
  finally{setBusy(false);}
 }
 return <div className="mt-2 flex flex-wrap items-center gap-3">
  <button type="button" disabled={busy} onClick={()=>void finish()}
   className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
   {busy?"Saving…":"Done"}
  </button>
  {message?<p role="status" className="text-xs text-body">{message}</p>:null}
 </div>;
}
