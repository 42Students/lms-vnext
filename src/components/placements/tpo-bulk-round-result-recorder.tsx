"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  applicationId: string;
  displayName: string;
  resultStatus: string | null;
};
type Result = {
  applicationId: string;
  status: "staged" | "ineligible";
  resultId?: string;
  reason?: string;
};

/**
 * Deliberately exposes only unset round results. Editing an existing staged
 * result remains in the per-learner control, which fetches its current ID.
 */
export function TpoBulkRoundResultRecorder({
  roundId,
  round,
  rows,
}: {
  roundId: string;
  round: { kind: string; status: string };
  rows: readonly Row[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [search,setSearch]=useState("");
  const [pastedIds,setPastedIds]=useState("");
  const [outcome, setOutcome] = useState<"PASS" | "FAIL" | "HOLD" | "ABSENT">("PASS");
  const [message, setMessage] = useState("");
  const [firstWaitlistRank,setFirstWaitlistRank]=useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  if (round.kind === "TALK" ||
    (round.status !== "SCHEDULED" && round.status !== "COMPLETED")) return null;

  const available = rows.filter((row) => row.resultStatus === null);
  const visible=available.filter(row=>!search.trim()||row.displayName.toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"))||row.applicationId.includes(search.trim()));

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? current.includes(id) || current.length >= 25
          ? current
          : [...current, id]
        : current.filter((value) => value !== id),
    );
  }

  async function stageSelected() {
    if (busy || selected.length === 0 || selected.length > 25 ||
      (outcome !== "PASS" && message.trim().length === 0) ||
      (outcome==="HOLD" && (!Number.isInteger(firstWaitlistRank)||firstWaitlistRank<1||firstWaitlistRank+selected.length-1>100000))) {
      setError("Select learners and provide a learner-facing message for Not Selected.");
      return;
    }
    const entries = selected.flatMap((id,index) => {
      const row = available.find((item) => item.applicationId === id);
      if (!row) return [];
      return [{
        expectedCurrentResultId: null,
        result: {
          applicationId: row.applicationId,
          outcome,
          ...(outcome !== "PASS" ? { candidateMessage: message.trim() } : {}),
          ...(outcome === "HOLD" ? {waitlistRank:firstWaitlistRank+index}:{}),
        },
      }];
    });
    if (entries.length !== selected.length) {
      setError("The selected rows changed; refresh before staging.");
      return;
    }
    if (!window.confirm(
      "Stage " + entries.length + " result(s) as " +
      ({PASS:"Shortlisted",FAIL:"Not selected",HOLD:"Waitlisted",ABSENT:"Marked absent"}[outcome]) +
      "? Each successful result will be audited individually. " +
      "This does NOT publish results; a completed round requires separate APPLY confirmation. " +
      "Some rows may succeed even if others fail. Continue?",
    )) return;

    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const response = await fetch(
        "/api/placements/tpo/rounds/" + encodeURIComponent(roundId) + "/bulk-confirmed-results",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmed: true, entries }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Bulk staging was rejected.");
      }
      const body = (await response.json()) as { results: Result[] };
      setResults(body.results);
      setSelected([]);
      router.refresh();
    } catch {
      setError(
        "Could not verify all results. Some entries may have been staged; " +
        "refresh the page and check individual statuses before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Bulk stage round results" className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Bulk stage round results</h2>
        <p className="mt-1 text-sm text-body">
          Stage a common outcome for up to 25 applicants without an existing result.
          Each row is separately verified, transactionally stored and audited.
          Applying final results is a separate, deliberate action.
        </p>
      </div>
      {available.length === 0 ? (
        <p role="status" className="text-sm text-body">
          No roster applicants are awaiting an initial result. Edit a staged result
          with its individual control, or apply it when the round is completed.
        </p>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">
              Select learners ({selected.length} / 25)
            </legend>
            <label className="block text-sm font-semibold text-body">Find unmarked learner
              <input type="search" maxLength={100} value={search} onChange={event=>setSearch(event.target.value)}
               placeholder="Search name or application ID"
               className="mt-1 block min-h-10 w-full rounded border border-border bg-surface px-3 text-foreground"/>
            </label>
            <div className="flex flex-wrap gap-3 text-sm">
              <button type="button" disabled={busy} onClick={()=>setSelected(visible.slice(0,25).map(row=>row.applicationId))}
                className="font-semibold text-primary-text">Select first 25 unmarked</button>
              <button type="button" disabled={busy||selected.length===0} onClick={()=>setSelected([])}
                className="font-semibold text-primary-text">Clear selection</button>
            </div>
            <details className="rounded border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Paste application IDs from a spreadsheet</summary>
              <p className="mt-2 text-xs text-body">Use exact application IDs, one per line or comma-separated. Unknown IDs are rejected. Roll-number matching belongs in the CSV/XLSX import workflow.</p>
              <textarea rows={3} value={pastedIds} onChange={e=>setPastedIds(e.target.value)} maxLength={2500}
                className="mt-2 block w-full rounded border border-border bg-surface p-2 text-sm"/>
              <button type="button" disabled={busy} className="mt-2 min-h-9 rounded border border-border px-3 text-sm"
                onClick={()=>{
                  const ids=[...new Set(pastedIds.split(/[\s,;]+/).filter(Boolean))];
                  if(ids.length===0||ids.length>25||ids.some(id=>!available.some(row=>row.applicationId===id))){
                    setError("Paste 1–25 distinct application IDs belonging to unmarked learners in this round.");
                    return;
                  }
                  setError(null);setSelected(ids);
                }}>Select matching learners</button>
            </details>
            <div className="max-h-52 overflow-auto rounded-md border border-border p-2">
              {visible.map((row) => (
                <label key={row.applicationId} className="flex min-h-10 items-center gap-3 px-2 text-sm text-body">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.applicationId)}
                    onChange={(event) => toggle(row.applicationId, event.target.checked)}
                    disabled={busy || (!selected.includes(row.applicationId) && selected.length >= 25)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>{row.displayName}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold text-foreground">
            Staged outcome
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as "PASS" | "FAIL" | "HOLD" | "ABSENT")}
              disabled={busy}
              className="mt-1 block min-h-10 w-full rounded-md border border-border bg-surface px-3 font-normal text-foreground"
            >
              <option value="PASS">Shortlisted for next round (PASS)</option>
              <option value="FAIL">Not selected (FAIL)</option>
              <option value="HOLD">Waitlisted (HOLD)</option>
              <option value="ABSENT">Marked absent (ABSENT)</option>
            </select>
          </label>
          {outcome !== "PASS" ? (
            <label className="block text-sm font-semibold text-foreground">
              Learner-facing message (required)
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={2}
                maxLength={1000}
                disabled={busy}
                className="mt-1 block w-full rounded-md border border-border bg-surface p-3 font-normal text-foreground"
              />
            </label>
          ) : null}
          {outcome==="HOLD"?<label className="block text-sm font-semibold text-foreground">
            First waitlist rank (in checkbox selection order)
            <input type="number" min={1} max={100000} value={firstWaitlistRank}
              onChange={e=>setFirstWaitlistRank(Number(e.target.value))}
              className="mt-1 block min-h-10 w-40 rounded border border-border bg-surface px-3"/>
            <span className="mt-1 block text-xs font-normal text-body">Chosen learners are assigned consecutive ranks. Check existing waitlisted results to avoid duplicate ranks.</span>
          </label>:null}
          <button
            type="button"
            onClick={() => void stageSelected()}
            disabled={busy || selected.length === 0 ||
              (outcome !== "PASS" && !message.trim()) ||
              (outcome==="HOLD" && (!Number.isInteger(firstWaitlistRank)||firstWaitlistRank<1))}
            className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
          >
            {busy ? "Staging..." : "Review and confirm staged results"}
          </button>
        </>
      )}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {results.length > 0 ? (
        <div role="status" className="space-y-2 text-sm text-body">
          <button type="button" onClick={()=>{
            const cell=(input:string)=>{
              const safe=/^[=+@\-\t\r]/.test(input)?"'"+input:input;
              return '"'+safe.replaceAll('"','""')+'"';
            };
            const lines=[["Application ID","Learner","Outcome","Status","Reason"].join(","),
             ...results.map(row=>[row.applicationId,
              rows.find(item=>item.applicationId===row.applicationId)?.displayName??"Learner",
              outcome,row.status,row.reason??""].map(cell).join(","))];
            const url=URL.createObjectURL(new Blob(["\uFEFF"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}));
            const link=document.createElement("a");link.href=url;
            link.download="round-"+roundId+"-bulk-results.csv";link.click();URL.revokeObjectURL(url);
          }} className="min-h-9 rounded border border-border px-3 font-semibold text-primary-text">
            Export per-learner staging report (CSV)
          </button>
          <p className="font-semibold">Per-learner outcomes</p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {results.map((item) => (
              <li key={item.applicationId} className="flex flex-wrap gap-2 px-3 py-2">
                <span className="font-semibold text-foreground">
                  {rows.find((row) => row.applicationId === item.applicationId)?.displayName ??
                    "Learner"}
                </span>
                <span>{item.status}</span>
                {item.reason ? <span>{item.reason.replaceAll("_", " ")}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
