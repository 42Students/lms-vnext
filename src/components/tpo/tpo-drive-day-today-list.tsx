"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

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

function when(value:string|null):string|null{
  if(!value||!Number.isFinite(Date.parse(value)))return null;
  return new Intl.DateTimeFormat("en-IN",{
    hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata",
  }).format(new Date(value)).toUpperCase();
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
    <section aria-label="Today's on-campus rounds" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="sr-only">Today&apos;s on-campus rounds</h2>
        <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
          disabled={refreshing} onClick={retry}>
          {refreshing ? "Refreshing…" : "Reload"}
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
        <div className="rounded-[13px] border border-border bg-white p-6 text-center">
          <EmptyState title="There is no drive day for you today."
            action={<Link href="/tpo/calendar"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-white px-4 font-semibold text-link md:min-h-9">See upcoming rounds</Link>}/>
        </div>
      ) : null}
      {visible.length > 0 ? (
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          {visible.map(round => (
            <article key={round.id}
              className="flex min-h-[132px] min-w-0 flex-col justify-between gap-4 rounded-[13px] border border-[#e5e9f0] bg-white p-4 shadow-none transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-[2px] hover:border-[#a8dfe5] hover:shadow-md sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-link">Assigned round</p>
                <h3 className="mt-1 break-words text-lg font-semibold leading-snug text-foreground">
                  {round.companyName} · {round.jobTitle}
                </h3>
                <p className="mt-1 text-sm text-body">
                  {[round.name,when(round.scheduledAt),round.venue].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Link href={"/tpo/drive-day/" + encodeURIComponent(round.id)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-semibold text-on-primary hover:bg-primary-hover md:min-h-9">
                Open round
              </Link>
            </article>
          ))}
        </div>
      ) : null}
      {visible.length === 100 ?
        <p className="text-xs text-muted-foreground">Showing the first 100 scheduled rounds. Narrow the scope in the placement calendar for other rounds.</p> : null}
      {stale ? <p className="text-xs text-muted-foreground">The displayed assignment list is from the last successful load in this browser session. Refresh to verify changes.</p> : null}
    </section>
  );
}
