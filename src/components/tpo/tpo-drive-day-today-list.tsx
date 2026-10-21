"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export type TpoDriveDayTodayRound = {
  id: string;
  name: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: string | null;
  venue: string | null;
  status: string;
};

function isRound(value: unknown): value is TpoDriveDayTodayRound {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TpoDriveDayTodayRound>;
  return typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.jobTitle === "string" && typeof item.companyName === "string" &&
    (item.scheduledAt === null || typeof item.scheduledAt === "string") &&
    (item.venue === null || typeof item.venue === "string") &&
    typeof item.status === "string";
}

function when(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Time not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

/** Store only the last good same-user, same-college, same-IST-day snapshot. */
export function TpoDriveDayTodayList({
  rows, failed, cacheKey,
}: { rows: TpoDriveDayTodayRound[]; failed: boolean; cacheKey: string }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [previous, setPrevious] = useState<TpoDriveDayTodayRound[]>([]);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    try {
      const key = "tpo-drive-day:" + cacheKey;
      if (!failed) {
        sessionStorage.setItem(key, JSON.stringify(rows));
        setPrevious([]);
        setDismissed(false);
      } else {
        const cached = JSON.parse(sessionStorage.getItem(key) ?? "null") as unknown;
        setPrevious(Array.isArray(cached) && cached.every(isRound) ? cached.slice(0, 100) : []);
      }
    } catch {
      setPrevious([]);
    }
  }, [cacheKey, failed, rows]);

  const stale = failed && previous.length > 0;
  const visible = failed ? previous : rows;
  const retry = () => startRefresh(() => router.refresh());
  return (
    <section aria-label="Today's on-campus rounds" className="space-y-3 border-b border-border pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Today&apos;s on-campus rounds</h2>
        <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
          disabled={refreshing} onClick={retry}>
          {refreshing ? "Refreshing drive-day assignments…" : "Refresh"}
        </Button>
      </div>
      {refreshing && visible.length > 0 ?
        <p role="status" className="text-sm text-body">Refreshing drive-day assignments…</p> : null}
      {failed && !dismissed ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p>{stale ? "This refresh failed. Showing the last successful assignments." :
              "Could not load today's drive-day assignments."}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={refreshing} onClick={retry}>Retry</Button>
              {stale ? <Button type="button" variant="ghost" onClick={() => setDismissed(true)}>Dismiss</Button> : null}
            </div>
          </div>
        </Alert>
      ) : null}
      {visible.length === 0 && !failed ? (
        <EmptyState title="No on-campus rounds scheduled today"
          description="No published on-campus drive rounds are scheduled for today in your college."
          action={<Link href="/tpo/calendar" className="font-semibold text-link underline">See upcoming rounds</Link>} />
      ) : null}
      {visible.length > 0 ? (
        <div className="divide-y divide-border">
          {visible.map(round => (
            <div key={round.id} className="flex min-w-0 flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <h3 className="font-semibold">{round.companyName} · {round.name}</h3>
                <p className="text-sm text-body">{round.jobTitle} · {when(round.scheduledAt)} · {round.venue ?? "Venue not recorded"}</p>
                <StatusBadge tone={round.status === "COMPLETED" ? "success" : "info"}>{round.status}</StatusBadge>
              </div>
              <Link href={"/tpo/drive-day/" + encodeURIComponent(round.id)}
                className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Open round</Link>
            </div>
          ))}
        </div>
      ) : null}
      {visible.length === 100 ?
        <p className="text-xs text-muted-foreground">Showing the first 100 scheduled rounds. Narrow the scope in the placement calendar for other rounds.</p> : null}
      {stale ? <p className="text-xs text-muted-foreground">The displayed assignment list is from the last successful load in this browser session. Refresh to verify changes.</p> : null}
    </section>
  );
}
