import "server-only";
import {and,count,eq,isNull,lte} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads,placementTpoFollowups} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePlacementManageScope} from "./scope";
/** Cheap Home-only counts. Do not materialize every CRM lead, owner, activity
 * or follow-up just to render a number on the quiet dashboard. */
export async function getTpoHomeCrmCounts(context:RequestContext,collegeId:string,now=new Date()){
 await requirePlacementManageScope(context,collegeId);
 const db=getDb();
 const [[leads],[followups]]=await Promise.all([
  db.select({n:count()}).from(placementTpoLeads).where(eq(placementTpoLeads.collegeId,collegeId)),
  db.select({n:count()}).from(placementTpoFollowups).where(and(
   eq(placementTpoFollowups.collegeId,collegeId),isNull(placementTpoFollowups.doneAt),
   lte(placementTpoFollowups.dueAt,now),
  )),
 ]);
 return {leads:leads?.n??0,dueFollowups:followups?.n??0};
}
