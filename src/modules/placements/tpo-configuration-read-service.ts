import "server-only";
import { asc, and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses, departments } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { placementTableExists } from "./staged-tables";
import { placementTpoBlockedDates as tpoBlockedDates, placementTpoJobTypes as tpoJobTypes, placementTpoPrepReadiness as tpoPrepReadiness } from "@/db/schema/tpo-configuration";

export async function getTpoJobTypes(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_job_types");
 const rows=ready?await getDb().select({
  id:tpoJobTypes.id,label:tpoJobTypes.label,active:tpoJobTypes.active,countsAsPlaced:tpoJobTypes.countsAsPlaced,isBuiltin:tpoJobTypes.isBuiltin,updatedAt:tpoJobTypes.updatedAt,
 }).from(tpoJobTypes).where(eq(tpoJobTypes.collegeId,collegeId))
 .orderBy(asc(tpoJobTypes.label)):[];
 return {ready,rows};
}
export async function getTpoBlockedDates(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_blocked_dates");
 const rows=ready?await getDb().select({
  id:tpoBlockedDates.id,day:tpoBlockedDates.day,reason:tpoBlockedDates.reason,updatedAt:tpoBlockedDates.updatedAt,
 }).from(tpoBlockedDates).where(eq(tpoBlockedDates.collegeId,collegeId))
 .orderBy(asc(tpoBlockedDates.day)):[];
 return {ready,rows};
}
export async function getTpoPrepReadiness(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_prep_readiness");
 const [row]=ready?await getDb().select({
  config:tpoPrepReadiness.config,updatedAt:tpoPrepReadiness.updatedAt,
 }).from(tpoPrepReadiness).where(eq(tpoPrepReadiness.collegeId,collegeId)).limit(1):[];
 return {ready,config:row?.config??null,updatedAt:row?.updatedAt??null};
}

export async function listTpoPrepCourses(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 return getDb().select({id:courses.id,name:courses.name,code:courses.code}).from(courses)
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(and(eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE")))
  .orderBy(asc(courses.name),asc(courses.id));
}
