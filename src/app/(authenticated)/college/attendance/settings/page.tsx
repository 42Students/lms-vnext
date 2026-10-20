import { PageBackLink } from "@/components/ui/page-back-link";
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
    <div className="min-w-0 overflow-x-clip space-y-[var(--lms-space-5)]">
      <PageHeader
        title="Attendance policy"
        description={`Set the attendance eligibility threshold and correction window for ${college.name}.`}
        actions={
          <PageBackLink href="/college/attendance" label="Back to Attendance"/>
        }
      />

      <section className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
        <CollegeAttendancePolicyForm
        collegeId={college.id}
        initialPolicy={policy}
        />
      </section>
    </div>
  );
}
