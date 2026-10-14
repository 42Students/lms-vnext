import Link from "next/link";

import {
  PageHeader,
} from "@/components/ui/page-header";
import {
  StatusBadge,
} from "@/components/ui/status-badge";

import type {
  getTpoRoundDriveDay,
} from "@/modules/placements/tpo-round-drive-day-service";

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
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-secondary"
          >
            ← Back to job Drive Day
          </Link>
        }
      />

      <p className="text-sm text-body">
        <a
          href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/attendance/export"}
          className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover"
        >
          Export round attendance (CSV)
        </a>
        <span className="ml-3">
          Current roster only; waiting and unmarked states remain explicit.
        </span>
        <Link
          href={"/tpo/drive-day/" + encodeURIComponent(data.round.id) + "/no-shows"}
          className="ml-3 inline-flex min-h-10 items-center font-semibold text-primary-text hover:underline"
        >
          Review explicit no-shows →
        </Link>
      </p>

      <section className="rounded-xl border border-border bg-surface p-5">
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
            Read-only
          </StatusBadge>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map(([label, count]) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-surface p-4"
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

      <section
        aria-label="Round applicant roster"
        className="overflow-hidden rounded-xl border border-border bg-surface"
      >
        <div className="border-b border-border p-5">
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

        {data.rows.length === 0 ? (
          <div
            role="status"
            className="p-8 text-sm text-body"
          >
            No eligible applicants currently appear in
            this round&apos;s roster.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-surface-secondary text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Student
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Roll number
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Application
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Round attendance
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Latest result
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {data.rows.map((student) => (
                  <tr key={student.applicationId}>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {student.displayName}
                    </td>

                    <td className="px-4 py-3 text-body">
                      {student.rollNumber ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge>
                        {student.applicationStatus}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={statusTone(
                          student.attendance,
                        )}
                      >
                        {student.attendance.replaceAll(
                          "_",
                          " ",
                        )}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3">
                      {student.resultStatus &&
                      student.resultOutcome ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            tone={statusTone(
                              student.resultStatus,
                            )}
                          >
                            {student.resultStatus}
                          </StatusBadge>
                          <span className="text-body">
                            {student.resultOutcome}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          No result recorded
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        This TPO page is read-only. Attendance marking,
        bulk result submission, confirmation and other
        operational actions remain in their existing
        authorized workflows.
      </p>
    </div>
  );
}
