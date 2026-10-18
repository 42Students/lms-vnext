import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  attendanceEvidenceLabel,
  departmentInsightsHref,
  readinessEvidenceLabel,
} from "@/modules/admin-ui/college-department-insights-model";
import type { listCollegeDepartmentInsights } from "@/modules/admin-ui/college-department-insights-service";

type Data = Awaited<ReturnType<typeof listCollegeDepartmentInsights>>;

export function CollegeDepartmentInsights({
  data, correctionPolicy,
}: {
  data: Data;
  correctionPolicy?: {
    correctionWindowHours: number;
    eligibilityThresholdPercent: number;
  };
}) {
  const attendance = data.kind === "ATTENDANCE";
  const title = attendance ? "Attendance by Department" : "Placement Evidence by Department";
  const path = attendance
    ? "/college/attendance/departments"
    : "/college/placements/readiness-by-department";
  return <div className="space-y-6">
    <PageHeader
      eyebrow="College Admin · Department Insights"
      title={title}
      description={attendance
        ? "College-scoped marked attendance sessions and explicit learner-status records, not attendance rates."
        : "Coverage of persisted academic evidence and placement preferences among active enrolled learners. No eligibility or readiness score is inferred."}
      actions={<>
        {attendance ? <a href={"/api/attendance/admin/departments/export" +
          (data.query.q ? "?q=" + encodeURIComponent(data.query.q) : "")}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Export CSV
        </a> : null}
        <Link href={attendance ? "/college/attendance" : "/college/placements"}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          {attendance ? "Attendance workspace" : "Placements workspace"}
        </Link>
      </>}
    />
    {attendance && correctionPolicy ? (
      <section aria-label="College attendance correction policy"
        className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-body">
        <p className="font-semibold text-foreground">Attendance policy — read-only</p>
        <p className="mt-1">Faculty marking/correction window: {correctionPolicy.correctionWindowHours} hours after class end.</p>
        <p>Exam eligibility threshold: {correctionPolicy.eligibilityThresholdPercent}%.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          College Admin correction permissions are separate from Faculty marking windows.
          These settings are policy context, not department attendance percentages.
        </p>
        <Link href="/college/attendance/settings"
          className="mt-2 inline-block font-semibold text-primary-text">Attendance policy settings</Link>
      </section>
    ) : null}
    <section aria-label="Department filters" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <form method="get" action={path} className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
          Department name
          <input name="q" type="search" maxLength={100} defaultValue={data.query.q}
            placeholder="Search your college"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Search</button>
        <Link href={path} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
      </form>
    </section>
    <section aria-label="Department evidence results" className="overflow-x-auto rounded-xl border border-border bg-surface">
      <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
        {data.total} matching department{data.total === 1 ? "" : "s"}
      </p>
      {data.items.length === 0 ? (
        <p className="p-6 text-sm text-body">{data.total === 0
          ? "No departments match these filters. No attendance or placement evidence is inferred."
          : "No departments exist on this page. Choose an earlier page."}</p>
      ) : (
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            {attendance
              ? <tr>
                  <th scope="col" className="px-4 py-3">Department</th>
                  <th scope="col" className="px-4 py-3">Marked sessions</th>
                  <th scope="col" className="px-4 py-3">Explicit status records</th>
                  <th scope="col" className="px-4 py-3">Status breakdown</th>
                </tr>
              : <tr>
                  <th scope="col" className="px-4 py-3">Department</th>
                  <th scope="col" className="px-4 py-3">Active enrolled learners</th>
                  <th scope="col" className="px-4 py-3">Academic evidence</th>
                  <th scope="col" className="px-4 py-3">Preferences</th>
                </tr>}
          </thead>
          <tbody>
            {data.items.map((item) => <tr key={item.id} className="border-t border-border align-top">
              <td className="px-4 py-4">
                <p className="font-semibold text-foreground">{item.name}</p>
                {item.archivedAt ? <p className="mt-1 text-xs text-muted-foreground">Archived department</p> : null}
              </td>
              {attendance
                ? <>
                    <td className="px-4 py-4 text-body">{item.markedSessions}</td>
                    <td className="px-4 py-4 text-body">{attendanceEvidenceLabel(item)}</td>
                    <td className="px-4 py-4 text-body">
                      {item.absent} absent · {item.late} late · {item.excused} excused · {item.medical} medical
                    </td>
                  </>
                : <>
                    <td className="px-4 py-4 text-body">{item.learners}</td>
                    <td className="px-4 py-4 text-body">{readinessEvidenceLabel(item)}</td>
                    <td className="px-4 py-4 text-body">{item.preferenceProfiles} profiles recorded</td>
                  </>}
            </tr>)}
          </tbody>
        </table>
      )}
    </section>
    <nav aria-label="Department pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <div className="flex gap-2">
        {data.query.page > 1 ? <Link
          className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text"
          href={departmentInsightsHref(data.kind, { ...data.query, page: data.query.page - 1 })}>Previous</Link> : null}
        {data.query.page < data.totalPages ? <Link
          className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text"
          href={departmentInsightsHref(data.kind, { ...data.query, page: data.query.page + 1 })}>Next</Link> : null}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      {attendance
        ? "Only persisted MARKED schedule sessions and explicit attendance-record statuses are counted. Present status may be implicit. Missing records, learner denominators, eligible sessions and percentages are not inferred. Cancelled events are excluded."
        : "Evidence coverage is not eligibility, job qualification, interview preparation, verified placement readiness or a season-frozen cohort. Learners with no active enrollment are outside this view. Counts are current persisted membership/enrollment evidence only."}
      Exact legacy report parity and independent browser/DB acceptance remain open.
    </p>
  </div>;
}
