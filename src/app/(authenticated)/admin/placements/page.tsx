import Link from "next/link";
import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
import { SuperAdminPlatformPlacementPolicy } from "@/components/placements/super-admin-platform-placement-policy";
import { SuperAdminPlacementOversightNav } from "@/components/admin/super-admin-placement-oversight-nav";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9";

export default async function AdminPlacementsPage({ searchParams }: {
  searchParams: Promise<{ staleDays?: string }>;
}) {
  const raw = await searchParams;
  const staleDays = [3, 7, 14, 30].includes(Number(raw.staleDays)) ? Number(raw.staleDays) : 7;
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;
  const policy = await listPlatformPlacementPolicy(context);

  const directoryActions = (
    <>
      <Link href="/admin/placements/student-lookup" className={secondaryActionClass}>
        Look up a student&apos;s placement status →
      </Link>
      <Link href="/admin/companies" className={secondaryActionClass}>
        Companies directory →
      </Link>
    </>
  );

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="Placement Drives"
          description="Placement administration requires a college safety scope."
          actions={<>
            {directoryActions}
            <Link href="/admin/placements/drives" className={secondaryActionClass}>
              Open All drives table →
            </Link>
          </>}
        />
        <SuperAdminPlacementOversightNav />
        <SuperAdminPlatformPlacementPolicy initial={policy} />
        <EmptyState
          title="Select a college to continue"
          description="Drives is college-scoped. Pick an Organization + College in the header above."
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Placement Drives"
        description="Run active hiring drives from one operational view. Attention items surface decisions that need action; closed and draft drives remain available in the full archive."
        actions={<>
          {directoryActions}
          <Link
            href="/admin/placements/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-colors motion-reduce:transition-none md:min-h-9"
          >
            New drive
          </Link>
        </>}
      />
      <SuperAdminPlacementOversightNav />
      <SuperAdminPlatformPlacementPolicy initial={policy} />
      <PlacementOperationsWorkspace
        context={context}
        collegeId={collegeId}
        basePath="/admin/placements"
        staleDays={staleDays}
      />
    </div>
  );
}
