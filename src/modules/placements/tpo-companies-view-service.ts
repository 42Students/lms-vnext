import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
  placementTpoLeadActivities,
  placementTpoLeads,
  users,
} from "@/db/schema";

import type { RequestContext } from "@/modules/identity/context";
import { listPlacementCompanies } from "./company-service";
import { requirePlacementManageScope } from "./scope";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import { placementTableExists } from "./staged-tables";
import {
  buildTpoCompanyRows,
  buildTpoCompanyTimeline,
  filterTpoCompanyRows,
  type TpoCompanyActivity,
  type TpoCompanyBase,
  type TpoCompanyContact,
  type TpoCompanyDrive,
  type TpoCompanyOffer,
} from "./tpo-companies-view-model";

const uuid = z.string().uuid();

/** Authorized global employer picker: never return another college’s CRM details. */
export async function searchTpoCompanyCandidates(context:RequestContext,raw:unknown){
 const input=z.object({collegeId:z.string().uuid(),q:z.string().trim().min(2).max(120)}).strict().parse(raw);
 const liveCollege=await requireTpoBatchActor(context);
 if(liveCollege!==input.collegeId)throw new AuthorizationError("placements.manage");
 await requirePlacementManageScope(context,input.collegeId);
 const term=input.q.toLocaleLowerCase("en-US");
 const pattern="%"+term.replace(/[%_\\]/g,"\\$&")+"%";
 const rows=await getDb().select({
  companyId:placementCompanies.id,name:placementCompanies.name,
  primaryDomain:placementCompanies.primaryDomain,websiteUrl:placementCompanies.websiteUrl,
  relationshipId:placementCompanyRelationships.id,
 }).from(placementCompanies).leftJoin(placementCompanyRelationships,and(
  eq(placementCompanyRelationships.companyId,placementCompanies.id),
  eq(placementCompanyRelationships.collegeId,input.collegeId),
  eq(placementCompanyRelationships.status,"ACTIVE"),
  isNull(placementCompanyRelationships.archivedAt),
 )).where(and(
  eq(placementCompanies.status,"ACTIVE"),isNull(placementCompanies.archivedAt),
  or(ilike(placementCompanies.name,pattern),ilike(placementCompanies.primaryDomain,pattern)),
 )).orderBy(
  sql`case when lower(trim(${placementCompanies.name})) = ${term} then 0
    when lower(${placementCompanies.primaryDomain}) = ${term} then 1
    when lower(${placementCompanies.name}) like ${term+"%"} then 2 else 3 end`,
  asc(placementCompanies.name),asc(placementCompanies.id),
 ).limit(50);
 // Distinct domains can legitimately share display names. Canonical IDs
 // are the identity; active company/college relationships are unique.
 const unique=[...new Map(rows.map(row=>[row.companyId,row])).values()];
 return {items:unique.map(row=>({
  companyId:row.companyId,name:row.name,primaryDomain:row.primaryDomain,
  websiteUrl:row.websiteUrl,relationshipId:row.relationshipId,
  linkedToCollege:row.relationshipId!==null,
 })),limit:50};
}


