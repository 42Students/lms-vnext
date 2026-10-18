import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  placementCompanies, placementCompanyRelationships,
  placementTpoLeads, placementTpoLeadActivities,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { companyContactChangeNote, companyContactPersonSchema } from "./tpo-company-person-model";
import { TpoCrmError } from "./tpo-crm-service";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {requireTpoJobActor} from "./tpo-job-write-base";

export class TpoCompanyPersonStale extends Error {
  constructor() { super("TPO_COMPANY_PERSON_STALE"); this.name = "TpoCompanyPersonStale"; }
}

async function authorize(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  // Do not let a cached TPO role enumerate private contact emails after
  // membership revocation or use an old session to target another college.
  const liveCollegeId=await requireTpoBatchActor(context);
  if(liveCollegeId!==collegeId)throw new AuthorizationError("placements.manage");
  await requirePlacementManageScope(context, collegeId);
  return { collegeId, actorUserId: context.user.id, ownerMembershipId: membership.id };
}

export async function listTpoCompanyPeople(context: RequestContext, rawId: unknown) {
  const { collegeId } = await authorize(context);
  const companyId = z.string().uuid().parse(rawId);
  const db = getDb();
  const [company] = await db.select({
    id: placementCompanyRelationships.id, name: placementCompanies.name,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanyRelationships.companyId, companyId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
    )).limit(1);
  if (!company) return null;
  const contacts = await db.select({
    id: placementTpoLeads.id, name: placementTpoLeads.name,
    email: placementTpoLeads.emailNorm, designation: placementTpoLeads.designation,
    updatedAt: placementTpoLeads.updatedAt,
    unsubscribedAt: placementTpoLeads.unsubscribedAt,
    recruiterUserId: placementTpoLeads.recruiterUserId,
  }).from(placementTpoLeads).where(and(
    eq(placementTpoLeads.collegeId, collegeId),
    eq(placementTpoLeads.companyRelationshipId, company.id),
  )).orderBy(placementTpoLeads.name, placementTpoLeads.id);
  return { companyId, name: company.name, contacts: contacts.map(item => ({
    id: item.id, name: item.name, email: item.email,
    designation: item.designation, updatedAt: item.updatedAt.toISOString(),
    editable: !item.unsubscribedAt && !item.recruiterUserId,
  })) };
}

/**
 * DB09's college-scoped lead is the migrated contact person record.
 * Caller never chooses company relationship/owner college, and all
 * inserts/updates append one immutable actor-attributed activity in Tx.
 */
export async function saveTpoCompanyPerson(
  context: RequestContext, rawCompanyId: unknown, rawInput: unknown,
) {
  const { collegeId, actorUserId, ownerMembershipId } = await authorize(context);
  const companyId = z.string().uuid().parse(rawCompanyId);
  const input = companyContactPersonSchema.parse(rawInput);
  const db = getDb();
  try {
    return await db.transaction(async tx => {
    // Hold the persisted team role lock until contact changes and immutable
    // lead activity both commit (or roll back).
    await requireTpoJobActor(tx,context);
    const [relationship] = await tx.select({
      id: placementCompanyRelationships.id,
    }).from(placementCompanyRelationships).where(and(
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanyRelationships.companyId, companyId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
    )).for("share").limit(1);
    if (!relationship) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");

    if (input.action === "CREATE") {
      const [created] = await tx.insert(placementTpoLeads).values({
        collegeId, companyRelationshipId: relationship.id,
        name: input.name, emailNorm: input.email,
        designation: input.designation || null,
        companyName: (await tx.select({ name: placementCompanies.name })
          .from(placementCompanies)
          .where(eq(placementCompanies.id, companyId)).limit(1))[0]?.name ?? null,
        ownerMembershipId, source: "MANUAL",
      }).onConflictDoNothing().returning({
        id: placementTpoLeads.id, updatedAt: placementTpoLeads.updatedAt,
      });
      if (!created) throw new TpoCrmError("TPO_CRM_LEAD_DUPLICATE");
      await tx.insert(placementTpoLeadActivities).values({
        collegeId, leadId: created.id, type: "NOTE", isSystem: false,
        note: companyContactChangeNote("CREATE"), createdByUserId: actorUserId,
      });
      return { id: created.id, updatedAt: created.updatedAt.toISOString() };
    }

    const [current] = await tx.select({
      id: placementTpoLeads.id, updatedAt: placementTpoLeads.updatedAt,
      name: placementTpoLeads.name, email: placementTpoLeads.emailNorm,
      designation: placementTpoLeads.designation,
    }).from(placementTpoLeads).where(and(
      eq(placementTpoLeads.collegeId, collegeId),
      eq(placementTpoLeads.companyRelationshipId, relationship.id),
      eq(placementTpoLeads.id, input.leadId),
      isNull(placementTpoLeads.unsubscribedAt),
      isNull(placementTpoLeads.recruiterUserId),
    )).for("update").limit(1);
    if (!current) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    if (current.updatedAt.toISOString() !== new Date(input.expectedUpdatedAt).toISOString()) {
      throw new TpoCompanyPersonStale();
    }
    if (current.name === input.name && current.email === input.email &&
        (current.designation ?? "") === (input.designation ?? "")) {
      return { id: current.id, updatedAt: current.updatedAt.toISOString(), unchanged: true };
    }
    const timestamp = new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1));
    const [updated] = await tx.update(placementTpoLeads).set({
      name: input.name, emailNorm: input.email,
      designation: input.designation || null, updatedAt: timestamp,
    }).where(and(
      eq(placementTpoLeads.id, current.id),
      eq(placementTpoLeads.collegeId, collegeId),
    )).returning({ id: placementTpoLeads.id });
    if (!updated) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    await tx.insert(placementTpoLeadActivities).values({
      collegeId, leadId: updated.id, type: "NOTE", isSystem: false,
      note: companyContactChangeNote("EDIT"), createdByUserId: actorUserId,
    });
    return { id: updated.id, updatedAt: timestamp.toISOString(), unchanged: false };
    });
  } catch (error) {
    // Convert only the known college contact duplicate-email constraint;
    // other database faults must never be mislabeled as duplicates.
    let cause: unknown = error;
    for (let depth = 0; depth < 4 && cause && typeof cause === "object"; depth++) {
      const pg = cause as { code?: unknown; constraint?: unknown; cause?: unknown };
      if (pg.code === "23505" &&
          pg.constraint === "placement_tpo_leads_college_email_uq") {
        throw new TpoCrmError("TPO_CRM_LEAD_DUPLICATE");
      }
      cause = pg.cause;
    }
    throw error;
  }
}
