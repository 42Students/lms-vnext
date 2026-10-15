"use client";

import type { BulkPreviewRow, BulkOutcome } from "@/modules/placements/tpo-bulk-action-model";
import { countBulkOutcomes } from "@/modules/placements/tpo-bulk-action-model";

export function TpoBulkActionPreview({ rows, outcomes = [], busy = false, onConfirm }: {
  rows: readonly BulkPreviewRow[];
  outcomes?: readonly BulkOutcome[];
  busy?: boolean;
  onConfirm: () => void;
}) {
  const ready = rows.filter((row) => row.status === "ready").length;
  const counts = countBulkOutcomes(outcomes);
  return <section aria-label="Bulk action preview" className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-3 sm:p-4">
    <h2 className="font-semibold">Review bulk action</h2>
    <p role="status" className="text-sm">{ready} ready; {rows.length - ready} skipped.</p>
    <ul className="max-h-72 space-y-2 overflow-y-auto break-words text-sm">
      {rows.map((row, i) => <li key={row.id + ":" + i} className="rounded border border-border p-2">
        <strong>{row.label}</strong> — {row.status}{row.reason ? ": " + row.reason : ""}
      </li>)}
    </ul>
    <button type="button" disabled={busy || ready === 0} onClick={onConfirm}
      className="min-h-11 w-full rounded bg-primary px-4 py-2 text-on-primary disabled:opacity-50 sm:w-auto">
      {busy ? "Applying…" : "Confirm eligible records"}
    </button>
    {outcomes.length > 0 ? <div aria-live="polite" className="text-sm">
      <p>{counts.updated} updated; {counts.skipped} skipped; {counts.failed} failed.</p>
      <ul className="break-all">{outcomes.map((row, i) => <li key={row.id + ":" + i}>
        {row.id}: {row.status}{row.reason ? " — " + row.reason : ""}
      </li>)}</ul>
    </div> : null}
  </section>;
}
