import "server-only";
import {and,asc,count,desc,eq,ilike,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs,placementCompanies,placementCompanyRelationships,placementSeasons} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobCollege} from "./tpo-job-write-base";

/** Legacy /all and /active were separate visibility paths. This is a
 * bounded, staff-only archive/hidden drive read: do not expose archived,
 * draft or closed records through learner discovery endpoints. */
const querySchema=z.strictObject({
 status:z.enum(["ALL","DRAFT","PUBLISHED","CLOSED","ARCHIVED"]).default("ALL"),
 q:z.string().trim().max(120).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
});
export async function listTpoHistoricalJobVisibility(context:RequestContext,raw:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const query=querySchema.parse(raw);
 const predicate=and(eq(placementJobs.collegeId,collegeId),
  query.status==="ALL"?undefined:eq(placementJobs.status,query.status),
  query.q?or(ilike(placementJobs.title,"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%"),
   ilike(placementCompanies.name,"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%")):undefined);
 const db=getDb();
 const [totalRows,rows]=await Promise.all([
  db.select({total:count()}).from(placementJobs)
   .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(predicate),
  db.select({
   id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
   collegeId:placementJobs.collegeId,seasonId:placementJobs.seasonId,
   seasonStatus:placementSeasons.status,companyName:placementCompanies.name,
   applicationDeadline:placementJobs.applicationDeadline,
   createdAt:placementJobs.createdAt,updatedAt:placementJobs.updatedAt,
   archivedAt:placementJobs.archivedAt,
  }).from(placementJobs)
   .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .innerJoin(placementSeasons,eq(placementSeasons.id,placementJobs.seasonId))
   .where(predicate)
   .orderBy(desc(placementJobs.createdAt),asc(placementJobs.id))
   .limit(50).offset((query.page-1)*50),
 ]);
 const total=totalRows[0]?.total??0;
 return {query,total,pageSize:50,totalPages:Math.max(1,Math.ceil(total/50)),
  records:rows.map(row=>({
   ...row,
   createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),
   archivedAt:row.archivedAt?.toISOString()??null,
   // Eligibility and registration are distinct from staff visibility.
   learnerDiscovery:"NOT_EVALUATED" as const,
   applicationEligibility:"NOT_EVALUATED" as const,
  }))};
}
