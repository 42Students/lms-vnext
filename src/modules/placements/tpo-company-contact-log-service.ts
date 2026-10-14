import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  placementCompanies,
  placementCompanyRelationships,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";
import { projectTpoCompanyContactRows } from "./tpo-operations-export-model";

export const tpoCompanyContactLogQuerySchema = z.object({
  companyId: z.string().uuid(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  type: z.enum([
    "ALL", "CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE", "SYSTEM",
  ]).default("ALL"),
}).strict();

/**
 * Source is registered DB09 CRM activity persistence; each row is joined
 * to a canonical company relationship in the signed-in TPO's own college.
 * Unknown or foreign company IDs resolve identically to null.
 */
export async function getTpoCompanyContactLog(
  context: RequestContext,
  rawQuery: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const query = tpoCompanyContactLogQuerySchema.parse(rawQuery);

  const db = getDb();
  const [company] = await db
    .select({
      name: placementCompanies.name,
      relationshipId: placementCompanyRelationships.id,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(and(
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanies.id, query.companyId),
    ))
    .limit(1);

  if (!company) return null;

  const available =
    await placementTableExists("placement_tpo_leads") &&
    await placementTableExists("placement_tpo_lead_activities");

  if (!available) {
    return {
      companyName: company.name,
      companyId: query.companyId,
      available: false as const,
      rows: [],
      page: query.page,
      total: null,
      pages: null,
      type: query.type,
    };
  }

  const scope = and(
    eq(placementTpoLeadActivities.collegeId, collegeId),
    eq(placementTpoLeads.collegeId, collegeId),
    eq(placementTpoLeads.companyRelationshipId, company.relationshipId),
    query.type === "ALL"
      ? undefined
      : eq(placementTpoLeadActivities.type, query.type),
  );
  const [counter] = await db
    .select({ total: count() })
    .from(placementTpoLeadActivities)
    .innerJoin(
      placementTpoLeads,
      and(
        eq(placementTpoLeadActivities.leadId, placementTpoLeads.id),
        eq(placementTpoLeadActivities.collegeId, placementTpoLeads.collegeId),
      ),
    )
    .where(scope);

  const facts = await db
    .select({
      id: placementTpoLeadActivities.id,
      leadName: placementTpoLeads.name,
      type: placementTpoLeadActivities.type,
      outcome: placementTpoLeadActivities.outcome,
      createdAt: placementTpoLeadActivities.createdAt,
    })
    .from(placementTpoLeadActivities)
    .innerJoin(
      placementTpoLeads,
      and(
        eq(placementTpoLeadActivities.leadId, placementTpoLeads.id),
        eq(placementTpoLeadActivities.collegeId, placementTpoLeads.collegeId),
      ),
    )
    .where(scope)
    .orderBy(
      desc(placementTpoLeadActivities.createdAt),
      desc(placementTpoLeadActivities.id),
    )
    .limit(25)
    .offset((query.page - 1) * 25);

  const total = counter?.total ?? 0;
  return {
    companyName: company.name,
    companyId: query.companyId,
    available: true as const,
    rows: projectTpoCompanyContactRows(facts),
    page: query.page,
    total,
    pages: Math.max(1, Math.ceil(total / 25)),
    type: query.type,
  };
}
