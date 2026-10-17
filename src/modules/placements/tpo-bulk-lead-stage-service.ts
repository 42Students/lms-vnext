import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, placementTpoLeadActivities, placementTpoLeads } from "@/db/schema";
import { type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {
  confirmedTpoBulkLeadStageSchema,
  decideTpoBulkLeadStage,
  summarizeTpoBulkLeadStages,
  type TpoBulkLeadStageResult,
} from "./tpo-bulk-lead-stage-model";

/**
 * DB09 registered manual stage only (NEW, CONTACTED, NOT_NOW).
 * Recruiter conversion is derived from account/grant lifecycle; this does
 * not forge a CONVERTED manual stage. All updates and author-attributed
 * immutable NOTE activity rows commit or roll back as a single transaction.
 */
export async function bulkChangeTpoLeadStages(
  context: RequestContext,
  rawPayload: unknown,
) {
  if (!context.membership) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const college = await requirePlacementManageScope(context, collegeId);
  const input = confirmedTpoBulkLeadStageSchema.parse(rawPayload);
  const sorted = [...input.selections].sort((a, b) => a.id.localeCompare(b.id));

  return getDb().transaction(async (tx) => {
    const resultById = new Map<string, TpoBulkLeadStageResult>();
    const changed: Array<{leadId:string;beforeStage:string;afterStage:string;beforeReason:string|null;afterReason:string|null;beforeUntil:string|null;afterUntil:string|null;afterUpdatedAt:string}> = [];
    for (const selected of sorted) {
      // Deterministic lock order; same-college lookup hides foreign UUIDs.
      const [current] = await tx.select()
        .from(placementTpoLeads)
        .where(and(
          eq(placementTpoLeads.collegeId, college.id),
          eq(placementTpoLeads.id, selected.id),
        ))
        .for("update").limit(1);
      const verdict = decideTpoBulkLeadStage(current ?? null, selected, input);
      if (verdict.status !== "updated") {
        resultById.set(selected.id, { leadId: selected.id, ...verdict });
        continue;
      }
      const [updated] = await tx.update(placementTpoLeads)
        .set(input.action === "CONTACTED"
          ? {
              manualStage: "CONTACTED",
              notNowReason: null,
              notNowUntil: null,
              updatedAt: new Date(),
            }
          : input.action === "NEW" ? {
              manualStage:"NEW",notNowReason:null,notNowUntil:null,updatedAt:new Date(),
            } : {
              manualStage: "NOT_NOW",
              notNowReason: input.reason,
              notNowUntil: input.revisitDate,
              updatedAt: new Date(),
            })
        .where(and(
          eq(placementTpoLeads.collegeId, college.id),
          eq(placementTpoLeads.id, selected.id),
        ))
        .returning({ id: placementTpoLeads.id,updatedAt:placementTpoLeads.updatedAt });
      if (!updated) throw new Error("TPO_CRM_BULK_STAGE_CONFLICT");
      if (!current) throw new Error("TPO_CRM_BULK_STAGE_MISSING_ORIGINAL");
      changed.push({leadId:selected.id,beforeStage:current.manualStage,afterStage:input.action,
       beforeReason:current.notNowReason,afterReason:input.action==="NOT_NOW"?input.reason:null,
       beforeUntil:current.notNowUntil,afterUntil:input.action==="NOT_NOW"?input.revisitDate:null,
       afterUpdatedAt:updated.updatedAt.toISOString()});
      await tx.insert(placementTpoLeadActivities).values({
        collegeId: college.id,
        leadId: updated.id,
        type: "NOTE",
        isSystem: false,
        note: input.action === "CONTACTED"
          ? "Bulk manual stage changed to Contacted"
          : input.action === "NEW"?"Bulk manual stage restored to New":
           "Bulk manual stage changed to Not Now",
        createdByUserId: context.user.id,
      });
      resultById.set(selected.id, {
        leadId: selected.id, status: "updated", reason: null,
      });
    }
    const results = input.selections.map((selection) => {
      const result = resultById.get(selection.id);
      if (!result) throw new Error("TPO_CRM_BULK_STAGE_RESULT_MISSING");
      return result;
    });
    const counts=summarizeTpoBulkLeadStages(results);
    const [runAudit]=await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:college.id,
      actorUserId:context.user.id,actorMembershipId:context.membership!.id,
      module:"PLACEMENTS",eventType:"PLACEMENTS_RECRUITER_BULK_STAGE",
      subjectType:"placement_tpo_lead",subjectId:results[0].leadId,
      summary:"Bulk recruiter lead stage update",
      metadata:{action:input.action,leadIds:results.map(r=>r.leadId),counts,undoVersion:1,changed},
    }).returning({id:activityEvents.id});
    if(!runAudit)throw new Error("TPO_RECRUITER_BULK_AUDIT_MISSING");
    return { results, counts, runAuditId:runAudit.id };
  });
}
