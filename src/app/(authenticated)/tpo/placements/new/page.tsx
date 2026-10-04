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
    <PlacementJobCreateWorkspace
      context={context}
      collegeId={context.membership.collegeId}
      eyebrow="TPO"
      basePath="/tpo/placements"
    />
  );
}
