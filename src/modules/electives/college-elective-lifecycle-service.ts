import "server-only";
import {and,eq,isNull,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,departments,electiveOfferings,electiveSlots,lmsGroups,programs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertCollegeElectivesEnabled} from "./college-elective-module-guard";

import {assertPersistedGroupActor} from "@/modules/groups/actor-access";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {electiveLifecycleSchema} from "./college-elective-lifecycle-model";

export class ElectiveLifecycleError extends Error {
  constructor(public readonly code:"ELECTIVE_SLOT_NOT_FOUND"|"ELECTIVE_SLOT_STALE"|
    "ELECTIVE_ACTIVE_OFFERINGS"|"ELECTIVE_SELECTION_LOCKED"|"ELECTIVE_PARENT_UNAVAILABLE") {
    super(code);this.name="ElectiveLifecycleError";
  }
}
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type TxRunner=<T>(cb:(tx:Tx)=>Promise<T>)=>Promise<T>;

export async function changeCollegeElectiveLifecycle(context:RequestContext,rawId:unknown,raw:unknown,
  transaction:TxRunner=(fn)=>getDb().transaction(fn)) {
  const id=z.string().uuid().parse(rawId),input=electiveLifecycleSchema.parse(raw);
  const actor=await resolveActingCollege(context,"academics.manage");
  await assertCollegeElectivesEnabled(context);
  return transaction(async tx=>{
    const [slot]=await tx.select().from(electiveSlots)
      .where(and(eq(electiveSlots.id,id),eq(electiveSlots.collegeId,actor.collegeId),
        isNull(electiveSlots.deletedAt)))
      .for("update").limit(1);
    if(!slot)throw new ElectiveLifecycleError("ELECTIVE_SLOT_NOT_FOUND");
    const before=input.action==="ARCHIVE"?"ACTIVE":"ARCHIVED";
    if(slot.status!==before||slot.version!==input.expectedVersion)
      throw new ElectiveLifecycleError("ELECTIVE_SLOT_STALE");
    await assertPersistedGroupActor(tx,context,{collegeId:actor.collegeId,mode:"MANUAL"});
    let archivedOfferings=0;
    if(input.action==="ARCHIVE"){
      // COL-academic-setup-R02: one atomic cascade, not a dead-end error
      // when there are learner selections or active offerings. Preserve
      // selection history; archived groups and offerings deny future access.
      const active=await tx.select({id:electiveOfferings.id,groupId:electiveOfferings.groupId})
        .from(electiveOfferings)
        .where(and(eq(electiveOfferings.slotId,id),eq(electiveOfferings.status,"ACTIVE"),
          isNull(electiveOfferings.deletedAt)))
        .for("update");
      if(active.length){
        const now=new Date();
        const ids=active.map(row=>row.id);
        const groups=active.map(row=>row.groupId);
        const archived=await tx.update(electiveOfferings).set({
          status:"ARCHIVED",version:sql`${electiveOfferings.version}+1`,updatedAt:now,
        }).where(and(inArray(electiveOfferings.id,ids),
          eq(electiveOfferings.status,"ACTIVE"))).returning({id:electiveOfferings.id});
        archivedOfferings=archived.length;
        await tx.update(lmsGroups).set({
          status:"ARCHIVED",version:sql`${lmsGroups.version}+1`,updatedAt:now,
        }).where(and(inArray(lmsGroups.id,groups),eq(lmsGroups.status,"ACTIVE"),
          eq(lmsGroups.kind,"ELECTIVE"),eq(lmsGroups.collegeId,actor.collegeId)));
      }
    }else {
      const [program]=await tx.select({id:programs.id}).from(programs)
        .innerJoin(departments,and(eq(departments.id,programs.departmentId),
          eq(departments.collegeId,actor.collegeId),isNull(departments.archivedAt)))
        .where(and(eq(programs.id,slot.programId),eq(programs.status,"ACTIVE")))
        .for("share",{of:programs}).limit(1);
      if(!program)throw new ElectiveLifecycleError("ELECTIVE_PARENT_UNAVAILABLE");
      if(slot.academicPeriodId){
        const [period]=await tx.select({id:academicPeriods.id}).from(academicPeriods)
          .where(and(eq(academicPeriods.id,slot.academicPeriodId),
            eq(academicPeriods.collegeId,actor.collegeId),
            inArray(academicPeriods.status,["PLANNED","ACTIVE"])))
          .for("share").limit(1);
        if(!period)throw new ElectiveLifecycleError("ELECTIVE_PARENT_UNAVAILABLE");
      }
    }
    const [changed]=await tx.update(electiveSlots).set({
      status:input.action==="ARCHIVE"?"ARCHIVED":"ACTIVE",
      version:sql`${electiveSlots.version}+1`,updatedAt:new Date(),
    }).where(and(eq(electiveSlots.id,id),eq(electiveSlots.collegeId,actor.collegeId),
      eq(electiveSlots.version,input.expectedVersion),eq(electiveSlots.status,before)))
      .returning({id:electiveSlots.id,status:electiveSlots.status,version:electiveSlots.version});
    if(!changed)throw new ElectiveLifecycleError("ELECTIVE_SLOT_STALE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_ELECTIVE_SLOT_UPDATED,
      collegeId:actor.collegeId,organizationId:actor.organizationId,
      subjectType:"elective_slot",subjectId:id,
      summary:input.action==="ARCHIVE"?"College Admin archived elective slot":"College Admin restored elective slot",
      metadata:{before,after:changed.status,version:changed.version,archivedOfferings},
    });
    return changed;
  });
}
