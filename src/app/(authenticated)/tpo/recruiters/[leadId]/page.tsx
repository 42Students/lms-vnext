import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoLead, TpoCrmError } from "@/modules/placements/tpo-crm-service";
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
  // Same gate as the lead API: while DB09 is unverified the client shows its pending notice.
  if (process.env.DB09_TPO_API_READY === "DB09_VERIFIED") {
    try {
      await getTpoLead(context, context.membership.collegeId, leadId);
    } catch (error) {
      if (
        error instanceof ZodError ||
        error instanceof AuthorizationError ||
        (error instanceof TpoCrmError && error.code === "TPO_CRM_LEAD_NOT_FOUND")
      ) notFound();
      throw error;
    }
  }
  return (
    <RecruiterLeadDetailWorkspace
      collegeId={context.membership.collegeId}
      leadId={leadId}
    />
  );
}
