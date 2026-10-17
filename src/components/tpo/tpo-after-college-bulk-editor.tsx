"use client";
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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (!rows.length) return null;
  const presentIds = new Set(rows.map(row => row.membershipId));
  const ids = selected.filter(id => presentIds.has(id));
  const selectAll = ids.length === rows.length;

  async function post(changes: { membershipId: string;
    outcome: AfterCollegeOutcome; expectedVersion: string }[]) {
    const response = await fetch("/api/placements/tpo/students/after-college/bulk", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(response.status === 409
      ? "Student records changed. Refresh and select them again."
      : payload?.error ?? "Bulk update failed");
    return payload as Result;
  }

  async function save() {
    if (!available || !ids.length) return;
    const description = ids.length + " learner(s) will have their After college outcome changed.";
    if (!window.confirm(description + " Continue?")) return;
    setBusy(true); setError(""); setMessage(""); setUndo(null);
    try {
      const receipt = await post(ids.map(id => ({
        membershipId: id, outcome,
        expectedVersion: current[id]?.expectedVersion ?? "none",
      })));
      setMessage("Updated " + receipt.updated + " After college outcome(s).");
      setUndo(receipt.results.filter(result => result.changed)); setSelected([]);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update outcomes");
    } finally { setBusy(false); }
  }

  async function reverse() {
    if (!undo?.length) return;
    if (!window.confirm("Undo the last bulk After college change?")) return;
    setBusy(true); setError("");
    try {
      const receipt = await post(undo.map(row => ({
        membershipId: row.membershipId,
        outcome: row.previousOutcome,
        expectedVersion: row.version,
      })));
      setUndo(null); setMessage("Restored " + receipt.updated + " previous outcome(s).");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Undo failed because a record changed");
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
        onClick={() => void save()}
        className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
        Update {ids.length} student(s)
      </button>
      {undo?.length ? <button type="button" disabled={busy} onClick={() => void reverse()}
        className="min-h-10 rounded border border-border px-4 font-semibold text-primary-text">Undo last bulk update</button> : null}
    </div>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
