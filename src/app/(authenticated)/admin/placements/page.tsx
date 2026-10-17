import Link from "next/link";
import {listPlatformPlacementPolicy} from "@/modules/placements/platform-placement-policy-service";
import {SuperAdminPlatformPlacementPolicy} from "@/components/placements/super-admin-platform-placement-policy";
import {SuperAdminPlacementOversightNav} from "@/components/admin/super-admin-placement-oversight-nav";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminPlacementsPage({searchParams}:{searchParams:Promise<{staleDays?:string}>}) {
  const raw=await searchParams;
  const staleDays=[3,7,14,30].includes(Number(raw.staleDays))?Number(raw.staleDays):7;
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;
  const policy = await listPlatformPlacementPolicy(context);
  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Placement Drives"
          description="Placement administration requires a college safety scope."
        />
        <SuperAdminPlacementOversightNav />
      <Link href="/admin/placements/student-lookup" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Look up a student&apos;s placement status →</Link>
        <SuperAdminPlatformPlacementPolicy initial={policy} />
        <Link href="/admin/placements/drives" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Open All drives table →</Link>
      <Link href="/admin/companies" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Browse companies across your current scope →</Link>
        <EmptyState
          title="Select a college to continue"
          description="Drives is college-scoped. Pick an Organization + College in the header above."
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Placement Drives"
        description="Run active hiring drives from one operational view. Attention items surface decisions that need action; closed and draft drives remain available in the full archive."
        actions={
          <Link
            href="/admin/placements/new"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
          >
            New drive
          </Link>
        }
      />
      <SuperAdminPlacementOversightNav />
      <Link href="/admin/placements/student-lookup" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Look up a student&apos;s placement status →</Link>
      <SuperAdminPlatformPlacementPolicy initial={policy} />
      <Link href="/admin/companies" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Companies directory →</Link>
      <PlacementOperationsWorkspace
        context={context}
        collegeId={collegeId}
        basePath="/admin/placements"
        staleDays={staleDays}
      />
    </div>
  );
}
