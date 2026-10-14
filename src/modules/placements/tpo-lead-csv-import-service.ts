import "server-only";

import { getDb } from "@/db/client";
import { placementTpoLeadActivities, placementTpoLeads } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { createTpoLeadSchema, tpoCrmCollegeIdSchema } from "./tpo-crm-validation";
import { inferLegacyRecruiterCompanyName } from "./tpo-recruiter-lead-policy";
import {
  confirmedTpoLeadImportSchema,
  normalizeTpoLeadImportPhone,
  previewTpoLeadCsv,
  summarizeTpoLeadImport,
  type TpoLeadImportRowResult,
} from "./tpo-lead-csv-import-model";

/**
 * Every accepted CSV record and its staff-attributed NOTE activity are
 * inserted together inside ONE transaction. Invalid rows are explained;
 * email/phone collisions use registered partial unique indexes and return
 * duplicate without changing any existing lead. A failed audit rolls back
 * all inserted leads, not just the last row.
 */
export async function importTpoLeadsCsv(
  context: RequestContext,
  rawCollegeId: unknown,
  rawPayload: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const ownerMembershipId = context.membership.id;
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const college = await requirePlacementManageScope(context, collegeId);
  const payload = confirmedTpoLeadImportSchema.parse(rawPayload);
  const preview = previewTpoLeadCsv(payload.csv);

  const results = await getDb().transaction(async tx => {
    const rows: TpoLeadImportRowResult[] = [];
    const fileEmails = new Set<string>();
    const filePhones = new Set<string>();
    for (const item of preview.rows) {
      if (!item.lead) {
        rows.push({
          row: item.row, status: "invalid", reason: item.error ?? "Invalid CSV row", leadId: null,
        });
        continue;
      }
      const value = createTpoLeadSchema.parse({
        collegeId: college.id,
        name: item.lead.name,
        ...(item.lead.email ? { email: item.lead.email } : {}),
        ...(item.lead.phone ? { phone: item.lead.phone } : {}),
        ...(item.lead.companyName ? { companyName: item.lead.companyName } : {}),
        ...(item.lead.designation ? { designation: item.lead.designation } : {}),
        ...(item.lead.source ? { source: item.lead.source } : {}),
      });
      const emailNorm = value.email ?? null;
      const phoneNorm = normalizeTpoLeadImportPhone(value.phone ?? "");
      if ((emailNorm !== null && fileEmails.has(emailNorm)) ||
        (phoneNorm !== null && filePhones.has(phoneNorm))) {
        rows.push({
          row: item.row,
          status: "duplicate",
          reason: "Contact repeats an earlier valid row in this CSV",
          leadId: null,
        });
        continue;
      }
      if (emailNorm) fileEmails.add(emailNorm);
      if (phoneNorm) filePhones.add(phoneNorm);

      const [created] = await tx.insert(placementTpoLeads).values({
        collegeId: college.id,
        name: value.name,
        emailNorm,
        phoneNorm,
        designation: value.designation ?? null,
        companyName: value.companyName ?? inferLegacyRecruiterCompanyName(emailNorm),
        source: value.source ?? "MANUAL",
        ownerMembershipId,
      }).onConflictDoNothing().returning({ id: placementTpoLeads.id });

      if (!created) {
        rows.push({
          row: item.row,
          status: "duplicate",
          reason: "Email or phone already exists in this college",
          leadId: null,
        });
        continue;
      }

      await tx.insert(placementTpoLeadActivities).values({
        collegeId: college.id,
        leadId: created.id,
        type: "NOTE",
        isSystem: false,
        note: "Recruiter lead imported from CSV",
        createdByUserId: context.user.id,
      });
      rows.push({ row: item.row, status: "created", reason: null, leadId: created.id });
    }
    return rows;
  });

  return { results, counts: summarizeTpoLeadImport(results) };
}
