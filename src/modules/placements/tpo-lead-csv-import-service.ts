import "server-only";

import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { activityEvents, inAppNotifications,collegeMemberships,membershipRoles,users, placementTpoLeadActivities, placementTpoLeads } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { createTpoLeadSchema, tpoCrmCollegeIdSchema } from "./tpo-crm-validation";
import { inferLegacyRecruiterCompanyName } from "./tpo-recruiter-lead-policy";
import {
  confirmedTpoLeadImportSchema,
  TPO_LEAD_CSV_MAX_CHARACTERS,
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
    const skippedRows=new Set(payload.skipRows??[]);
    for (const item of preview.rows) {
      if(skippedRows.has(item.row)){
        rows.push({row:item.row,status:"skipped",reason:"Skipped by placement cell",leadId:null});
        continue;
      }
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
        source: value.source ?? "IMPORT",
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
    // A single college-scoped immutable audit line represents the *actual*
    // result. Never log raw CSV contents, email addresses or telephone numbers.
    const counts=summarizeTpoLeadImport(rows);
    const created=rows.filter(row=>row.status==="created");
    if(created.length){
     const firstCreated=created[0];
     if(!firstCreated?.leadId)throw new Error("Imported lead audit requires a created lead");
     const [event]=await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:college.id,
      actorUserId:context.user.id,actorMembershipId:ownerMembershipId,
      module:"PLACEMENTS",eventType:"RECRUITER_LEADS_IMPORTED",
      subjectType:"placement_tpo_lead",subjectId:firstCreated.leadId,
      summary:"Recruiter leads imported",
      metadata:{counts,importedLeadIds:created.map(row=>row.leadId)},
     }).returning({id:activityEvents.id});
     if(event){
      const team=await tx.selectDistinct({userId:collegeMemberships.userId})
       .from(collegeMemberships)
       .innerJoin(users,eq(users.id,collegeMemberships.userId))
       .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"TPO")))
       .where(and(eq(collegeMemberships.collegeId,college.id),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"))).limit(501);
      if(team.length>500)throw new Error("TPO_NOTIFICATION_RECIPIENT_LIMIT");
      if(team.length)await tx.insert(inAppNotifications).values(team.map(({userId})=>({
       userId,eventId:event.id,title:"Recruiter leads imported",
       body:created.length+" new recruiter leads were added to Engage.",
       actionHref:"/tpo/recruiters",
      }))).onConflictDoNothing();
     }
    }
    return rows;
  });

  return { results, counts: summarizeTpoLeadImport(results) };
}

/**
 * Authenticated, tenant-scoped read-only import preview. This is advisory:
 * unique indexes still resolve concurrent inserts when the user confirms.
 * Batch the queries to stay within PostgreSQL parameter limits for 5000 rows.
 */
export async function previewTpoLeadImportCollisions(
  context: RequestContext,
  rawCollegeId: unknown,
  rawPayload: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const { csv } = z.object({
    csv: z.string().min(1).max(TPO_LEAD_CSV_MAX_CHARACTERS),
  }).strict().parse(rawPayload);
  const preview = previewTpoLeadCsv(csv);
  const emails = [...new Set(preview.rows.flatMap(row =>
    row.lead?.email ? [row.lead.email.trim().toLowerCase()] : [],
  ))];
  const phones = [...new Set(preview.rows.flatMap(row =>
    row.lead?.phone ? [normalizeTpoLeadImportPhone(row.lead.phone)].filter(
      (value): value is string => Boolean(value),
    ) : [],
  ))];
  const matched: Array<{ id: string; name: string; emailNorm: string | null; phoneNorm: string | null }> = [];
  for (let cursor = 0; cursor < Math.max(emails.length, phones.length); cursor += 300) {
    const conditions = [
      ...(emails.slice(cursor, cursor + 300).length
        ? [inArray(placementTpoLeads.emailNorm, emails.slice(cursor, cursor + 300))]
        : []),
      ...(phones.slice(cursor, cursor + 300).length
        ? [inArray(placementTpoLeads.phoneNorm, phones.slice(cursor, cursor + 300))]
        : []),
    ];
    if (!conditions.length) continue;
    const rows = await getDb().select({
      id: placementTpoLeads.id,
      name: placementTpoLeads.name,
      emailNorm: placementTpoLeads.emailNorm,
      phoneNorm: placementTpoLeads.phoneNorm,
    }).from(placementTpoLeads).where(and(
      eq(placementTpoLeads.collegeId, collegeId),
      or(...conditions),
    ));
    matched.push(...rows);
  }
  const emailOwners = new Map(matched.flatMap(row =>
    row.emailNorm === null ? [] : [[row.emailNorm, row] as const]));
  const phoneOwners = new Map(matched.flatMap(row =>
    row.phoneNorm === null ? [] : [[row.phoneNorm, row] as const]));
  return {
    collisions: preview.rows.flatMap(item => {
      if (!item.lead) return [];
      const found = (item.lead.email && emailOwners.get(item.lead.email.toLowerCase())) ||
        (item.lead.phone && phoneOwners.get(normalizeTpoLeadImportPhone(item.lead.phone) ?? ""));
      return found ? [{ row: item.row, leadId: found.id, name: found.name }] : [];
    }),
  };
}
