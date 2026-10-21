import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementTpoLeads } from "@/db/schema";
import { requirePersistedTpoMembership } from "@/modules/placements/tpo-persisted-actor-service";
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
  if (await tpoCrmTablesReady()) {
    // Bookmarks from the old LMS use positive numeric lead IDs. Resolve only
    // inside the active, persisted TPO membership college, then redirect to
    // the canonical UUID page. Never accept the ID as cross-college authority.
    if (/^[1-9][0-9]{0,9}$/.test(leadId)) {
      await requirePersistedTpoMembership(context, context.membership.collegeId);
      const [legacy] = await getDb().select({ id: placementTpoLeads.id })
        .from(placementTpoLeads).where(and(
          eq(placementTpoLeads.collegeId, context.membership.collegeId),
          eq(placementTpoLeads.legacyLeadId, Number(leadId)),
        )).limit(1);
      if (!legacy) notFound();
      redirect("/tpo/recruiters/" + encodeURIComponent(legacy.id));
    }
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
