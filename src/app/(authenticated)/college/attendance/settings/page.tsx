import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { CollegeAttendancePolicyForm } from "@/components/attendance/college-attendance-policy-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  getCollegeAttendancePolicy,
} from "@/modules/attendance/policy-service";

export default async function CollegeAttendanceSettingsPage() {
  const context =
    await getCurrentRequestContext();

  const collegeId =
    context.membership?.collegeId ??
    (isSuperAdmin(context) ? context.adminScope?.collegeId : null);

  if (!collegeId) {
    redirect("/dashboard");
  }

  const { college, policy } =
    await getCollegeAttendancePolicy(
      context,
      collegeId,
    );

  return (
    <div className="min-w-0 overflow-x-clip space-y-6">
      <PageHeader
        eyebrow="College Admin · Academics"
        title="Attendance policy"
        description={`Set the attendance eligibility threshold and correction window for ${college.name}.`}
        actions={
          <Link
            href="/college/attendance"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
          >
            Back to Attendance
          </Link>
        }
      />

      <CollegeAttendancePolicyForm
        collegeId={college.id}
        initialPolicy={policy}
      />
    </div>
  );
}
