import "server-only";
import {and,asc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users,
 placementCompanies,placementCompanyRelationships,placementTpoLeads} from "@/db/schema";
import {requirePlacementManageScope} from "./scope";
import type {RequestContext} from "@/modules/identity/context";
import {normalizeTpoFinderTerm} from "./tpo-find-query-model";
/** T-S2-01: bounded college-scoped names and IDs only, never address/PII.
 * strpos uses literal matching rather than treating '%'/'_' as LIKE wildcards.
 */
export async function findTpoPeopleAndCompanies(ctx:RequestContext,collegeId:string,raw:string){
 await requirePlacementManageScope(ctx,collegeId);
 const term=normalizeTpoFinderTerm(raw),db=getDb();
 const [students,recruiters,companies]=await Promise.all([
  db.select({id:collegeMemberships.id,name:users.displayName}).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
   .where(and(eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
    eq(membershipRoles.role,"LEARNER"),
    sql`strpos(lower(coalesce(${users.displayName},'')),${term})>0`))
   .orderBy(asc(users.displayName)).limit(30),
  db.select({id:placementTpoLeads.id,name:placementTpoLeads.name}).from(placementTpoLeads)
   .where(and(eq(placementTpoLeads.collegeId,collegeId),
     sql`strpos(lower(${placementTpoLeads.name}),${term})>0`))
   .orderBy(asc(placementTpoLeads.name)).limit(30),
  db.select({id:placementCompanies.id,name:placementCompanies.name})
   .from(placementCompanyRelationships)
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(and(eq(placementCompanyRelationships.collegeId,collegeId),
    eq(placementCompanyRelationships.status,"ACTIVE"),
    eq(placementCompanies.status,"ACTIVE"),
    sql`strpos(lower(${placementCompanies.name}),${term})>0`))
   .orderBy(asc(placementCompanies.name)).limit(30),
 ]);
 return {students,recruiters,companies};
}
