import "server-only";
import {and,count,eq,isNull,lte} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads,placementTpoFollowups,placementRecruiterCollegeGrants,placementCompanyRelationships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePlacementManageScope} from "./scope";
/** Cheap Home-only counts. Do not materialize every CRM lead, owner, activity
 * or follow-up just to render a number on the quiet dashboard. */
export async function getTpoHomeCrmCounts(context:RequestContext,collegeId:string,now=new Date()){
 await requirePlacementManageScope(context,collegeId);
 const db=getDb();
 const [[leads],[followups],[access]]=await Promise.all([
  db.select({n:count()}).from(placementTpoLeads).where(eq(placementTpoLeads.collegeId,collegeId)),
  db.select({n:count()}).from(placementTpoFollowups).where(and(
   eq(placementTpoFollowups.collegeId,collegeId),isNull(placementTpoFollowups.doneAt),
   lte(placementTpoFollowups.dueAt,now),
  )),
  db.select({n:count()}).from(placementRecruiterCollegeGrants)
   .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
   .where(and(eq(placementCompanyRelationships.collegeId,collegeId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
    eq(placementRecruiterCollegeGrants.verificationStatus,"PENDING"))),
 ]);
 return {leads:leads?.n??0,dueFollowups:followups?.n??0,pendingRecruiterAccess:access?.n??0};
}
