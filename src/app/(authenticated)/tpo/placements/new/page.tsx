import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoNewPlacementPage() {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  return (
    <div className="space-y-4">
      <Link href="/tpo/placements/new/draft" className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-text">
        Quick draft: Step 1 →
      </Link>
      <PlacementJobCreateWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        eyebrow="TPO"
        basePath="/tpo/placements"
      />
    </div>
  );
}
