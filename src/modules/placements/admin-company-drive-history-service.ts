import "server-only";

import { and, asc, count, countDistinct, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  placementCompanies, placementCompanyRelationships, placementJobs,
  placementApplications, placementOffers, placementJoiningOutcomes, collegeMemberships,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { summarizeVisibleCompanyDriveHistory } from "./admin-company-drive-history-model";

/** Scopes every company-history row to the persisted selected college. */
export async function listSuperAdminCompanyDriveHistory(context: RequestContext, rawCompanyId: string) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("placements.read");
  const companyId = z.string().uuid().parse(rawCompanyId);
  const acting = await resolveActingCollege(context, "placements.read");
  const db = getDb();
  const [company] = await db.select({
    id: placementCompanies.id,
    name: placementCompanies.name,
    status: placementCompanies.status,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(eq(placementCompanyRelationships.collegeId, acting.collegeId),
      eq(placementCompanyRelationships.companyId, companyId))).limit(1);
  if (!company) return null;
  const jobs = await db.select({
    id: placementJobs.id, title: placementJobs.title, status: placementJobs.status,
    publishedAt: placementJobs.publishedAt, deadline: placementJobs.applicationDeadline,
  }).from(placementJobs)
    .innerJoin(placementCompanyRelationships,
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId))
    .where(and(eq(placementCompanyRelationships.collegeId, acting.collegeId),
      eq(placementCompanyRelationships.companyId, companyId),
      eq(placementJobs.collegeId, acting.collegeId)))
    .orderBy(asc(placementJobs.title), asc(placementJobs.id))
    .limit(501);
  const visibleJobs=jobs.slice(0,500);
  const ids=visibleJobs.map(job=>job.id);
  const [applications, joined] = await Promise.all([
    ids.length ? db.select({jobId:placementApplications.jobId,total:count()})
      .from(placementApplications)
      .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
        eq(collegeMemberships.collegeId,acting.collegeId)))
      .where(inArray(placementApplications.jobId,ids))
      .groupBy(placementApplications.jobId) : Promise.resolve([]),
    ids.length ? db.select({jobId:placementApplications.jobId,
      total:countDistinct(placementApplications.id)})
      .from(placementApplications)
      .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
        eq(collegeMemberships.collegeId,acting.collegeId)))
      .innerJoin(placementOffers,and(eq(placementOffers.applicationId,placementApplications.id),
        eq(placementOffers.status,"ACCEPTED")))
      .innerJoin(placementJoiningOutcomes,and(eq(placementJoiningOutcomes.offerId,placementOffers.id),
        eq(placementJoiningOutcomes.status,"JOINED")))
      .where(inArray(placementApplications.jobId,ids))
      .groupBy(placementApplications.jobId) : Promise.resolve([]),
  ]);
  const byApplications=new Map(applications.map(row=>[row.jobId,row.total]));
  const byJoined=new Map(joined.map(row=>[row.jobId,row.total]));
  const items=visibleJobs.map(job=>({...job,applicants:byApplications.get(job.id)??0,
    hired:byJoined.get(job.id)??0}));
  return {company,items,totals:summarizeVisibleCompanyDriveHistory(items),
    truncated:jobs.length>500};
}
