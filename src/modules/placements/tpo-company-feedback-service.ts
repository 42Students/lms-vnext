import "server-only";

import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanies,
  placementCompanyRelationships,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { logTpoLeadActivity } from "./tpo-crm-service";
import {
  projectTpoCompanyFeedback,
  tpoCompanyFeedbackQuerySchema,
  tpoCompanyFeedbackWriteSchema,
} from "./tpo-company-feedback-model";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";

async function companyScope(context: RequestContext, companyId: string) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const [company] = await getDb().select({
    relationshipId: placementCompanyRelationships.id,
    companyName: placementCompanies.name,
  }).from(placementCompanyRelationships).innerJoin(
    placementCompanies,
    eq(placementCompanies.id, placementCompanyRelationships.companyId),
  ).where(and(
    eq(placementCompanyRelationships.companyId, companyId),
    eq(placementCompanyRelationships.collegeId, collegeId),
  )).limit(1);
  // Unknown and cross-college IDs receive identical not-found handling.
  return company ? { ...company, collegeId } : null;
}

/** Only NOTE-type persisted CRM activities for explicitly linked leads. */
export async function getTpoCompanyFeedback(context: RequestContext, raw: unknown) {
  const input = tpoCompanyFeedbackQuerySchema.parse(raw);
  const company = await companyScope(context, input.companyId);
  if (!company) return null;

  const available = await placementTableExists("placement_tpo_leads") &&
    await placementTableExists("placement_tpo_lead_activities");

  if (!available) return {
    companyName: company.companyName,
    available: false as const,
    writeEnabled: false,
    contacts: [] as { id: string; name: string }[],
    notes: [] as ReturnType<typeof projectTpoCompanyFeedback>,
    page: input.page,
    total: null as number | null,
    totalPages: null as number | null,
  };

  const db = getDb();
  const contacts = await db.select({
    id: placementTpoLeads.id,
    name: placementTpoLeads.name,
  }).from(placementTpoLeads)
    .where(and(
      eq(placementTpoLeads.collegeId, company.collegeId),
      eq(placementTpoLeads.companyRelationshipId, company.relationshipId),
    )).orderBy(placementTpoLeads.name);

  const scope = and(
    eq(placementTpoLeadActivities.collegeId, company.collegeId),
    eq(placementTpoLeads.collegeId, company.collegeId),
    eq(placementTpoLeads.companyRelationshipId, company.relationshipId),
    eq(placementTpoLeadActivities.type, "NOTE"),
    isNotNull(placementTpoLeadActivities.note),
    sql`length(trim(${placementTpoLeadActivities.note})) > 0`,
  );
  const [counter] = await db.select({ total: count() })
    .from(placementTpoLeadActivities)
    .innerJoin(placementTpoLeads, and(
      eq(placementTpoLeadActivities.leadId, placementTpoLeads.id),
      eq(placementTpoLeadActivities.collegeId, placementTpoLeads.collegeId),
    )).where(scope);

  const facts = await db.select({
    id: placementTpoLeadActivities.id,
    leadId: placementTpoLeads.id,
    leadName: placementTpoLeads.name,
    note: placementTpoLeadActivities.note,
    at: placementTpoLeadActivities.createdAt,
  }).from(placementTpoLeadActivities)
    .innerJoin(placementTpoLeads, and(
      eq(placementTpoLeadActivities.leadId, placementTpoLeads.id),
      eq(placementTpoLeadActivities.collegeId, placementTpoLeads.collegeId),
    )).where(scope)
    .orderBy(
      desc(placementTpoLeadActivities.createdAt),
      desc(placementTpoLeadActivities.id),
    )
    .limit(25).offset((input.page - 1) * 25);

  const total = counter?.total ?? 0;
  return {
    companyName: company.companyName,
    available: true as const,
    writeEnabled: process.env["DB09_TPO_API_READY"] === "DB09_VERIFIED",
    contacts,
    notes: projectTpoCompanyFeedback(facts),
    page: input.page,
    total,
    totalPages: Math.max(1, Math.ceil(total / 25)),
  };
}

export async function createTpoCompanyFeedback(
  context: RequestContext,
  rawCompanyId: unknown,
  raw: unknown,
) {
  const companyId = tpoCompanyFeedbackQuerySchema.shape.companyId.parse(rawCompanyId);
  const input = tpoCompanyFeedbackWriteSchema.parse(raw);
  const company = await companyScope(context, companyId);
  if (!company) return null;
  if (process.env["DB09_TPO_API_READY"] !== "DB09_VERIFIED") {
    throw new Error("DB09_TPO_API_NOT_READY");
  }
  const [lead] = await getDb().select({ id: placementTpoLeads.id })
    .from(placementTpoLeads).where(and(
      eq(placementTpoLeads.id, input.leadId),
      eq(placementTpoLeads.collegeId, company.collegeId),
      eq(placementTpoLeads.companyRelationshipId, company.relationshipId),
    )).limit(1);
  if (!lead) return null;
  const activity = await logTpoLeadActivity(context, lead.id, {
    collegeId: company.collegeId,
    type: "NOTE",
    note: input.note,
  }, company.relationshipId);
  if (!activity) return null;
  return { id: activity.id };
}
