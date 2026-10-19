"use client";

import { useState } from "react";
import {tpoBulkFailedLines,tpoBulkFailedSummary} from "@/modules/placements/tpo-bulk-failed-result-model";
import {Button} from "@/components/ui/button";

type LeadChoice = {
  id: string;
  name: string;
  companyName: string | null;
  ownerMembershipId: string | null;
  recruiterUserId: string | null;
  unsubscribedAt: string | null;
};
type Owner = { membershipId: string; displayName: string | null };
type Result = {
  leadId: string;
  status: "updated" | "unchanged" | "ineligible";
  reason: string | null;
};

const fieldClass =
  "min-h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";

export function RecruiterBulkOwnerControls({
  rows,
  onUpdated,
}: {
  rows: readonly LeadChoice[];
  onUpdated: () => void;
}) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownersState, setOwnersState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [chosen, setChosen] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [copyNotice,setCopyNotice]=useState("");
  const [runAuditId,setRunAuditId]=useState("");
  const [undoRunId,setUndoRunId]=useState("");
  const [undoReview,setUndoReview]=useState(false);
  const [undoBusy,setUndoBusy]=useState(false);
  const [reviewOpen,setReviewOpen]=useState(false);
  const [reviewSignature,setReviewSignature]=useState("");

  const assignable = rows;
  const retryable=results.filter(item=>item.status==="ineligible"&&assignable.some(row=>row.id===item.leadId));
  const selections = assignable
    .filter((lead) => chosen.includes(lead.id))
    .map((lead) => ({
      id: lead.id,
      expectedOwnerMembershipId: lead.ownerMembershipId,
    }));
  const currentSignature=[ownerId,...selections.map(row=>row.id+":"+(row.expectedOwnerMembershipId??"UNASSIGNED")).sort()].join("|");
  const canSubmit = !busy && ownersState === "ready" &&
    Boolean(ownerId) && selections.length > 0 && selections.length <= 100;

  async function loadOwners() {
    setOwnersState("loading");
    setError("");
    try {
      const response = await fetch("/api/placements/tpo/leads/bulk-owner", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await response.json() as { owners?: Owner[]; error?: string };
      if (!response.ok || !Array.isArray(data.owners)) {
        throw new Error(data.error || "Owner directory is unavailable.");
      }
      setOwners(data.owners);
      setOwnersState("ready");
    } catch {
      setOwnersState("error");
      setError("Could not load eligible placement staff. Retry the owner lookup.");
    }
  }

  function choose(id: string, checked: boolean) {
    setResults([]);
    setReviewOpen(false);
    setChosen((current) => checked
      ? current.includes(id) || current.length >= 100 ? current : [...current, id]
      : current.filter((value) => value !== id));
  }

  async function copyFailed(){
    try{
      await navigator.clipboard.writeText(tpoBulkFailedSummary(results));
      setCopyNotice("Failed recruiters copied. Refresh leads before retrying.");
    }catch{setCopyNotice("Couldn't copy failed results.");}
  }
  async function submit() {
    if (!canSubmit) return;
    const owner = owners.find((item) => item.membershipId === ownerId);
    if (!owner) {
      setError("The selected owner is no longer in the list; reload staff.");
      return;
    }
    if(!reviewOpen||reviewSignature!==currentSignature){setReviewSignature(currentSignature);setReviewOpen(true);return;}

    setBusy(true);
    setError("");
    setResults([]);setRunAuditId("");
    try {
      const response = await fetch("/api/placements/tpo/leads/bulk-owner", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          ownerMembershipId: ownerId,
          selections,
        }),
      });
      const data = await response.json() as { results?: Result[];
        runAuditId?: string; error?: string };
      if (!response.ok || !Array.isArray(data.results)) {
        throw new Error(data.error || "Bulk owner reassignment failed.");
      }
      setResults(data.results);
      setRunAuditId(data.runAuditId??"");
      setUndoRunId(data.results.some(row=>row.status==="updated")?(data.runAuditId??""):"");
      setUndoReview(false);
      setChosen([]);
      setReviewOpen(false);setReviewSignature("");
      onUpdated();
    } catch {
      setError(
        "Owner reassignment could not be verified. Refresh the leads and review " +
        "their persisted owners before retrying.",
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
     setCopyNotice(data.restored+" owner assignment(s) restored. Refreshing the roster.");
     onUpdated();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not undo this assignment batch.");}
    finally{setUndoBusy(false);}
  }

  return (
    <section
      className="space-y-3 rounded-lg border border-border bg-surface p-4"
      aria-label="Bulk recruiter lead owner assignment"
    >
      <div>
        <h2 className="font-semibold text-foreground">Bulk assign lead owner</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select up to 100 filtered leads and one active college placement staff member.
          Joined and unsubscribed contacts can be assigned a placement-cell owner. Each reassignment is audited.
        </p>
      </div>
      {ownersState === "idle" ? (
        <button type="button" onClick={() => void loadOwners()} className={fieldClass}>
          Load eligible owners
        </button>
      ) : ownersState === "loading" ? (
        <p role="status" className="text-sm text-body">Loading placement staff…</p>
      ) : ownersState === "error" ? (
        <button type="button" className={fieldClass} onClick={() => void loadOwners()}>
          Retry eligible owners
        </button>
      ) : (
        <>
          {owners.length === 0 ? (
            <p role="status" className="text-sm text-body">
              No eligible owner memberships were found. No assignment can be made.
            </p>
          ) : (
            <label className="block text-sm font-semibold text-foreground">
              New owner
              <select
                className={fieldClass + " mt-1 block w-full max-w-md"}
                value={ownerId}
                onChange={(event) => {setOwnerId(event.target.value);setReviewOpen(false);}}
                disabled={busy}
              >
                <option value="">Choose an active placement staff member</option>
                {[...owners].sort((a,b)=>(a.displayName??"").localeCompare(b.displayName??"")||a.membershipId.localeCompare(b.membershipId)).map((item) => (
                  <option key={item.membershipId} value={item.membershipId}>
                    {item.displayName ?? "Unnamed staff member"}
                  </option>
                ))}
              </select>
            </label>
          )}
          {assignable.length === 0 ? (
            <p role="status" className="text-sm text-body">
              No assignable leads match the current filters.
            </p>
          ) : (
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {assignable.map((item) => (
                <label key={item.id} className="flex min-h-9 items-center gap-2 px-1 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={chosen.includes(item.id)}
                    onChange={(event) => choose(item.id, event.target.checked)}
                    disabled={busy || (chosen.length >= 100 && !chosen.includes(item.id))}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">
                    {item.companyName ?? "Unlinked company"}
                  </span>
                </label>
              ))}
            </div>
          )}
          {reviewOpen&&reviewSignature===currentSignature?<p role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm">
            Assign {selections.length} recruiter lead(s) to {owners.find(item=>item.membershipId===ownerId)?.displayName??"selected staff member"}.
            Each changed lead receives an audit record.
            <button type="button" className="ml-2 text-primary-text underline" onClick={()=>setReviewOpen(false)}>Edit</button>
          </p>:null}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-body">{selections.length} / 100 selected</span>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              
            >
              {busy ? "Assigning…" : reviewOpen&&reviewSignature===currentSignature ? "Confirm assignment" : "Review and confirm assignment"}
            </Button>
          </div>
        </>
      )}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {results.length > 0 ? (
        <section aria-live="polite">
          <h3 className="text-sm font-semibold text-foreground">Per-lead results</h3>
          {runAuditId?<p className="mt-1 text-xs text-muted-foreground">Audited batch: <code>{runAuditId}</code></p>:null}
          {undoRunId?<div className="mt-3 rounded-lg border border-border p-3 text-sm">
           <p>Undo these owner assignments within five minutes. If a changed lead has since been edited, nothing is restored.</p>
           {undoReview?<p role="status" className="mt-2">Restore the previous owner for every changed recruiter in this batch?</p>:null}
           <div className="mt-2 flex gap-2">
            <button type="button" disabled={undoBusy} className={fieldClass} onClick={()=>void restore()}>
             {undoBusy?"Restoring…":undoReview?"Confirm undo":"Undo owner batch"}</button>
            {undoReview?<button type="button" className={fieldClass} onClick={()=>setUndoReview(false)}>Cancel</button>:null}
           </div>
          </div>:null}
          <p className="text-xs text-body">Updated: {results.filter(row=>row.status==="updated").length};
            unchanged: {results.filter(row=>row.status==="unchanged").length};
            ineligible: {results.filter(row=>row.status==="ineligible").length}.</p>
          {tpoBulkFailedLines(results).length>0?<button type="button"
            className={fieldClass+" mt-2"} onClick={()=>void copyFailed()}>Copy failed</button>:null}
          {copyNotice?<p role="status" className="text-xs text-body">{copyNotice}</p>:null}
          {retryable.length>0?<button type="button" disabled={busy} className={fieldClass+" mt-2"}
            onClick={()=>{setChosen(retryable.slice(0,100).map(item=>item.leadId));setReviewOpen(false);setError("");
              setCopyNotice("Failed rows selected for review. Refresh owners and leads before retrying.");}}>
            Select failed for review ({retryable.length})
          </button>:null}
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
