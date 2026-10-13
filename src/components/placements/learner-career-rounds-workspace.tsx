"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { LearnerCareerRounds, type LearnerCareerRound } from "./learner-career-rounds";
import {
  browseLearnerCareerRounds,
  learnerRoundScheduledInstant,
  learnerRoundUrgency,
  type LearnerRoundBrowseFilters,
  type LearnerRoundTimeBucket,
} from "@/modules/placements/learner-rounds-browse-model";

type Kind = "ASSESSMENT" | "INTERVIEW";
const timeChoices: { value: LearnerRoundTimeBucket; label: string }[] = [
  { value:"all", label:"All" },
  { value:"upcoming", label:"Upcoming" },
  { value:"past", label:"Past schedule" },
  { value:"unscheduled", label:"Awaiting schedule" },
];
const defaults: LearnerRoundBrowseFilters = {
  search:"", time:"all", urgency:"all", sort:"soonest",
};
function externalLink(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function LearnerCareerRoundsWorkspace({
  kind,
  rounds,
  snapshotNowIso,
}: {
  kind: Kind;
  rounds: readonly LearnerCareerRound[];
  snapshotNowIso: string;
}) {
  const nowMs = Date.parse(snapshotNowIso);
  const [filters, setFilters] = useState<LearnerRoundBrowseFilters>(defaults);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const setFilter = <K extends keyof LearnerRoundBrowseFilters,>(
    key: K, value: LearnerRoundBrowseFilters[K],
  ) => setFilters((current) => ({ ...current, [key]: value }));
  const rows = useMemo(
    () => browseLearnerCareerRounds(rounds, kind, filters, nowMs),
    [rounds, kind, filters, nowMs],
  );
  const relevant = useMemo(
    () => browseLearnerCareerRounds(rounds, kind, defaults, nowMs),
    [rounds, kind, nowMs],
  );
  const selected = relevant.find(
    (round) => round.applicationId + ":" + round.roundId === selectedKey,
  ) ?? null;
  const urgencyCount = relevant.filter((round) => {
    const urgent = learnerRoundUrgency(round, nowMs);
    return urgent === "today" || urgent === "week";
  }).length;
  const selectClass = "mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]";
  const date = selected ? learnerRoundScheduledInstant(selected) : null;
  const meeting = externalLink(selected?.exception?.meetingUrl ?? selected?.meetingUrl ?? null);
  const employerTest = kind === "ASSESSMENT"
    ? externalLink(selected?.testUrl ?? null) : null;

  return (
    <div className="space-y-5">
      <section aria-label={kind === "ASSESSMENT" ? "Assessment filters" : "Interview filters"}
        className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm font-semibold text-foreground">
            {relevant.length} scheduled round{relevant.length === 1 ? "" : "s"}
          </p>
          <StatusBadge tone={urgencyCount ? "warning" : "neutral"}>
            {urgencyCount} within seven days
          </StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by schedule">
          {timeChoices.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              aria-pressed={filters.time === value}
              onClick={() => setFilter("time", value)}
              className={filters.time === value
                ? "min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
                : "min-h-10 rounded-full border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"}
            >{label}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-body">
            Search employers or rounds
            <input
              type="search" value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Search rounds…"
              className={selectClass}
            />
          </label>
          <label className="text-xs font-semibold text-body">
            Urgency
            <select value={filters.urgency}
              onChange={(event) => setFilter("urgency", event.target.value as LearnerRoundBrowseFilters["urgency"])}
              className={selectClass}>
              <option value="all">Any date</option>
              <option value="today">Today</option>
              <option value="week">Within seven days</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-body">
            Order
            <select value={filters.sort}
              onChange={(event) => setFilter("sort", event.target.value as LearnerRoundBrowseFilters["sort"])}
              className={selectClass}>
              <option value="soonest">Soonest first</option>
              <option value="latest">Latest first</option>
              <option value="company">Employer A–Z</option>
            </select>
          </label>
        </div>
      </section>

      {rows.length === 0 && relevant.length > 0 ? (
        <div role="status" className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm font-semibold text-foreground">No rounds match your filters</p>
          <p className="mt-2 text-sm text-body">Try a different date range or employer.</p>
          <button type="button"
            onClick={() => setFilters(defaults)}
            className="mt-3 min-h-10 text-sm font-semibold text-primary-text hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <LearnerCareerRounds
          kind={kind}
          rounds={rows}
          onSelect={(round) => setSelectedKey(round.applicationId + ":" + round.roundId)}
        />
      )}

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelectedKey(null); }}
        title={selected?.roundName ?? "Placement round"}
        description={selected ? selected.companyName + " · " + selected.roleTitle : undefined}
        footer={<>
          <Link
            href={selected
              ? "/learn/my-placements/applications?applicationId=" + encodeURIComponent(selected.applicationId)
              : "/learn/my-placements/applications"}
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
          >View application</Link>
          <Button onClick={() => setSelectedKey(null)}>Close</Button>
        </>}
      >
        {selected ? (
          <div className="space-y-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-muted-foreground">Date & time (IST)</dt>
                <dd className="mt-1 text-foreground">
                  {date === null ? "Schedule pending" :
                    new Intl.DateTimeFormat("en-IN", {
                      dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Kolkata",
                    }).format(new Date(date))}
                </dd>
              </div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Location</dt>
                <dd className="mt-1 text-foreground">{selected.exception?.venue ?? selected.venue ?? "Venue pending"}</dd>
              </div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Mode</dt>
                <dd className="mt-1 text-foreground">{selected.exception?.mode ?? selected.mode ?? "Pending"}</dd>
              </div>
              <div><dt className="text-xs font-semibold text-muted-foreground">Round</dt>
                <dd className="mt-1 text-foreground">#{selected.sequence} · {selected.roundName}</dd>
              </div>
            </dl>
            {selected.exception ? (
              <p role="status" className="rounded-lg border border-border bg-primary-subtle p-3 text-sm text-body">
                Your approved reschedule is reflected in the time above.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {employerTest ? (
                <a href={employerTest} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
                  Open employer assessment ↗
                </a>
              ) : null}
              {meeting ? (
                <a href={meeting} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
                  Open meeting ↗
                </a>
              ) : null}
            </div>
            {kind === "ASSESSMENT" ? (
              <p role="note" className="text-sm leading-6 text-body">
                Opening an employer assessment link does not submit or confirm completion.
                The employer controls official results.
              </p>
            ) : (
              <p role="note" className="text-sm leading-6 text-body">
                Scheduled time alone does not confirm attendance or an interview outcome.
              </p>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
