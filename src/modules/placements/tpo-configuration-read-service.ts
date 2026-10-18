import "server-only";
import { asc, and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, courses, departments } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { placementTableExists } from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {AuthorizationError} from "@/modules/permissions/policy";
import { placementTpoBlockedDates as tpoBlockedDates, placementTpoJobTypes as tpoJobTypes, placementTpoPrepReadiness as tpoPrepReadiness } from "@/db/schema/tpo-configuration";

export async function getTpoJobTypes(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_job_types");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const rows=ready?await tx.select({
   id:tpoJobTypes.id,label:tpoJobTypes.label,active:tpoJobTypes.active,countsAsPlaced:tpoJobTypes.countsAsPlaced,isBuiltin:tpoJobTypes.isBuiltin,updatedAt:tpoJobTypes.updatedAt,
  }).from(tpoJobTypes).where(eq(tpoJobTypes.collegeId,collegeId))
   .orderBy(asc(tpoJobTypes.label)):[];
  return {ready,rows};
 });
}
export async function getTpoBlockedDates(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_blocked_dates");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const rows=ready?await tx.select({
   id:tpoBlockedDates.id,day:tpoBlockedDates.day,reason:tpoBlockedDates.reason,updatedAt:tpoBlockedDates.updatedAt,
  }).from(tpoBlockedDates).where(eq(tpoBlockedDates.collegeId,collegeId))
   .orderBy(asc(tpoBlockedDates.day)):[];
  return {ready,rows};
 });
}
export async function getTpoPrepReadiness(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 const ready=await placementTableExists("placement_tpo_prep_readiness");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [row]=ready?await tx.select({
   config:tpoPrepReadiness.config,updatedAt:tpoPrepReadiness.updatedAt,
  }).from(tpoPrepReadiness).where(eq(tpoPrepReadiness.collegeId,collegeId)).limit(1):[];
  return {ready,config:row?.config??null,updatedAt:row?.updatedAt??null};
 });
}

export async function listTpoPrepCourses(ctx:RequestContext){
 const collegeId=await requireTpoBatchActor(ctx);
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  return tx.select({id:courses.id,name:courses.name,code:courses.code}).from(courses)
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,collegeId),isNull(departments.archivedAt),eq(courses.status,"ACTIVE")))
   .orderBy(asc(courses.name),asc(courses.id));
 });
}
