import { notFound } from "next/navigation";
import { departmentAttendanceCsv } from "@/modules/attendance/college-department-csv-model";
import { learnerAttendanceHistoryCsv } from "@/modules/attendance/learner-attendance-history-csv-model";
import { collegeAdminHistoryCsv } from "@/modules/colleges/admin-history-export-model";
import { buildSuperAdminReadinessCsv } from "@/modules/colleges/admin-readiness-export-model";
import { buildTenantDirectoryCsv } from "@/modules/colleges/admin-tenant-export-model";
import type { CollegeReadinessEvaluation } from "@/modules/colleges/readiness-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";

/**
 * Development-only, synthetic acceptance fixture. The CSV bytes are produced
 * by the real G170/G172 serializers, with no live tenant/customer data.
 * The actual authenticated export API routes remain unchanged.
 */
export default function UxAttendanceCollegeCsvFixture() {
  if (process.env.NODE_ENV !== "development" ||
      env.UX_EXPORT_FIXTURE !== "1") notFound();
  const readiness: CollegeReadinessEvaluation = {
    overall: "NOT_READY",
    counts: {total: 1, passed: 0, failed: 1, unknown: 0},
    checks: [{id: "COLLEGE_ACTIVE", label: "Active", status: "FAIL",
      evidence: "\u093E=UNSAFE", remediation: "Review college status"}],
  };
  const sampleTime = new Date("2026-11-07T05:00:00Z");
  const examples = [
    {key: "department", label: "Department attendance",
      file: "department-attendance.csv",
      csv: departmentAttendanceCsv([{
        name: "\u093E=SUM(1)", markedSessions: 2, recordedRows: 1,
        absent: 1, late: 0, excused: 0, medical: 0,
      }])},
    {key: "learner", label: "Learner attendance",
      file: "learner-attendance.csv",
      csv: learnerAttendanceHistoryCsv([{
        courseCode: "CS101", title: "\u20DD@IMPORTDATA(1)",
        startsAt: sampleTime.toISOString(), status: "NOT_MARKED",
        facultyName: "Example faculty", location: "Room 1",
      }]).content},
    {key: "history", label: "College admin history",
      file: "college-admin-history.csv",
      csv: collegeAdminHistoryCsv([{
        occurredAt: sampleTime, eventType: "\u20DD=FORMULA", summary: "Example change",
      }])},
    {key: "readiness", label: "College readiness evidence",
      file: "college-readiness.csv",
      csv: buildSuperAdminReadinessCsv({name: "Example College", code: "demo"}, readiness)},
    {key: "tenants", label: "College directory",
      file: "tenant-directory.csv",
      csv: buildTenantDirectoryCsv([{
        id: "example-id", name: "\u093E+FORMULA", code: "demo", status: "ACTIVE",
        organizationId: "demo-org", organizationName: "Example Organization",
        organizationStatus: "ACTIVE", city: "Example City", state: null,
        country: "India", createdAt: sampleTime, updatedAt: sampleTime,
      }], false)},
  ];
  return <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
    <header className="space-y-2">
      <Heading level={1} className="text-2xl font-semibold">Export quality check</Heading>
      <p className="text-sm text-body">Development-only sample files. No live account or college data.</p>
    </header>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {examples.map(sample => <section key={sample.key}
        className="min-w-0 space-y-3 rounded-xl border border-border p-4">
        <Heading level={2} className="break-words text-base font-semibold">{sample.label}</Heading>
        <p className="break-all text-xs text-muted-foreground">{sample.file}</p>
        <ButtonLink variant="secondary" className="focus-ring flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold no-underline"
          href={"data:text/csv;charset=utf-8," + encodeURIComponent(sample.csv)}
          download={sample.file}>Download sample CSV</ButtonLink>
      </section>)}
    </div>
  </main>;
}
