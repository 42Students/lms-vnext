"use client";

import { useState } from "react";
import {tpoBulkFailedLines,tpoBulkFailedSummary} from "@/modules/placements/tpo-bulk-failed-result-model";

type LeadChoice = {
  id: string;
  name: string;
  companyName: string | null;
  manualStage: string;
  recruiterUserId: string | null;
  unsubscribedAt: string | null;
};

type BulkResult = {
  leadId: string;
  status: "updated" | "unchanged" | "ineligible";
  reason: string | null;
};

const fieldClass =
  "min-h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";

export function RecruiterBulkStageControls({
  rows,
  onUpdated,
}: {
  rows: readonly LeadChoice[];
  onUpdated: () => void;
}) {
  const [chosenIds, setChosenIds] = useState<string[]>([]);
  const [action, setAction] = useState<"CONTACTED" | "NOT_NOW" | "NEW">("CONTACTED");
  const [reason, setReason] = useState("");
  const [revisitDate, setRevisitDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [copyNotice,setCopyNotice]=useState("");
  const [runAuditId,setRunAuditId]=useState("");
  const [undoRunId,setUndoRunId]=useState("");
  const [undoReview,setUndoReview]=useState(false);
  const [undoBusy,setUndoBusy]=useState(false);
  const [reviewOpen,setReviewOpen]=useState(false);
  const [reviewSignature,setReviewSignature]=useState("");

  const available = rows.filter((row) =>
    ["NEW", "CONTACTED", "NOT_NOW"].includes(row.manualStage),
  );
  const selected = available.filter((row) => chosenIds.includes(row.id));
  const currentSignature=[action,reason.trim(),revisitDate,...selected.map(row=>row.id+":"+row.manualStage).sort()].join("|");
  const retryable=results.filter(item=>item.status==="ineligible"&&available.some(row=>row.id===item.leadId));
  const todayIst=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const isValid = selected.length > 0 && selected.length <= 100 &&
    (action !== "NOT_NOW" || (reason.trim().length > 0 && reason.trim().length <= 255 && (!revisitDate||revisitDate>=todayIst)));

  function choose(id: string, value: boolean) {
    setError("");
    setResults([]);
    setReviewOpen(false);
    setChosenIds((before) =>
      value
        ? before.includes(id) || before.length >= 100
          ? before
          : [...before, id]
        : before.filter((item) => item !== id),
    );
  }

  async function copyFailed(){
    try{
      await navigator.clipboard.writeText(tpoBulkFailedSummary(results));
      setCopyNotice("Failed recruiters copied. Refresh leads before retrying.");
    }catch{setCopyNotice("Couldn't copy failed results.");}
  }
  async function apply() {
    if (!isValid || busy) {
      setError("Select up to 100 leads and provide a reason for Not Now.");
      return;
    }
    const selections = selected.map((row) => ({
      id: row.id,
      expectedStage: row.manualStage as "NEW" | "CONTACTED" | "NOT_NOW",
    }));
    if(!reviewOpen||reviewSignature!==currentSignature){setReviewSignature(currentSignature);setReviewOpen(true);return;}

    setBusy(true);
    setError("");
    setResults([]);setRunAuditId("");
    try {
      const response = await fetch("/api/placements/tpo/leads/bulk-stage", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action !== "NOT_NOW"
          ? { action, confirmed: true, selections }
          : {
              action,
              confirmed: true,
              selections,
              reason: reason.trim(),
              revisitDate: revisitDate || null,
            }),
      });
      const data = await response.json() as {
        results?: BulkResult[];
        runAuditId?: string;
        error?: string;
      };
      if (!response.ok || !Array.isArray(data.results)) {
        throw new Error(data.error || "Bulk stage change could not be confirmed.");
      }
      setResults(data.results);
      setRunAuditId(data.runAuditId??"");
      setUndoRunId(data.results.some(row=>row.status==="updated")?(data.runAuditId??""):"");
      setUndoReview(false);
      setChosenIds([]);
      setReviewOpen(false);setReviewSignature("");
      setReason("");
      setRevisitDate("");
      onUpdated();
    } catch {
      setError(
        "The update could not be verified. Refresh the leads before retrying; " +
        "the transaction may already have completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function restore(){
    if(!undoRunId||undoBusy)return;
    if(!undoReview){setUndoReview(true);return;}
    setUndoBusy(true);setError("");
    try{
     const response=await fetch("/api/placements/tpo/leads/bulk-undo",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({confirmed:true,runAuditId:undoRunId}),
     });
     const data=await response.json() as {error?:string;restored?:number};
     if(!response.ok)throw new Error(data.error==="STALE"?"A recruiter changed since the batch; nothing was undone.":
      data.error==="EXPIRED"?"The five-minute undo window has ended.":
      data.error==="ALREADY_RESTORED"?"This batch was already undone.":
      "Undo unavailable. Refresh your recruiter leads before another change.");
     setUndoRunId("");setUndoReview(false);setResults([]);
     setCopyNotice(data.restored+" lead change(s) restored. Refreshing the roster.");
     onUpdated();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not undo the batch.");}
    finally{setUndoBusy(false);}
  }

  return (
    <section
      className="space-y-3 rounded-lg border border-border bg-surface p-4"
      aria-label="Bulk recruiter lead stage actions"
    >
      <div>
        <h2 className="font-semibold text-foreground">Bulk lead stage updates</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select up to 100 filtered contacts. Manual stage is distinct from
          recruiter conversion; joined and unsubscribed leads remain eligible for staff updates.
          Each changed lead receives an immutable activity record.
        </p>
      </div>
      {available.length === 0 ? (
        <p role="status" className="text-sm text-body">
          No editable recruiter leads in the current filter.
        </p>
      ) : (
        <>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {available.map((row) => (
              <label key={row.id} className="flex min-h-9 items-center gap-2 px-1 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={chosenIds.includes(row.id)}
                  onChange={(event) => choose(row.id, event.target.checked)}
                  disabled={busy || (chosenIds.length >= 100 && !chosenIds.includes(row.id))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="font-medium text-foreground">{row.name}</span>
                <span className="text-muted-foreground">
                  {row.companyName ?? "Unlinked company"} · {row.manualStage.replaceAll("_", " ")}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-foreground">
              New manual stage
              <select
                value={action}
                onChange={(event) => {
                  setAction(event.target.value as "CONTACTED" | "NOT_NOW" | "NEW");
                  setError("");setReviewOpen(false);
                }}
                disabled={busy}
                className={fieldClass + " mt-1 block"}
              >
                <option value="CONTACTED">Mark Contacted</option>
                <option value="NEW">Restore to New</option>
                <option value="NOT_NOW">Not Now</option>
              </select>
            </label>
            {action === "NOT_NOW" ? (
              <>
                <label className="min-w-44 flex-1 text-sm font-medium text-foreground">
                  Reason (required)
                  <input
                    value={reason}
                    onChange={(event) => {setReason(event.target.value);setReviewOpen(false);}}
                    maxLength={255}
                    disabled={busy}
                    className={fieldClass + " mt-1 w-full"}
                  />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Revisit date (optional)
                  <input
                    type="date"
                    min={todayIst}
                    value={revisitDate}
                    onChange={(event) => {setRevisitDate(event.target.value);setReviewOpen(false);}}
                    disabled={busy}
                    className={fieldClass + " mt-1 block"}
                  />
                </label>
              </>
            ) : null}
            <button
              type="button"
              disabled={!isValid || busy}
              onClick={() => void apply()}
              className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
            >
              {busy ? "Applying…" : reviewOpen&&reviewSignature===currentSignature ? "Confirm stage changes" : "Review and confirm"}
            </button>
          </div>
          {reviewOpen&&reviewSignature===currentSignature?<div role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm">
            Confirm {selected.length} recruiter lead stage changes to {action==="CONTACTED"?"Contacted":action==="NEW"?"New":"Not now"}.
            {action==="NOT_NOW"?<p>Reason: {reason.trim()}{revisitDate?" · Revisit "+revisitDate:""}</p>:null}
            <button type="button" className="mt-2 text-primary-text underline" onClick={()=>setReviewOpen(false)}>Edit selection</button>
          </div>:null}
          <p aria-live="polite" className="text-xs text-body">
            {selected.length} / 100 leads selected.
          </p>
        </>
      )}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {results.length ? (
        <section aria-live="polite">
          <h3 className="font-semibold text-foreground">Per-lead results</h3>
          {runAuditId?<p className="mt-1 text-xs text-muted-foreground">Audited batch: <code>{runAuditId}</code></p>:null}
          {undoRunId?<div className="mt-3 rounded-lg border border-border p-3 text-sm">
           <p>Undo this audited batch within five minutes. Undo is rejected if any changed lead has since been edited.</p>
           {undoReview?<p role="status" className="mt-2">Restore the previous manual stage, reason and revisit date for each changed recruiter?</p>:null}
           <div className="mt-2 flex gap-2">
            <button type="button" disabled={undoBusy} className={fieldClass} onClick={()=>void restore()}>
             {undoBusy?"Restoring…":undoReview?"Confirm undo":"Undo stage batch"}</button>
            {undoReview?<button type="button" className={fieldClass} onClick={()=>setUndoReview(false)}>Cancel</button>:null}
           </div>
          </div>:null}
          {tpoBulkFailedLines(results).length>0?(
            <button type="button" className={fieldClass+" mt-2"}
              onClick={()=>void copyFailed()}>Copy failed</button>
          ):null}
          {copyNotice?<p role="status" className="text-xs text-body">{copyNotice}</p>:null}
          {retryable.length>0?<button type="button" disabled={busy} className={fieldClass+" mt-2"}
            onClick={()=>{setChosenIds(retryable.slice(0,100).map(item=>item.leadId));setReviewOpen(false);setError("");
              setCopyNotice("Failed rows selected for review. Check their current stage after refreshing before retrying.");}}>
            Select failed for review ({retryable.length})
          </button>:null}
          <p className="text-sm text-body">
            Updated: {results.filter((item) => item.status === "updated").length};
            unchanged: {results.filter((item) => item.status === "unchanged").length};
            ineligible: {results.filter((item) => item.status === "ineligible").length}.
          </p>
          <ul className="mt-2 max-h-36 overflow-auto text-xs text-body">
            {results.map((item) => (
              <li key={item.leadId}>
                {rows.find(row=>row.id===item.leadId)?.name??"Recruiter"}: {item.status}
                {item.reason ? " — " + item.reason : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
