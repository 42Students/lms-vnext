import {
  and,
  asc,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { deriveCompanyDriveFacts } from "./company-drive-facts-policy";
import { requirePlacementManageScope } from "./scope";
import { tpoCrmCollegeIdSchema } from "./tpo-crm-validation";

export class TpoCompanyMemoryError extends Error {
  constructor(
    readonly code: "TPO_COMPANY_NOT_FOUND" | "TPO_COMPANY_NAME_REQUIRED",
  ) {
    super(code);
    this.name = "TpoCompanyMemoryError";
  }
}

/**
 * Matches the legacy TPO Company Memory grouping rule: ignore case,
 * punctuation, whitespace and trailing legal entity suffixes.
 */
export function tpoCompanyKey(name: string | null | undefined) {
  if (!name) return "";
  const fallback = name.trim().toLowerCase();
  let key = fallback
    .replace(/&amp;/gi, "&")
    .replace(/[^a-z0-9& ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let previous = "";
  while (key !== previous) {
    previous = key;
    key = key
      .replace(
        /\s+(pvt|private|ltd|limited|llp|inc|incorporated|corp|corporation|co|company|plc)$/i,
        "",
      )
      .trim();
  }
  return key || fallback;
}

type LeadRow = typeof placementTpoLeads.$inferSelect;

function leadStage(
  lead: LeadRow,
  facts: ReturnType<typeof deriveCompanyDriveFacts>,
) {
  if (lead.manualStage === "NOT_NOW") return "NOT_NOW";
  if (facts.hasDrivePlanned) return "DRIVE_PLANNED";
  if (lead.recruiterUserId) return "JOINED";
  if (lead.inviteSentAt || lead.inviteClickedAt) return "INVITED";
  return lead.manualStage;
}

async function loadCompanySourceRows(
  context: RequestContext,
  rawCollegeId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  await requirePlacementManageScope(context, collegeId);
  const db = getDb();

  const [leads, jobs] = await Promise.all([
    db
      .select()
      .from(placementTpoLeads)
      .where(eq(placementTpoLeads.collegeId, collegeId))
      .orderBy(desc(placementTpoLeads.updatedAt)),
    db
      .select({
        job: placementJobs,
        relationshipId: placementCompanyRelationships.id,
        companyId: placementCompanies.id,
        companyName: placementCompanies.name,
        companyLogoObjectPath: placementCompanies.logoObjectPath,
      })
      .from(placementJobs)
      .innerJoin(
        placementCompanyRelationships,
        and(
          eq(
            placementCompanyRelationships.id,
            placementJobs.companyRelationshipId,
          ),
          eq(
            placementCompanyRelationships.collegeId,
            placementJobs.collegeId,
          ),
        ),
      )
      .innerJoin(
        placementCompanies,
        eq(
          placementCompanies.id,
          placementCompanyRelationships.companyId,
        ),
      )
      .where(eq(placementJobs.collegeId, collegeId))
      .orderBy(desc(placementJobs.createdAt)),
  ]);

  return { collegeId, leads, jobs };
}

async function loadDriveFacts(jobIds: string[]) {
  if (jobIds.length === 0) return [];
  const db = getDb();
  const rows = await db
    .select({
      jobId: placementJobs.id,
      jobStatus: placementJobs.status,
      archivedAt: placementJobs.archivedAt,
      offerStatus: placementOffers.status,
      joiningStatus: placementJoiningOutcomes.status,
    })
    .from(placementJobs)
    .leftJoin(
      placementApplications,
      eq(placementApplications.jobId, placementJobs.id),
    )
    .leftJoin(
      placementOffers,
      eq(placementOffers.applicationId, placementApplications.id),
    )
    .leftJoin(
      placementJoiningOutcomes,
      eq(placementJoiningOutcomes.offerId, placementOffers.id),
    )
    .where(inArray(placementJobs.id, jobIds));
  return rows;
}

function matchingCompanies(
  rows: Awaited<ReturnType<typeof loadCompanySourceRows>>,
) {
  const groups = new Map<
    string,
    {
      key: string;
      name: string;
      aliases: Set<string>;
      leads: LeadRow[];
      jobs: (typeof rows.jobs)[number][];
    }
  >();

  const ensure = (name: string) => {
    const key = tpoCompanyKey(name);
    const found = groups.get(key);
    if (found) {
      found.aliases.add(name.trim());
      return found;
    }
    const created = {
      key,
      name: name.trim(),
      aliases: new Set([name.trim()]),
      leads: [] as LeadRow[],
      jobs: [] as (typeof rows.jobs)[number][],
    };
    groups.set(key, created);
    return created;
  };

  for (const lead of rows.leads) {
    if (!lead.companyName?.trim()) continue;
    ensure(lead.companyName).leads.push(lead);
  }
  for (const job of rows.jobs) {
    if (!job.companyName?.trim()) continue;
    ensure(job.companyName).jobs.push(job);
  }
  return groups;
}

export async function listTpoCompanies(
  context: RequestContext,
  collegeIdInput: string,
) {
  const rows = await loadCompanySourceRows(context, collegeIdInput);
  const groups = matchingCompanies(rows);
  const out = [];

  for (const group of groups.values()) {
    const facts = deriveCompanyDriveFacts(
      await loadDriveFacts(group.jobs.map((row) => row.job.id)),
    );
    out.push({
      key: group.key,
      name: group.name,
      aliases: [...group.aliases].filter((name) => name !== group.name),
      contacts: group.leads.length,
      activeContacts: group.leads.filter(
        (lead) => !["NOT_NOW"].includes(leadStage(lead, facts)),
      ).length,
      drivesRan: facts.plannedDriveCount,
      acceptedOfferDrives: facts.acceptedOfferDriveCount,
      confirmedJoinedDrives: facts.confirmedJoinedDriveCount,
      studentsPlaced: null as number | null,
      studentsPlacedEvidence: "PENDING_W04_COUNTS_AS_PLACED_POLICY" as const,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTpoCompanyMemory(
  context: RequestContext,
  collegeIdInput: string,
  companyNameInput: string,
) {
  const name = companyNameInput.trim();
  if (!name) {
    throw new TpoCompanyMemoryError("TPO_COMPANY_NAME_REQUIRED");
  }

  const rows = await loadCompanySourceRows(context, collegeIdInput);
  const group = matchingCompanies(rows).get(tpoCompanyKey(name));
  if (!group) {
    throw new TpoCompanyMemoryError("TPO_COMPANY_NOT_FOUND");
  }

  const jobIds = group.jobs.map((row) => row.job.id);
  const facts = deriveCompanyDriveFacts(await loadDriveFacts(jobIds));
  const leadIds = group.leads.map((lead) => lead.id);
  const activities =
    leadIds.length === 0
      ? []
      : await getDb()
          .select()
          .from(placementTpoLeadActivities)
          .where(inArray(placementTpoLeadActivities.leadId, leadIds))
          .orderBy(
            desc(placementTpoLeadActivities.createdAt),
            desc(placementTpoLeadActivities.id),
          )
          .limit(200);

  const leadById = new Map(group.leads.map((lead) => [lead.id, lead]));
  const people = group.leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    designation: lead.designation,
    email: lead.emailNorm,
    phone: lead.phoneNorm,
    stage: leadStage(lead, facts),
    source: lead.source,
    updatedAt: lead.updatedAt,
  }));

  const timeline = activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    outcome: activity.outcome,
    note: activity.note,
    isSystem: activity.isSystem,
    createdAt: activity.createdAt,
    person: leadById.get(activity.leadId)?.name ?? "Recruiter contact",
  }));

  return {
    key: group.key,
    name: group.name,
    alsoTypedAs: [...group.aliases].filter((value) => value !== group.name),
    people,
    drives: group.jobs.map(({ job, companyName }) => ({
      id: job.id,
      jobTitle: job.title,
      companyName,
      status: job.status,
      createdAt: job.createdAt,
    })),
    drivesRan: facts.plannedDriveCount,
    acceptedOfferDrives: facts.acceptedOfferDriveCount,
    confirmedJoinedDrives: facts.confirmedJoinedDriveCount,
    studentsHired: null as number | null,
    hiredPerYear: [] as Array<{ year: string; hired: number }>,
    placedMetricStatus: "PENDING_W04_COUNTS_AS_PLACED_POLICY" as const,
    timeline,
    documents: [] as never[],
    documentsStatus: "PENDING_DB09_SHARE_LINK_PERSISTENCE" as const,
  };
}
