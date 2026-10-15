import Link from "next/link";
import { redirect } from "next/navigation";
import {tpoDriveTabs} from "@/modules/placements/tpo-drive-tab-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoPlacementDrivePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  const { jobId } = await params;
  return (
    <div className="min-w-0 space-y-4">
      <nav aria-label="Drive workspace sections"
        className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-3">
        {tpoDriveTabs(jobId).map(tab=>(
          <Link key={tab.href} href={tab.href}
            aria-current={tab.label==="Overview"?"page":undefined}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
            {tab.label}
          </Link>
        ))}
      </nav>
      <PlacementDriveWorkspace context={context} jobId={jobId} eyebrow="TPO"/>
    </div>
  );
}
