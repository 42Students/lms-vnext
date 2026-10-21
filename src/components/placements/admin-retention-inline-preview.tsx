"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type RetentionRow = {
  id: string;
  jobTitle: string;
  applicationStatus: string;
  lastUpdated: string;
};

type RetentionSample = {
  rows: RetentionRow[];
  truncated: boolean;
  cutoff: string;
  totalStaleCount: number | null;
};

function formatActivity(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
      }).format(date);
}

/** The housekeeping query is deliberately deferred until the admin opens this disclosure. */
export function AdminRetentionInlinePreview({ collegeId }: { collegeId: string }) {
  const [open, setOpen] = useState(false);
  const [sample, setSample] = useState<RetentionSample | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const cache = useRef(new Map<string, RetentionSample>());

  useEffect(() => {
    if (!open) return;
    const cached = cache.current.get(collegeId);
    if (cached && retryKey === 0) {
      setSample(cached);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch("/api/admin/placements/retention?collegeId=" + encodeURIComponent(collegeId), {
      method: "GET", cache: "no-store", credentials: "same-origin", signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) throw new Error("Retention request failed");
        return await response.json() as RetentionSample;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        cache.current.set(collegeId, data);
        setSample(data);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [open, collegeId, retryKey]);

  return <section className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-4" aria-label="Data retention report">
    <button type="button" aria-expanded={open} aria-controls="admin-retention-preview"
      onClick={() => setOpen(value => !value)}
      className="inline-flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm font-semibold text-[var(--lms-heading)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 2 4 3 8 3s8-1 8-3V5M4 12v7c0 2 4 3 8 3s8-1 8-3v-7"/></svg>
      Data retention report
      <span aria-hidden="true">{open ? "⌃" : "⌄"}</span>
    </button>
    {open ? <div id="admin-retention-preview" className="mt-2 space-y-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-3 text-sm">
      {loading ? <div role="status" aria-label="Loading data retention report" className="space-y-2">
        <p>Loading data retention report…</p>
        {[1, 2, 3].map(row => <div key={row} aria-hidden="true" className="h-7 animate-pulse rounded bg-muted" />)}
      </div> : error ? <div role="alert" className="flex flex-wrap items-center gap-3">
        <p>Couldn&apos;t load the data retention report.</p>
        <button type="button" onClick={() => { setSample(null); setRetryKey(value => value + 1); }}
          className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link hover:border-[var(--lms-primary)]">
          Retry
        </button>
      </div> : sample ? <>
        <p><strong>{sample.totalStaleCount === null ? "More than 200" : sample.totalStaleCount}</strong>
          {" "}rejected/withdrawn application(s) with no activity in the last 180 days.</p>
        {sample.rows.length ? <div className="max-h-[260px] overflow-y-auto divide-y divide-border">
          {sample.rows.map(row => <div key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-1 text-[13px]">
            <span className="min-w-0 max-w-[60%] truncate" title={row.jobTitle}>{row.jobTitle}</span>
            <span className="text-muted-foreground">{row.applicationStatus} · {formatActivity(row.lastUpdated)}</span>
          </div>)}
        </div> : <p className="text-muted-foreground">No applications needing review.</p>}
        {sample.truncated ? <p className="text-xs text-muted-foreground">
          Showing first 200 — sample truncated. Open the full report to review the records.
        </p> : null}
        <Link href="/admin/placements/retention?details=1"
          className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Open full retention report →</Link>
      </> : null}
    </div> : null}
  </section>;
}
