import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";

export default async function AdminNewPlacementPage() {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;
  if (!collegeId) {
    redirect("/admin/placements");
  }
  return (
    <PlacementJobCreateWorkspace
      context={context}
      collegeId={collegeId}
      eyebrow="Super Admin"
      basePath="/admin/placements"
    />
  );
}
