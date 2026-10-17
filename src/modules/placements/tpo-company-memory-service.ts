import {
  and,
  asc,
  desc,
  eq,
  inArray,
  max,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  identityDeviceSessions,
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,placementCollegeRules,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  deriveCompanyDriveFacts,
  type DriveFactRow,
} from "./company-drive-facts-policy";
import { deriveTpoRecruiterLeadStage } from "./tpo-recruiter-lead-policy";
import { requirePlacementManageScope } from "./scope";
import { tpoCrmCollegeIdSchema } from "./tpo-crm-validation";
import {listCompanyShareHistory} from "./company-share/company-history-service";
import {getCompanyDriveCounts} from "./tpo-company-drive-counts-service";
import {companyPlacedCount,companyHiredByYear,type CountsAsPlacedPolicy} from "./company-placed-count-policy";

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

/** TPO-recruiters-08: prefer an explicit company relationship. Only allow a
 * name-based fallback when the normalized name maps to exactly one verified
 * college-scoped relationship. Ambiguous names cannot grant hiring evidence.
 */
export function resolveRecruiterLeadRelationship(
 lead:{companyRelationshipId:string|null;companyName?:string|null},
 jobs:readonly {relationshipId:string;companyName?:string|null}[],
):string|null{
 if(lead.companyRelationshipId)return lead.companyRelationshipId;
 const key=tpoCompanyKey(lead.companyName);
 if(!key)return null;
 const matches=new Set(jobs.filter(row=>tpoCompanyKey(row.companyName)===key)
   .map(row=>row.relationshipId));
 return matches.size===1?[...matches][0]:null;
}

