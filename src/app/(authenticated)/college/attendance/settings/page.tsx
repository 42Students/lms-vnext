import { PageBackLink } from "@/components/ui/page-back-link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
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
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        title="Attendance policy"
        description={isSuperAdmin(context)
          ? `Set the attendance eligibility threshold and correction window for ${college.name}.`
          : `Review the attendance eligibility threshold and correction window for ${college.name}.`}
        actions={
          <PageBackLink href="/college/attendance" label="Back to Attendance" className="min-h-11" />
        }
      />

      <section className="min-w-0 pt-[var(--lms-space-2)]">
        <CollegeAttendancePolicyForm
          collegeId={college.id}
          initialPolicy={policy}
          readOnly={!isSuperAdmin(context)}
        />
      </section>
    </div>
  );
}
