import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeDepartmentInsights } from "@/components/college/college-department-insights";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeDepartmentInsightsQuerySchema,
  departmentInsightsQueryFromSearchParams,
} from "@/modules/admin-ui/college-department-insights-model";
import { listCollegeDepartmentInsights } from "@/modules/admin-ui/college-department-insights-service";

export default async function CollegePlacementDepartmentReadinessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const parsed = collegeDepartmentInsightsQuerySchema.safeParse(
    departmentInsightsQueryFromSearchParams(await searchParams),
  );
  if (!parsed.success) return <main className="min-w-0 space-y-4">
    <PageHeader eyebrow="College Admin" title="Placement Evidence by Department" />
    <ErrorState title="Invalid department filters"
      description="The search or page value is invalid. No placement evidence was loaded."
      action={<Link href="/college/placements/readiness-by-department" className="inline-flex min-h-[var(--lms-control-height)] items-center font-semibold text-link underline">Clear filters</Link>} />
  </main>;
  return <CollegeDepartmentInsights data={
    await listCollegeDepartmentInsights(context, "PLACEMENT_READINESS", parsed.data)
  } />;
}