export const tpoCompaniesQuerySchema = z
  .object({
    collegeId: uuid,
    search: z.string().trim().max(150).optional(),
    sort: z.enum(["NAME","CONTACTS","DRIVES","JOINS"]).default("NAME"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const tpoCompanyDetailQuerySchema = z
  .object({
    collegeId: uuid,
    companyId: uuid,
  })
  .strict();

async function loadCompanySources(
  context: RequestContext,
  collegeId: string,
) {
  // The placement company service also performs this authorization.
  // Require it here before any optional CRM/table discovery reads.
  // Authenticate the live placement-team membership before even probing
  // college company/CRM source availability for a stale cached session.
  const liveCollegeId=await requireTpoBatchActor(context);
  if(liveCollegeId!==collegeId)throw new AuthorizationError("placements.manage");
  await requirePlacementManageScope(context, collegeId);

  const relationships = await listPlacementCompanies(
    context,
    collegeId,
  );

  const companies: TpoCompanyBase[] = relationships.map(
    (relationship) => ({
      companyId: relationship.companyId,
      relationshipId: relationship.relationshipId,
      name: relationship.name,
      websiteUrl: relationship.websiteUrl,
    }),
  );

  const db = getDb();

  const contactsAvailable = await placementTableExists(
    "placement_tpo_leads",
  );

  const relationshipIds = companies.map(
    (company) => company.relationshipId,
  );

  const [contactRows, driveRows] = await Promise.all([
    contactsAvailable
      ? db
          .select({
            id: placementTpoLeads.id,
            companyRelationshipId:
              placementTpoLeads.companyRelationshipId,
            companyName: placementTpoLeads.companyName,
            name: placementTpoLeads.name,
            designation: placementTpoLeads.designation,
            email: placementTpoLeads.emailNorm,
            phone: placementTpoLeads.phoneNorm,
            stage: placementTpoLeads.manualStage,
            source: placementTpoLeads.source,
            updatedAt: placementTpoLeads.updatedAt,
          })
          .from(placementTpoLeads)
          .where(eq(placementTpoLeads.collegeId, collegeId))
      : Promise.resolve([]),

    relationshipIds.length > 0
      ? db
          .select({
            id: placementJobs.id,
            relationshipId:
              placementJobs.companyRelationshipId,
            title: placementJobs.title,
            status: placementJobs.status,
            employmentType: placementJobs.employmentType,
            createdAt: placementJobs.createdAt,
            publishedAt: placementJobs.publishedAt,
            closedAt: placementJobs.closedAt,
            archivedAt: placementJobs.archivedAt,
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
                collegeId,
              ),
            ),
          )
          .where(
            and(
              eq(placementJobs.collegeId, collegeId),
              inArray(
                placementJobs.companyRelationshipId,
                relationshipIds,
              ),
            ),
          )
          .orderBy(desc(placementJobs.createdAt))
      : Promise.resolve([]),
  ]);

  const contacts: TpoCompanyContact[] = contactRows;
  const drives: TpoCompanyDrive[] = driveRows;

  const jobIds = drives.map((drive) => drive.id);

  const offers: TpoCompanyOffer[] =
    jobIds.length > 0
      ? await db
          .select({
            id: placementOffers.id,
            jobId: placementJobs.id,
            membershipId: placementApplications.membershipId,
            candidateName: users.displayName,
            roleTitle: placementOffers.roleTitle,
            status: placementOffers.status,
            annualCtcInr: placementOffers.annualCtcInr,
            issuedAt: placementOffers.issuedAt,
            respondedAt: placementOffers.respondedAt,
            joiningStatus: placementJoiningOutcomes.status,
            joiningRecordedAt:
              placementJoiningOutcomes.recordedAt,
          })
          .from(placementOffers)
          .innerJoin(
            placementApplications,
            eq(
              placementApplications.id,
              placementOffers.applicationId,
            ),
          )
          .innerJoin(
            placementJobs,
            eq(
              placementJobs.id,
              placementApplications.jobId,
            ),
          )
          .innerJoin(
            placementCompanyRelationships,
            and(
              eq(
                placementCompanyRelationships.id,
                placementJobs.companyRelationshipId,
              ),
              eq(
                placementCompanyRelationships.collegeId,
                collegeId,
              ),
            ),
          )
          .innerJoin(
            collegeMemberships,
            and(
              eq(
                collegeMemberships.id,
                placementApplications.membershipId,
              ),
              eq(collegeMemberships.collegeId, collegeId),
            ),
          )
          .innerJoin(
            users,
            eq(users.id, collegeMemberships.userId),
          )
          .leftJoin(
            placementJoiningOutcomes,
            eq(
              placementJoiningOutcomes.offerId,
              placementOffers.id,
            ),
          )
          .where(
            and(
              eq(placementJobs.collegeId, collegeId),
              inArray(placementJobs.id, jobIds),
            ),
          )
      : [];

  return {
    companies,
    contacts,
    drives,
    offers,
    contactsAvailable,
  };
}

/**
 * Read-only companies directory.
 *
 * Canonical companies have an active company-college relationship.
 * CRM-only company names appear separately and never inherit a
 * canonical company's drive or offer counts by fuzzy name matching.
 */
export async function getTpoCompaniesView(
  context: RequestContext,
  raw: unknown,
) {
  const input = tpoCompaniesQuerySchema.parse(raw);
  const sources = await loadCompanySources(
    context,
    input.collegeId,
  );

  const all = buildTpoCompanyRows(sources);

  return {
    collegeId: input.collegeId,
    contactsAvailable: sources.contactsAvailable,
    totalCompanies: all.length,
    canonicalCompanies: all.filter(
      (company) => !company.unlinkedLeadGroup,
    ).length,
    unlinkedLeadGroups: all.filter(
      (company) => company.unlinkedLeadGroup,
    ).length,
    page: filterTpoCompanyRows(all, input),
  };
}

/** Use one authorized college read for the complete bounded directory export. */
export async function exportTpoCompanyDirectory(
 context:RequestContext,raw:unknown,
){
 const input=tpoCompaniesQuerySchema.parse(raw);
 const source=await loadCompanySources(context,input.collegeId);
 const all=buildTpoCompanyRows(source);
 const result=filterTpoCompanyRows(all,{...input,page:1,pageSize:2001});
 if(result.total>2000)throw new Error("COMPANY_EXPORT_TOO_LARGE");
 return result.items;
}

/**
 * Canonical UUID detail view. The authorized relationship must
 * belong to this college. Unknown and cross-tenant IDs both
 * resolve to null; callers can render the same not-found state.
 */
export async function getTpoCompanyDetailView(
  context: RequestContext,
  raw: unknown,
) {
  const input = tpoCompanyDetailQuerySchema.parse(raw);
  const sources = await loadCompanySources(
    context,
    input.collegeId,
  );

  const company = buildTpoCompanyRows(sources).find(
    (row) => row.companyId === input.companyId,
  );

  if (!company || !company.relationshipId) return null;

  const contacts = sources.contacts.filter(
    (contact) =>
      contact.companyRelationshipId === company.relationshipId,
  );

  const drives = sources.drives.filter(
    (drive) =>
      drive.relationshipId === company.relationshipId,
  );

  const jobIds = new Set(drives.map((drive) => drive.id));

  const offers = sources.offers.filter(
    (offer) => jobIds.has(offer.jobId),
  );

  const activitiesAvailable =
    sources.contactsAvailable &&
    (await placementTableExists("placement_tpo_lead_activities"));

  const contactIds = contacts.map((contact) => contact.id);

  const activities: TpoCompanyActivity[] =
    activitiesAvailable && contactIds.length > 0
      ? await getDb()
          .select({
            id: placementTpoLeadActivities.id,
            leadId: placementTpoLeadActivities.leadId,
            type: placementTpoLeadActivities.type,
            outcome: placementTpoLeadActivities.outcome,
            note: placementTpoLeadActivities.note,
            createdAt: placementTpoLeadActivities.createdAt,
          })
          .from(placementTpoLeadActivities)
          .where(
            and(
              eq(
                placementTpoLeadActivities.collegeId,
                input.collegeId,
              ),
              inArray(
                placementTpoLeadActivities.leadId,
                contactIds,
              ),
            ),
          )
      : [];

  return {
    company,
    contacts,
    drives: [...drives].sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime() ||
        a.id.localeCompare(b.id),
    ),
    hiringHistory: [...offers].sort(
      (a, b) =>
        b.issuedAt.getTime() - a.issuedAt.getTime() ||
        a.id.localeCompare(b.id),
    ),
    timeline: buildTpoCompanyTimeline({
      contacts,
      activities,
      drives,
      offers,
    }).slice(0, 100),
    contactsAvailable: sources.contactsAvailable,
    activitiesAvailable,
  };
}
