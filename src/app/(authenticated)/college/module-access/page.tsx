import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";

/** The legacy College Admin module-access entry stays within the college role
 * workspace; tenant-wide locks and global permissions stay with Super Admin.
 * The current college/role selector remains the source of scope. */
export default async function CollegeModuleAccessPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Module Access" />
    <ErrorState title="College assignment required"
      description="Select a college workspace before reviewing its optional modules." />
  </div>;
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Module Access"
      description="Review Projects, Placements and Electives access in this college." />
    <Banner tone="info">
      Module rules are inherited through college, department, program, batch, class and learner.
      A higher-level lock takes precedence. College-wide module rule changes and learner
      overrides require an authorized Super Admin.
    </Banner>
    <section aria-label="College module access destinations" className="space-y-3 border-y border-[var(--lms-canvas-border)] py-4">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Module workspaces</h2>
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/college/academics" className="min-h-11 inline-flex items-center font-semibold text-primary-text underline md:min-h-9">Academic setup</Link>
        <Link href="/college/projects" className="min-h-11 inline-flex items-center font-semibold text-primary-text underline md:min-h-9">Projects</Link>
        <Link href="/college/placements" className="min-h-11 inline-flex items-center font-semibold text-primary-text underline md:min-h-9">Placements</Link>
      </nav>
      <p className="text-sm text-body">If a module is unavailable, request a policy review from the platform administrator. A missing workspace is not proof that a module is enabled.</p>
    </section>
  </div>;
}
