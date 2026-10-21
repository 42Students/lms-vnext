import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { ModuleAccessHierarchyActions } from "@/components/admin/module-access-hierarchy-actions";
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
        Pick a college first so this page does not show stale access data.
        No hierarchy, student overrides or historic decisions have been loaded.
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
    <section aria-label="Module Access selected-college summary" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <PageHeader eyebrow="Module Access" title="Optional module access hierarchy"
       description="Use this page for inherited Projects/Placements access below the college level. Review which rules are stored, inherited and locked." />
      <div className="mt-3 flex flex-wrap gap-5 text-sm text-body">
        <p><strong>8</strong> hierarchy scopes: Global · Organization · College · Department · Program · Batch · Class · Learner</p>
        {metrics.available ? <>
          <p><strong>{metrics.value.largestLearnerScope}</strong> active learners in this college</p>
          <p><strong>{metrics.value.studentOverrides}</strong> stored learner membership rules</p>
        </> : <p role="status">Hierarchy overview counts are temporarily unavailable.</p>}
      </div>
      {metrics.available&&metrics.value.studentOverrides>0?<Banner tone="warning">
        {metrics.value.studentOverrides} learner override(s) or stored learner membership rule(s) need review.
        <Link href={"/admin/features/"+encodeURIComponent(collegeId)+"/trace"}
         className="ml-2 font-semibold text-link underline">Review →</Link>
      </Banner>:null}
      <nav aria-label="Module Access tools" className="mt-3 flex flex-wrap gap-3">
        <Link href={`/admin/features/${encodeURIComponent(collegeId)}/history`}
          className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Recent changes
        </Link>
        <ModuleAccessHierarchyActions/>
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
    <div data-module-access-hierarchy className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <SuperAdminCollegeModuleAccessPage params={Promise.resolve({collegeId})}
        searchParams={searchParams}/>
    </div>
  </div>;
}
