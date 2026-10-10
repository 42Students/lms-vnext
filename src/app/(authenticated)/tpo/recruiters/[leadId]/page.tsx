import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { RecruiterLeadDetailWorkspace } from "@/components/tpo/recruiter-lead-detail-workspace";

type RouteProps = { params: Promise<{ leadId: string }> };

export default async function TpoRecruiterDetailPage({ params }: RouteProps) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const { leadId } = await params;
  return (
    <RecruiterLeadDetailWorkspace
      collegeId={context.membership.collegeId}
      leadId={leadId}
    />
  );
}
