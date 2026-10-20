import Link from "next/link";
import { TpoRoundCheckIn } from "./tpo-round-check-in";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

import {
  PageHeader,
} from "@/components/ui/page-header";
import {
  StatusBadge,
} from "@/components/ui/status-badge";

import type {
  getTpoRoundDriveDay,
} from "@/modules/placements/tpo-round-drive-day-service";
import { TpoRoundResultRecorder } from "./tpo-round-result-recorder";
import { TpoBulkRoundResultRecorder } from "./tpo-bulk-round-result-recorder";
import {tpoDriveDayRoundLinks} from "@/modules/placements/tpo-drive-day-navigation-model";

type RoundData = Awaited<
  ReturnType<typeof getTpoRoundDriveDay>
>;

function formatScheduledAt(
  value: Date | null,
): string {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

function statusTone(
  status: string,
): "neutral" | "info" | "success" | "error" {
  if (
    status === "PRESENT" ||
    status === "DONE" ||
    status === "APPLIED"
  ) {
    return "success";
  }

  if (status === "ABSENT") {
    return "error";
  }

  if (
    status === "IN_INTERVIEW" ||
    status === "STAGED"
  ) {
    return "info";
  }

  return "neutral";
}

export function TpoRoundDriveDayReadOnly({
  data,
}: {
  data: RoundData;
}) {
  const destinations=tpoDriveDayRoundLinks(data.job.id,data.round.id);
  const summary = [
    ["On roster", data.counts.total],
    ["Waiting", data.counts.waiting],
    ["Present", data.counts.present],
    ["In interview", data.counts.inInterview],
    ["Done", data.counts.done],
    ["Absent", data.counts.absent],
    ["Results staged", data.counts.stagedResults],
    ["Results applied", data.counts.appliedResults],
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Drive Day"
        title={data.companyName + " · " + data.round.name}
        description={
          data.job.title +
          " · Round-focused operational overview"
        }
        actions={
          <Link
            href={
              "/tpo/placements/jobs/" +
              encodeURIComponent(data.job.id)
            }
            className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            ← Back to job Drive Day
          </Link>
        }
      />

      <nav aria-label="Round operational actions" className="flex flex-wrap gap-3">
        <Link href={destinations.results} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">Review round results →</Link>
        <Link href={destinations.schedule} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">Candidate schedule →</Link>
      </nav>
      <p className="text-sm text-body">
        <a
          href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/attendance/export"}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 font-[650] hover:bg-primary-hover text-primary-foreground"
        >
          Export round attendance (CSV)
        </a>
        <span className="ml-3">
          Current roster only; waiting and unmarked states remain explicit.
        </span>
        <Link
          href={destinations.noShows}
          className="ml-3 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link hover:underline"
        >
          Review explicit no-shows →
        </Link>
      </p>

      <section className="border-b border-border pb-6">
        <h2 className="text-base font-semibold text-foreground">
          Round details
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="info">
            {data.round.kind.replaceAll("_", " ")}
          </StatusBadge>

          <StatusBadge
            tone={
              data.round.status === "COMPLETED"
                ? "success"
                : "neutral"
            }
          >
            {data.round.status.replaceAll("_", " ")}
          </StatusBadge>

          <StatusBadge>
            Audited stage / apply
          </StatusBadge>
        </div>

        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="font-semibold text-muted-foreground">
              Job
            </dt>
            <dd className="mt-1 text-foreground">
              {data.job.title}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-muted-foreground">
              Company
            </dt>
            <dd className="mt-1 text-foreground">
              {data.companyName}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-muted-foreground">
              Scheduled time
            </dt>
            <dd className="mt-1 text-foreground">
              {formatScheduledAt(
                data.round.scheduledAt,
              )}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-muted-foreground">
              Venue
            </dt>
            <dd className="mt-1 text-foreground">
              {data.round.venue ?? "Not specified"}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-label="Round progress">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Applicant progress
        </h2>

        <div className="grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-2 lg:grid-cols-4">
          {summary.map(([label, count]) => (
            <div
              key={label}
              className="border-b border-border p-4 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {count}
              </p>
            </div>
          ))}
        </div>

        {data.counts.unknownAttendance > 0 ? (
          <p
            role="status"
            className="mt-3 text-sm text-body"
          >
            {data.counts.unknownAttendance} roster
            entries have an unrecognized attendance state.
          </p>
        ) : null}

        <p className="mt-3 text-xs text-muted-foreground">
          Attendance counts reflect the current persisted
          Drive Day state. Staged results are not final
          applied outcomes.
          {" "}
          {data.counts.noResult}
          {" "}
          applicants have no current result record.
        </p>
      </section>

      <TpoBulkRoundResultRecorder
        roundId={data.round.id}
        round={{ kind: data.round.kind, status: data.round.status }}
        rows={data.rows}
      />

      <section
        aria-label="Round applicant roster"
        className="overflow-hidden border-t border-border"
      >
        <div className="border-b border-border py-4">
          <h2 className="text-base font-semibold text-foreground">
            Applicants in this round
          </h2>
          <p className="mt-1 text-sm text-body">
            Shortlisted applicants who reached this round
            under the existing previous-round progression
            rules. Only student names and roll numbers are
            displayed.
          </p>
        </div>

        <DataTable
          caption="Applicants in this round"
          rows={data.rows}
          getRowKey={student=>student.applicationId}
          empty={<EmptyState title="No eligible applicants currently appear in this round’s roster."/>}
          columns={[
            {key:"student",header:"Student",mobilePriority:"primary" as const,
              cell:(student:(typeof data.rows)[number])=>student.displayName},
            {key:"roll",header:"Roll number",mobilePriority:"secondary" as const,
              cell:(student:(typeof data.rows)[number])=>student.rollNumber??"—"},
            {key:"application",header:"Application",mobilePriority:"secondary" as const,
              cell:(student:(typeof data.rows)[number])=><StatusBadge>{student.applicationStatus}</StatusBadge>},
            {key:"attendance",header:"Round attendance",mobilePriority:"action" as const,
              cell:(student:(typeof data.rows)[number])=><div className="min-w-0 space-y-2">
                <span className="block text-xs font-semibold text-body sm:hidden">Round attendance</span>
                <StatusBadge tone={statusTone(student.attendance)}>
                  {student.attendance.replaceAll("_"," ")}
                </StatusBadge>
                <TpoRoundCheckIn
                  roundId={data.round.id}
                  applicationId={student.applicationId}
                  displayName={student.displayName}
                  attendance={student.attendance}
                  roundStatus={data.round.status}
                />
              </div>},
            {key:"result",header:"Latest result",mobilePriority:"action" as const,
              cell:(student:(typeof data.rows)[number])=><div className="min-w-0 space-y-2">
                <span className="block text-xs font-semibold text-body sm:hidden">Latest result</span>
                {student.resultStatus && student.resultOutcome ?
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone(student.resultStatus)}>
                      {student.resultStatus}
                    </StatusBadge>
                    <span className="text-body">{student.resultOutcome}</span>
                  </div>
                 :<span className="text-muted-foreground">No result recorded</span>}
                <TpoRoundResultRecorder
                  roundId={data.round.id}
                  round={{kind:data.round.kind,status:data.round.status}}
                  row={student}
                />
              </div>},
          ]}
        />
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        TPO operators can stage a PASS (shortlisted), FAIL (not selected),
        HOLD (waitlisted) or ABSENT outcome here. Staging is not publication:
        only completed rounds permit explicit, audited apply. Existing
        coordinator attendance controls remain separate. Bulk initial-result
        staging processes entries in individual audited transactions and may
        partly succeed; neither stage nor bulk stage implies an offer or
        final hiring selection.
      </p>
    </div>
  );
}