/** Strictly college-scoped facts only; relationship association is checked first. */
export function deriveOwnRecruiterLeadStage(
  lead: Pick<LeadRow, "manualStage" | "recruiterUserId" |
    "inviteSentAt" | "inviteClickedAt" | "companyRelationshipId"> & {companyName?:string|null},
  jobs: readonly { jobId: string; relationshipId: string;companyName?:string|null;createdByUserId?:string|null }[],
  driveRows: readonly DriveFactRow[],
) {
  // Legacy groups the employer by normalized name, even when multiple
  // persisted company relationships share that name. A recruiter-owned
  // drive also counts when it is not attached to the lead's relationship.
  const companyKey=tpoCompanyKey(lead.companyName);
  const ownJobIds=new Set(jobs.filter(row=>
    (lead.recruiterUserId!==null && row.createdByUserId===lead.recruiterUserId) ||
    (lead.companyRelationshipId!==null
      ?row.relationshipId===lead.companyRelationshipId
      :Boolean(companyKey)&&tpoCompanyKey(row.companyName)===companyKey),
  ).map(row=>row.jobId));
  const facts = deriveCompanyDriveFacts(
    driveRows.filter((row) => ownJobIds.has(row.jobId)),
  );
  return deriveTpoRecruiterLeadStage({
    manualStage: lead.manualStage,
    hasRecruitedFact: facts.hasAcceptedOffer,
    hasPlannedDriveFact: facts.hasDrivePlanned,
    recruiterUserId: lead.recruiterUserId,
    inviteSentAt: lead.inviteSentAt ?? lead.inviteClickedAt,
  });
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
      offerKind:placementOffers.kind,
      membershipId:placementApplications.membershipId,
      joiningStatus: placementJoiningOutcomes.status,
      joiningDate:placementJoiningOutcomes.joiningDate,
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

/**
 * T-S1-02: canonical stage projection for the Engage roster. Each lead
 * inherits execution evidence only from its own persisted relationship.
 */
export async function getTpoRecruiterLeadStages(
  context: RequestContext, rawCollegeId: string,
): Promise<Map<string, ReturnType<typeof deriveTpoRecruiterLeadStage>>> {
  const source = await loadCompanySourceRows(context, rawCollegeId);
  const jobs = source.jobs.map(row => ({
    jobId: row.job.id, relationshipId: row.relationshipId,companyName:row.companyName,
    createdByUserId:row.job.createdByUserId,
  }));
  const driveRows = await loadDriveFacts(jobs.map(row => row.jobId));
  return new Map(source.leads.map(lead => [
    lead.id,
    deriveOwnRecruiterLeadStage(lead, jobs, driveRows),
  ]));
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
  const collegeRules=await getDb().select({placedAt:placementCollegeRules.countsAsPlacedAt})
   .from(placementCollegeRules).where(eq(placementCollegeRules.collegeId,rows.collegeId)).limit(1);
  const placedAt=(collegeRules[0]?.placedAt??"OFFER_RELEASED") as CountsAsPlacedPolicy;

  for (const group of groups.values()) {
    const driveRows = await loadDriveFacts(group.jobs.map((row) => row.job.id));
    const facts = deriveCompanyDriveFacts(driveRows);
    const linkedJobs = group.jobs.map((row) => ({
      jobId: row.job.id, relationshipId: row.relationshipId,companyName:row.companyName,
    }));
    out.push({
      key: group.key,
      name: group.name,
      aliases: [...group.aliases].filter((name) => name !== group.name),
      contacts: group.leads.length,
      people: group.leads.map(lead=>({id:lead.id,name:lead.name})),
      activeContacts: group.leads.filter(
        (lead) => !["NOT_NOW"].includes(deriveOwnRecruiterLeadStage(lead, linkedJobs, driveRows)),
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
  const driveRows = await loadDriveFacts(jobIds);
  const shareHistory=await listCompanyShareHistory(rows.collegeId,jobIds);
  const driveCounts=await getCompanyDriveCounts(rows.collegeId,jobIds);
  const facts = deriveCompanyDriveFacts(driveRows);
  const collegeRules=await getDb().select({placedAt:placementCollegeRules.countsAsPlacedAt})
   .from(placementCollegeRules).where(eq(placementCollegeRules.collegeId,rows.collegeId)).limit(1);
  const placedAt=(collegeRules[0]?.placedAt??"OFFER_RELEASED") as CountsAsPlacedPolicy;
  const linkedJobs = group.jobs.map((row) => ({
    jobId: row.job.id, relationshipId: row.relationshipId,companyName:row.companyName,
  }));
  const linkedRelationshipId=group.leads.find(lead=>lead.companyRelationshipId)?.companyRelationshipId;
  const [relatedCompany]=linkedRelationshipId?await getDb().select({
    companyId:placementCompanyRelationships.companyId,
  }).from(placementCompanyRelationships).where(and(
    eq(placementCompanyRelationships.id,linkedRelationshipId),
    eq(placementCompanyRelationships.collegeId,rows.collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE"),
  )).limit(1):[];
  const canonicalCompanyId=group.jobs[0]?.companyId??relatedCompany?.companyId??null;
  const leadIds = group.leads.map((lead) => lead.id);
  const activities =
    leadIds.length === 0
      ? []
      : await getDb()
          .select()
          .from(placementTpoLeadActivities)
          .where(and(eq(placementTpoLeadActivities.collegeId,rows.collegeId),
            inArray(placementTpoLeadActivities.leadId, leadIds)))
          .orderBy(
            desc(placementTpoLeadActivities.createdAt),
            desc(placementTpoLeadActivities.id),
          )
          .limit(200);

  const leadById = new Map(group.leads.map((lead) => [lead.id, lead]));
  const recruiterIds=[...new Set(group.leads.flatMap(lead=>lead.recruiterUserId?[lead.recruiterUserId]:[]))];
  const signins=recruiterIds.length
    ?await getDb().select({
      userId:identityDeviceSessions.userId,
      latest:max(identityDeviceSessions.createdAt),
    }).from(identityDeviceSessions)
      .where(inArray(identityDeviceSessions.userId,recruiterIds))
      .groupBy(identityDeviceSessions.userId)
    :[];
  const signinByUser=new Map(signins.map(row=>[row.userId,row.latest]));
  const people = group.leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    designation: lead.designation,
    email: lead.emailNorm,
    phone: lead.phoneNorm,
    stage: deriveOwnRecruiterLeadStage(lead, linkedJobs, driveRows),
    inviteSentAt: lead.inviteSentAt,
    inviteClickedAt: lead.inviteClickedAt,
    recruiterUserId: lead.recruiterUserId,
    recruiterLastLoginAt:lead.recruiterUserId?signinByUser.get(lead.recruiterUserId)?.toISOString()??null:null,
    inviteBouncedAt: lead.inviteBouncedAt,
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
    canonicalCompanyId,
    name: group.name,
    alsoTypedAs: [...group.aliases].filter((value) => value !== group.name),
    people,
    drives: group.jobs.map(({ job, companyName }) => ({
      id: job.id,
      jobTitle: job.title,
      companyName,
      status: job.status,
      applied: driveCounts.get(job.id)?.applied??0,
      offers: driveCounts.get(job.id)?.offers??0,
      createdAt: job.createdAt,
    })),
    drivesRan: facts.plannedDriveCount,
    acceptedOfferDrives: facts.acceptedOfferDriveCount,
    confirmedJoinedDrives: facts.confirmedJoinedDriveCount,
    studentsHired:companyPlacedCount(driveRows,placedAt),
    hiredPerYear:companyHiredByYear(driveRows),
    placedMetricStatus:placedAt==="SELECTED"?"SELECTION_LEDGER_UNAVAILABLE" as const:"COLLEGE_COUNTS_AS_PLACED_POLICY" as const,
    timeline,
    documents: shareHistory.items,
    documentsStatus: shareHistory.ready ? "READY" as const : "STORAGE_PENDING" as const,
  };
}
