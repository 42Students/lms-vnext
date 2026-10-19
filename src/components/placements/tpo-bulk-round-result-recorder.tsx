"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {resolveBulkRoundLearnerTokens} from "@/modules/placements/tpo-bulk-round-result-model";

type Row = {
  applicationId: string;
  displayName: string;
  rollNumber?:string|null;
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
  const [failUnselected,setFailUnselected]=useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [reportedOutcomeByApplicant,setReportedOutcomeByApplicant]=useState<Record<string,string>>({});

  if (round.kind === "TALK" ||
    (round.status !== "SCHEDULED" && round.status !== "COMPLETED")) return null;

  const available = rows.filter((row) => row.resultStatus === null);
  const unselected=available.filter(row=>!selected.includes(row.applicationId));
  const pendingTotal=selected.length+(failUnselected?unselected.length:0);
  const visible=available.filter(row=>!search.trim()||row.displayName.toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"))||row.applicationId.includes(search.trim())||row.rollNumber?.toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN")));

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? current.includes(id) || current.length >= 25
          ? current
          : [...current, id]
        : current.filter((value) => value !== id),
    );
  }

  async function stageSelected(confirmed=false) {
    if (busy || selected.length === 0 || pendingTotal > 25 ||
      ((outcome !== "PASS" || failUnselected) && message.trim().length === 0) ||
      (outcome==="HOLD" && (!Number.isInteger(firstWaitlistRank)||firstWaitlistRank<1||firstWaitlistRank+selected.length-1>100000))) {
      setError(outcome==="HOLD"&&(!Number.isInteger(firstWaitlistRank)||firstWaitlistRank<1||firstWaitlistRank+selected.length-1>100000)
        ? "Choose a valid first waitlist rank. Ranks must be 1–100000."
        : selected.length===0?"Select at least one learner."
        : pendingTotal>25?"This bulk action exceeds 25 results. Stage a smaller group or use the reviewed CSV import."
        : "Enter a learner-facing message before staging this outcome.");
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
    if(failUnselected)for(const row of unselected)entries.push({expectedCurrentResultId:null,
      result:{applicationId:row.applicationId,outcome:"FAIL",candidateMessage:message.trim()}});
    if (entries.length !== pendingTotal) {
      setError("The selected rows changed; refresh before staging.");
      return;
    }
    if(!confirmed){setConfirmOpen(true);return;}

    setReportedOutcomeByApplicant(Object.fromEntries(entries.map(entry=>[entry.result.applicationId,entry.result.outcome])));
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
        throw new Error("Bulk staging was rejected.");
      }
      const body = (await response.json()) as { results: Result[] };
      setResults(body.results);
      setSelected([]);setFailUnselected(false);
      router.refresh();
    } catch {
      setError(
        "Could not verify all results. Some entries may have been staged; " +
        "refresh the page and check individual statuses before retrying.",
      );
    } finally {
      setBusy(false);setConfirmOpen(false);
    }
  }

  return (
    <section aria-label="Bulk stage round results" className="space-y-4 border-b border-border pb-6">
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
              <Input type="search" maxLength={100} value={search} onChange={event=>setSearch(event.target.value)}
               placeholder="Search name, roll or application ID"
               className="mt-1 block min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground"/>
            </label>
            <div className="flex flex-wrap gap-3 text-sm">
              <Button variant="secondary" type="button" disabled={busy} onClick={()=>setSelected(visible.slice(0,25).map(row=>row.applicationId))}
                className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-[var(--lms-teal-deep)]">Select first 25 unmarked</Button>
              <Button variant="secondary" type="button" disabled={busy||selected.length===0} onClick={()=>setSelected([])}
                className="font-semibold text-[var(--lms-link-text)]">Clear selection</Button>
            </div>
            <details className="rounded-[var(--lms-control-radius)] border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">Paste application IDs from a spreadsheet</summary>
              <p className="mt-2 text-xs text-body">Paste exact application IDs or roll numbers, one per line or comma-separated. Unknown, repeated or ambiguous roll numbers are rejected.</p>
              <Textarea rows={3} value={pastedIds} onChange={e=>setPastedIds(e.target.value)} maxLength={2500}
                className="mt-2 block w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm"/>
              <Button variant="secondary" type="button" disabled={busy} className="mt-2 min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm"
                onClick={()=>{
                  const resolved=resolveBulkRoundLearnerTokens(pastedIds,available);
                  if(resolved.error){setError(resolved.error);return;}
                  setError(null);setSelected(resolved.ids);
                }}>Select matching learners</Button>
            </details>
            <div tabIndex={0} role="group" aria-label="Unmarked learners, scroll for more" className="max-h-52 min-h-0 divide-y divide-border overflow-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border px-2 [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
              {visible.map((row) => (
                <label key={row.applicationId} className="flex min-h-11 items-center gap-3 px-2 text-sm text-body hover:bg-muted md:min-h-9">
                  <Checkbox
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
            <Select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as "PASS" | "FAIL" | "HOLD" | "ABSENT")}
              disabled={busy}
              className="mt-1 block min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-normal text-foreground"
            >
              <option value="PASS">Shortlisted for next round (PASS)</option>
              <option value="FAIL">Not selected (FAIL)</option>
              <option value="HOLD">Waitlisted (HOLD)</option>
              <option value="ABSENT">Marked absent (ABSENT)</option>
            </Select>
          </label>
          <fieldset className="space-y-2 rounded-[var(--lms-control-radius)] border border-warning p-3">
            <legend className="text-sm font-semibold text-foreground">Everyone I did not mark</legend>
            <label className="flex items-start gap-2 text-sm text-body">
              <Checkbox disabled={busy||available.length>25}
                checked={failUnselected}
                onChange={e=>setFailUnselected(e.target.checked)}
                className="mt-1 h-4 w-4 accent-primary"/>
              Stage Not cleared for every other unmarked applicant ({unselected.length})
            </label>
            <p className="text-xs text-body">Opt in explicitly. All affected learners receive an audited staged result, but nothing is published until Apply results. This bulk action is limited to 25 total applicants; for larger rosters use the reviewed import.</p>
          </fieldset>
          {(outcome !== "PASS" || failUnselected) ? (
            <label className="block text-sm font-semibold text-foreground">
              Learner-facing message (required)
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={2}
                maxLength={1000}
                disabled={busy}
                className="mt-1 block w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 font-normal text-foreground"
              />
            </label>
          ) : null}
          {outcome==="HOLD"?<label className="block text-sm font-semibold text-foreground">
            First waitlist rank (in checkbox selection order)
            <Input type="number" min={1} max={100000} value={firstWaitlistRank}
              onChange={e=>setFirstWaitlistRank(Number(e.target.value))}
              className="mt-1 block min-h-11 md:min-h-9 w-40 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"/>
            <span className="mt-1 block text-xs font-normal text-body">Chosen learners are assigned consecutive ranks. Check existing waitlisted results to avoid duplicate ranks.</span>
          </label>:null}
          {selected.length>0?<div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-muted p-3 text-sm text-body">
            <p className="font-semibold">Result staging preview</p>
            <p>{pendingTotal} total staged outcomes · {selected.length} explicitly selected · {failUnselected?unselected.length:0} additional Not cleared.</p>
            <p>{selected.length} unmarked applicant(s) selected · {outcome==="PASS"?"Cleared":outcome==="FAIL"?"Not cleared":outcome==="HOLD"?"Waitlisted":"Marked absent"}.</p>
            {outcome==="HOLD"?<p>Ranks {firstWaitlistRank}–{firstWaitlistRank+selected.length-1} in selection order. Existing rank collisions are rejected.</p>:null}
            <p>Saved as staged only. Learners are not told until the separate Apply results step.</p>
          </div>:null}
          <Button variant="primary"
            type="button"
            onClick={() => void stageSelected()}
            disabled={busy || selected.length === 0 ||
              ((outcome !== "PASS" || failUnselected) && !message.trim()) ||
              pendingTotal > 25 ||
              (outcome==="HOLD" && (!Number.isInteger(firstWaitlistRank)||firstWaitlistRank<1))}
            className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Staging..." : "Review and confirm staged results"}
          </Button>
        </>
      )}
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={busy}
        title={"Stage "+pendingTotal+" result(s) as "+({PASS:"Shortlisted",FAIL:"Not selected",HOLD:"Waitlisted",ABSENT:"Marked absent"}[outcome])+"?"}
        description={(failUnselected?unselected.length+" additional unmarked applicants will be staged Not cleared. ":"")+"Each successful result will be audited individually. This does NOT publish results; a completed round requires separate APPLY confirmation. Some rows may succeed even if others fail. Continue?"}
        confirmLabel="Review and confirm staged results" onConfirm={()=>void stageSelected(true)}/>
      {error ? <p role="alert" className="text-sm text-foreground">{error}</p> : null}
      {results.length > 0 ? (
        <div role="status" className="space-y-2 text-sm text-body">
          <Button variant="secondary" type="button" onClick={()=>{
            const cell=(input:string)=>{
              const safe=/^[=+@\-\t\r]/.test(input)?"'"+input:input;
              return '"'+safe.replaceAll('"','""')+'"';
            };
            const lines=[["Application ID","Learner","Outcome","Status","Reason"].join(","),
             ...results.map(row=>[row.applicationId,
              rows.find(item=>item.applicationId===row.applicationId)?.displayName??"Learner",
              reportedOutcomeByApplicant[row.applicationId]??outcome,row.status,row.reason??""].map(cell).join(","))];
            const url=URL.createObjectURL(new Blob(["\uFEFF"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}));
            const link=document.createElement("a");link.href=url;
            link.download="round-"+roundId+"-bulk-results.csv";link.click();URL.revokeObjectURL(url);
          }} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-[var(--lms-teal-deep)]">
            Export per-learner staging report (CSV)
          </Button>
          <p className="font-semibold">Per-learner outcomes</p>
          <ul className="divide-y divide-border border-t border-border">
            {results.map((item) => (
              <li key={item.applicationId} className="flex flex-wrap gap-2 px-3 py-2">
                <span className="font-semibold text-foreground">
                  {rows.find((row) => row.applicationId === item.applicationId)?.displayName ??
                    "Learner"}
                </span>
                <span>{reportedOutcomeByApplicant[item.applicationId]??outcome} · {item.status}</span>
                {item.reason ? <span>{item.reason.replaceAll("_", " ")}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
