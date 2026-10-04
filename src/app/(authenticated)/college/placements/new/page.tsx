import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function CollegeNewPlacementPage() {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    )
  ) {
    redirect("/dashboard");
  }
  return (
    <PlacementJobCreateWorkspace
      context={context}
      collegeId={context.membership.collegeId}
      eyebrow="College Admin"
      basePath="/college/placements"
    />
  );
}
