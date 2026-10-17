import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { CollegeDepartmentInsights } from "@/components/college/college-department-insights";
import { getCollegeAttendancePolicy } from "@/modules/attendance/policy-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeDepartmentInsightsQuerySchema,
  departmentInsightsQueryFromSearchParams,
} from "@/modules/admin-ui/college-department-insights-model";
import { listCollegeDepartmentInsights } from "@/modules/admin-ui/college-department-insights-service";

export default async function CollegeDepartmentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId=context.membership?.collegeId ??
    (isSuperAdmin(context)?context.adminScope?.collegeId:null);
  if(!collegeId)redirect("/dashboard");
  const parsed = collegeDepartmentInsightsQuerySchema.safeParse(
    departmentInsightsQueryFromSearchParams(await searchParams),
  );
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="College Admin" title="Attendance by Department" />
    <ErrorState title="Invalid department filters"
      description="The search or page value is invalid. No attendance evidence was loaded."
      action={<Link href="/college/attendance/departments" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const [data, policy] = await Promise.all([
    listCollegeDepartmentInsights(context, "ATTENDANCE", parsed.data),
    getCollegeAttendancePolicy(context, collegeId),
  ]);
  return <CollegeDepartmentInsights data={data} correctionPolicy={policy.policy} />;
}
