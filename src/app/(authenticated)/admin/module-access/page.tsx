import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { requirePermission } from "@/modules/permissions/policy";
import { getModuleAccessOverviewMetrics } from "@/modules/module-access/admin-overview-metrics-service";
import SuperAdminCollegeModuleAccessPage from "@/app/(authenticated)/admin/features/[collegeId]/page";

/**
 * Legacy Module Access follows the active college selector, never a global
 * list of other colleges. The college page remains the sole scoped editor.
 */
export default async function SuperAdminModuleAccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  requirePermission(context, "admin-scope.select");
  const collegeId = context.adminScope?.collegeId;
  if (!collegeId) {
    return <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Module Access" description="Manage the selected college's module access hierarchy." />
      <Banner tone="warning" role="status">
        Select a college in the Super Admin scope switcher to view module access.
        No college is selected; no hierarchy has been loaded.
      </Banner>
      <Link href="/admin/colleges"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
        Find a college
      </Link>
    </div>;
  }

  const metrics = await getModuleAccessOverviewMetrics(context, [collegeId])
    .then(value => ({available: true as const, value}))
    .catch(() => ({available: false as const, value: null}));
  return <div className="min-w-0 space-y-5">
    <section aria-label="Module Access selected-college summary" className="border-b border-border pb-4">
      <PageHeader title="Module Access" description="Using the college selected in your Super Admin scope switcher." />
      <div className="mt-3 flex flex-wrap gap-5 text-sm text-body">
        <p>Hierarchy scopes: Global · Organization · College · Department · Program · Batch · Class · Learner</p>
        {metrics.available ? <>
          <p><strong>{metrics.value.largestLearnerScope}</strong> active learners in this college</p>
          <p><strong>{metrics.value.studentOverrides}</strong> stored learner membership rules</p>
        </> : <p role="status">Hierarchy overview counts are temporarily unavailable.</p>}
      </div>
      <nav aria-label="Module Access tools" className="mt-3 flex flex-wrap gap-4">
        <Link href={`/admin/features/${encodeURIComponent(collegeId)}/history`}
          className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Recent changes
        </Link>
        <Link href={`/admin/features/${encodeURIComponent(collegeId)}/trace`}
          className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Search learner
        </Link>
        <Link href="/admin/module-access"
          className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Refresh
        </Link>
      </nav>
    </section>
    <SuperAdminCollegeModuleAccessPage
      params={Promise.resolve({collegeId})}
      searchParams={searchParams}
    />
  </div>;
}
