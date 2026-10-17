"use client";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  afterCollegeOptions,AFTER_COLLEGE_LABELS,MANUAL_AFTER_COLLEGE_OUTCOMES, type AfterCollegeOutcome,
} from "@/modules/placements/tpo-after-college-model";

type Entry = { outcome: AfterCollegeOutcome; expectedVersion: string };
type Row = { membershipId: string; displayName: string };
type Result = {
  updated: number;
  results: {
    membershipId: string; previousOutcome: AfterCollegeOutcome; outcome: AfterCollegeOutcome;
    version: string; changed: boolean;
  }[];
};

export function TpoAfterCollegeBulkEditor({
  rows, current, available,
}: {
  rows: readonly Row[];
  current: Record<string, Entry>;
  available: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<AfterCollegeOutcome>("NOT_DECIDED");
  const [undo, setUndo] = useState<Result["results"] | null>(null);
  const [busy, setBusy] = useState(false);
  const {run:runGuarded,pending:guardedPending}=useGuardedAction();
  const [confirmation,setConfirmation]=useState<"SAVE"|"UNDO"|null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (!rows.length) return null;
  const presentIds = new Set(rows.map(row => row.membershipId));
  const ids = selected.filter(id => presentIds.has(id));
  const selectAll = ids.length === rows.length;

  async function post(changes: { membershipId: string;
    outcome: AfterCollegeOutcome; expectedVersion: string }[]) {
    return apiFetch<Result>("/api/placements/tpo/students/after-college/bulk",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({changes}),
    });
  }

  async function save() {
    if (!available || !ids.length) return;
    setBusy(true); setError(""); setMessage(""); setUndo(null);
    try {
      const receipt = await post(ids.map(id => ({
        membershipId: id, outcome,
        expectedVersion: current[id]?.expectedVersion ?? "none",
      })));
      setMessage("Updated " + receipt.updated + " After college outcome(s).");
      setUndo(receipt.results.filter(result => result.changed)); setSelected([]);setConfirmation(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof FriendlyFetchError && cause.status===409
        ?"This changed while you were working. Your selected outcomes are kept. Refresh before retrying."
        :cause instanceof Error?cause.message:"Could not update outcomes. Please try again.");
    } finally { setBusy(false); }
  }

  async function reverse() {
    if (!undo?.length) return;
    setBusy(true); setError("");
    try {
      const receipt = await post(undo.map(row => ({
        membershipId: row.membershipId,
        outcome: row.previousOutcome,
        expectedVersion: row.version,
      })));
      setUndo(null);setConfirmation(null);setMessage("Restored " + receipt.updated + " previous outcome(s).");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof FriendlyFetchError && cause.status===409
        ?"Someone changed one of these outcomes. Your undo choices are kept; refresh before retrying."
        :cause instanceof Error?cause.message:"Could not undo the update. Please try again.");
    } finally { setBusy(false); }
  }

  return <section aria-label="After college bulk actions"
    className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold">After college · Bulk update</h2>
    <p className="text-sm text-muted-foreground">
      Select students on this page, choose their outcome, preview the count and confirm.
      Changes are recorded for reporting and can be undone while no other editor has updated them.
    </p>
    {!available && <p role="status" className="text-sm text-warning">
      After college records are unavailable until the database table is registered.</p>}
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" disabled={!available || busy} checked={selectAll}
        onChange={event => setSelected(event.target.checked ? rows.map(row => row.membershipId) : [])} />
      Select all {rows.length} students on this page
    </label>
    <div className="max-h-40 space-y-1 overflow-auto rounded border border-border p-2">
      {rows.map(row => <label key={row.membershipId}
        className="flex items-center gap-2 p-1 text-sm">
        <input type="checkbox" disabled={!available || busy} checked={ids.includes(row.membershipId)}
          onChange={event => setSelected(current => event.target.checked
            ? [...new Set([...current, row.membershipId])]
            : current.filter(id => id !== row.membershipId))} />
        <span>{row.displayName}</span>
      </label>)}
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-semibold">After college
        <select value={outcome} onChange={event => setOutcome(event.target.value as AfterCollegeOutcome)}
          disabled={!available || busy} className="min-h-10 rounded border border-border bg-surface px-2">
          {!MANUAL_AFTER_COLLEGE_OUTCOMES.includes(outcome)?<option value={outcome} disabled>{AFTER_COLLEGE_LABELS[outcome]} · Automatic</option>:null}
          {afterCollegeOptions().map(option => <option key={option.value} value={option.value}>
            {option.label}</option>)}
        </select>
      </label>
      <button type="button" disabled={!available || busy || !ids.length}
        onClick={() => setConfirmation("SAVE")}
        className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
        Update {ids.length} student(s)
      </button>
      {undo?.length ? <button type="button" disabled={busy} onClick={() => setConfirmation("UNDO")}
        className="min-h-10 rounded border border-border px-4 font-semibold text-primary-text">Undo last bulk update</button> : null}
    </div>
    <Dialog open={confirmation!==null} onOpenChange={value=>{if(!value&&!busy&&!guardedPending)setConfirmation(null);}}
      title={confirmation==="SAVE"?"Update after-college outcomes":"Undo bulk after-college update"}
      description={confirmation==="SAVE"?
        ids.length+" student(s) will have their recorded After college outcome changed. Continue?":
        "Restore the previous outcome for "+(undo?.length??0)+" student(s)?"}
      footer={<><Button variant="secondary" disabled={busy||guardedPending} onClick={()=>setConfirmation(null)}>Cancel</Button>
        <Button disabled={busy||guardedPending||(confirmation==="SAVE"?!ids.length:!undo?.length)}
          onClick={()=>void runGuarded(async()=>{if(confirmation==="SAVE")await save();else if(confirmation==="UNDO")await reverse();})}>
          {busy||guardedPending?"Saving…":"Confirm"}
        </Button></>}>
      <p className="text-sm">Only version-matching outcomes will be updated. Your choices are kept if saving fails.</p>
    </Dialog>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
