import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
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
  const columns: DataTableColumn<Data["items"][number]>[] = [
    {key:"name",header:"Department",mobilePriority:"primary",cell:item=><>
      <p className="font-semibold text-foreground">{item.name}</p>
      {item.archivedAt ? <p className="mt-1 text-xs text-muted-foreground">Archived department</p> : null}
    </>},
    {key:"population",header:attendance?"Marked sessions":"Active enrolled learners",
      mobilePriority:"secondary",cell:item=>attendance?item.markedSessions:item.learners},
    {key:"evidence",header:attendance?"Explicit status records":"Academic evidence",
      mobilePriority:"secondary",cell:item=>attendance?attendanceEvidenceLabel(item):readinessEvidenceLabel(item)},
    {key:"breakdown",header:attendance?"Status breakdown":"Preferences",
      mobilePriority:"secondary",cell:item=>attendance
        ? item.absent+" absent · "+item.late+" late · "+item.excused+" excused · "+item.medical+" medical"
        : item.preferenceProfiles+" profiles recorded"},
  ];
  return <div className="space-y-6">
    <PageHeader
      title={title}
      description={attendance
        ? "College-scoped marked attendance sessions and explicit learner-status records, not attendance rates."
        : "Coverage of persisted academic evidence and placement preferences among active enrolled learners. No eligibility or readiness score is inferred."}
      actions={<>
        {attendance ? <a href={"/api/attendance/admin/departments/export" +
          (data.query.q ? "?q=" + encodeURIComponent(data.query.q) : "")}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
          Export CSV
        </a> : null}
        <Link href={attendance ? "/college/attendance" : "/college/placements"}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
          {attendance ? "Attendance workspace" : "Placements workspace"}
        </Link>
      </>}
    />
    {attendance && correctionPolicy ? (
      <Alert tone="info" aria-label="College attendance correction policy">
        <p className="font-semibold text-foreground">Attendance policy — read-only</p>
        <p className="mt-1">Faculty marking/correction window: {correctionPolicy.correctionWindowHours} hours after class end.</p>
        <p>Exam eligibility threshold: {correctionPolicy.eligibilityThresholdPercent}%.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          College Admin correction permissions are separate from Faculty marking windows.
          These settings are policy context, not department attendance percentages.
        </p>
        <Link href="/college/attendance/settings"
          className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Attendance policy settings</Link>
      </Alert>
    ) : null}
    <section aria-label="Department filters" className="border-t border-border pt-4">
      <form method="get" action={path} className="flex flex-wrap items-end gap-3">
        <label className="grid w-full min-w-0 basis-full gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:w-56 md:basis-auto md:flex-none">
          Department name
          <Input name="q" type="search" maxLength={100} defaultValue={data.query.q}
            placeholder="Search your college"
            />
        </label>
        <Button variant="primary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
        <Link href={path} className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:w-auto">Clear</Link>
      </form>
    </section>
    <section aria-label="Department evidence results" className="min-w-0">
      <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
        {data.total} matching department{data.total === 1 ? "" : "s"}
      </p>
      <DataTable columns={columns} rows={data.items} getRowKey={item=>item.id}
        caption={title}
        empty={<EmptyState title={data.total===0?"No matching departments":"No departments on this page"}
          description={data.total===0?"No departments match these filters. No attendance or placement evidence is inferred.":"No departments exist on this page. Choose an earlier page."}/>}
      />
    </section>
    <nav aria-label="Department pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <div className="flex gap-2">
        {data.query.page > 1 ? <Link
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9"
          href={departmentInsightsHref(data.kind, { ...data.query, page: data.query.page - 1 })}>Previous</Link> : null}
        {data.query.page < data.totalPages ? <Link
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9"
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
