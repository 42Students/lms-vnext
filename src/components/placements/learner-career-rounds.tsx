"use client";

import { Button } from "@/components/ui/button";

import {useEffect,useState} from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { isCareerRoundVisible } from "@/modules/placements/learner-round-visibility-policy";
import { learnerRoundTimeLabel, learnerRoundTimeSignal } from "@/modules/placements/learner-round-time-signal";
import {learnerInterviewCountdown} from "@/modules/placements/learner-interview-countdown-model";

export type LearnerCareerRound = {
  applicationId: string;
  roundId: string;
  roundName: string;
  roundKind: string;
  testUrl: string | null;
  sequence: number;
  durationMinutes?: number | null;
  scheduledAt: string | null;
  timezone: string | null;
  mode: string | null;
  venue: string | null;
  meetingUrl: string | null;
  roleTitle: string;
  companyName: string;
  exception: {
    scheduledAt: string;
    timezone: string;
    mode: string;
    venue: string | null;
    meetingUrl: string | null;
  } | null;
};

function safeHref(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatWhen(value: string | null) {
  if (!value) return "Schedule pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(date);
}

export function LearnerCareerRounds({
  rounds,
  kind,
  onSelect,
  snapshotNowIso,
  highlightedKey = null,
}: {
  rounds: readonly LearnerCareerRound[];
  kind: "ASSESSMENT" | "INTERVIEW" | "CALENDAR";
  onSelect?: (round: LearnerCareerRound) => void;
  snapshotNowIso?: string;
  highlightedKey?: string | null;
}) {
  const [clockMs,setClockMs]=useState(()=>snapshotNowIso?Date.parse(snapshotNowIso):Number.NaN);
  useEffect(()=>{
    if(!snapshotNowIso)return;
    const timer=window.setInterval(()=>setClockMs(Date.now()),60_000);
    return ()=>window.clearInterval(timer);
  },[snapshotNowIso]);
  const filtered = rounds.filter((round) =>
    isCareerRoundVisible(kind, round.roundKind),
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={kind === "ASSESSMENT" ? "No assessments scheduled" : kind === "INTERVIEW" ? "No interviews scheduled" : "No career events scheduled"}
        description="Scheduled placement rounds appear here after your application is shortlisted."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {filtered.map((round) => {
        const schedule = round.exception ?? round;
        const meetingUrl = safeHref(schedule.meetingUrl);
        const assessmentLink = kind === "ASSESSMENT" ? safeHref(round.testUrl) : null;
        const snapshot=clockMs;
        const timeSignal=Number.isFinite(snapshot)
          ? learnerRoundTimeSignal({scheduledAt:schedule.scheduledAt,
              durationMinutes:round.durationMinutes},snapshot)
          : null;
        return (
          <article key={round.applicationId + ":" + round.roundId}
            data-focused={highlightedKey===round.applicationId+":"+round.roundId?"true":undefined}
            aria-current={highlightedKey===round.applicationId+":"+round.roundId?"true":undefined}
            className={highlightedKey===round.applicationId+":"+round.roundId
              ? "min-w-0 scroll-mt-24 rounded-xl border-2 border-primary bg-primary-subtle p-4 sm:p-5"
              : "min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5"}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">{round.companyName}</p>
                <h2 className="mt-1 break-words text-lg font-semibold text-foreground">{round.roleTitle}</h2>
                <p className="mt-1 text-sm font-semibold text-body">Round {round.sequence} · {round.roundName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info">{schedule.mode === "VIRTUAL" ? "Virtual" : schedule.mode === "ON_CAMPUS" ? "On campus" : "Scheduled"}</StatusBadge>
                {kind==="INTERVIEW"&&Number.isFinite(snapshot) ? (
                  <StatusBadge tone={learnerInterviewCountdown({
                    scheduledAt:schedule.scheduledAt,durationMinutes:round.durationMinutes,
                  },snapshot).phase==="UPCOMING"?"info":"neutral"}>
                    {learnerInterviewCountdown({
                      scheduledAt:schedule.scheduledAt,durationMinutes:round.durationMinutes,
                    },snapshot).label}
                  </StatusBadge>
                ) : null}
                {timeSignal ? <StatusBadge tone={timeSignal==="UPCOMING"?"info":"neutral"}>
                  {learnerRoundTimeLabel(timeSignal)}
                </StatusBadge> : null}
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-body sm:grid-cols-2">
              <p className="m-0"><span className="font-semibold text-foreground">When:</span> {formatWhen(schedule.scheduledAt)}</p>
              <p className="m-0"><span className="font-semibold text-foreground">Where:</span> {schedule.mode === "VIRTUAL" ? "Online" : schedule.venue || "Venue pending"}</p>
            </div>
            {round.exception ? <p className="mt-3 text-xs font-semibold text-warning">This schedule includes your approved reschedule request.</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              {onSelect ? (
                <Button
                  type="button" variant="ghost"
                  onClick={() => onSelect(round)}
                  className="min-h-11 w-full justify-start !text-[var(--lms-primary-text)] underline sm:w-auto"
                >
                  Round details
                </Button>
              ) : null}
              {meetingUrl ? <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-text">Open meeting ↗</a> : null}
              {assessmentLink ? <a href={assessmentLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-text">Open employer assessment ↗</a> : null}
              <Link href={"/learn/my-placements/applications?applicationId=" + encodeURIComponent(round.applicationId)} className="text-sm font-semibold text-primary-text">View application</Link>
            </div>
            {kind === "ASSESSMENT" ? (
              <p className="mt-3 text-sm text-body" role="note">
                {assessmentLink
                  ? "Complete and submit the assessment on the employer’s platform. Opening this link does not submit your work."
                  : "The employer assessment link is not available yet. Check your placement updates for instructions."}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
