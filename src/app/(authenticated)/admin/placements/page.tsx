import Link from "next/link";
import {listPlatformPlacementPolicy} from "@/modules/placements/platform-placement-policy-service";
import {SuperAdminPlatformPlacementPolicy} from "@/components/placements/super-admin-platform-placement-policy";
import {SuperAdminPlacementOversightNav} from "@/components/admin/super-admin-placement-oversight-nav";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminPlacementsPage() {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;
  const policy = await listPlatformPlacementPolicy(context);
  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Placements"
          description="Placement administration requires a college safety scope."
        />
        <SuperAdminPlacementOversightNav />
        <SuperAdminPlatformPlacementPolicy initial={policy} />
        <Link href="/admin/placements/drives" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Open All drives table →</Link>
      <Link href="/admin/companies" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Browse companies across your current scope →</Link>
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before opening Placement operations."
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Placements"
        description="Placement operations inside the selected college safety scope."
        actions={
          <Link
            href="/admin/placements/new"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
          >
            New opportunity
          </Link>
        }
      />
      <SuperAdminPlacementOversightNav />
      <SuperAdminPlatformPlacementPolicy initial={policy} />
      <Link href="/admin/companies" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Companies directory →</Link>
      <PlacementOperationsWorkspace
        context={context}
        collegeId={collegeId}
        basePath="/admin/placements"
      />
    </div>
  );
}
