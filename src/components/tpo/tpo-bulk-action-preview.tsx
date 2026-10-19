"use client";
import {Button} from "@/components/ui/button";

import type { BulkPreviewRow, BulkOutcome } from "@/modules/placements/tpo-bulk-action-model";
import { countBulkOutcomes } from "@/modules/placements/tpo-bulk-action-model";

export function TpoBulkActionPreview({ rows, outcomes = [], busy = false, onConfirm, actionLabel = "selected changes" }: {
  rows: readonly BulkPreviewRow[];
  outcomes?: readonly BulkOutcome[];
  busy?: boolean;
  onConfirm: () => void;
  actionLabel?: string;
}) {
  const ready = rows.filter((row) => row.status === "ready").length;
  const counts = countBulkOutcomes(outcomes);
  const groupedSkipped=Object.entries(rows.filter(row=>row.status==="skipped")
    .reduce<Record<string,string[]>>((groups,row)=>{
      const reason=row.reason??"Unavailable";(groups[reason]??=[]).push(row.label);
      return groups;
    },{}));
  return <section aria-label="Bulk action preview" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3 sm:p-4">
    <h2 className="font-semibold">Review bulk action: {actionLabel}</h2>
    <p role="status" className="text-sm">{ready} ready; {rows.length - ready} skipped.</p>
    <ul className="max-h-72 space-y-2 overflow-y-auto break-words text-sm">
      {rows.map((row, i) => <li key={row.id + ":" + i} className="rounded-[var(--lms-control-radius)] border border-border p-2">
        <strong>{row.label}</strong> — {row.status}{row.reason ? ": " + row.reason : ""}
      </li>)}
    </ul>
    {groupedSkipped.length>0?<details className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
      <summary className="font-semibold">Left out: {rows.length-ready} grouped by reason</summary>
      {groupedSkipped.map(([reason,names])=><div key={reason} className="mt-2">
       <h3 className="font-medium">{reason} ({names.length})</h3>
       <p className="break-words text-body">{names.join(", ")}</p>
      </div>)}
    </details>:null}
    <Button type="button" disabled={busy || ready === 0} onClick={onConfirm}
      className="w-full sm:w-auto">
      {busy ? "Applying…" : "Confirm " + actionLabel}
    </Button>
    {outcomes.length > 0 ? <div aria-live="polite" className="text-sm">
      <p>{counts.updated} updated; {counts.skipped} skipped; {counts.failed} failed.</p>
      <ul className="break-all">{outcomes.map((row, i) => <li key={row.id + ":" + i}>
        {rows.find(selected=>selected.id===row.id)?.label??"Row "+(i+1)}: {row.status}{row.reason ? " — " + row.reason : ""}
      </li>)}</ul>
    </div> : null}
  </section>;
}
