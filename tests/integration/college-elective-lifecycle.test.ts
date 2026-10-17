import {randomUUID} from "node:crypto";
import {describe,expect,it} from "vitest";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {changeCollegeElectiveLifecycle}
  from "@/modules/electives/college-elective-lifecycle-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"elective-cycle-test",
  platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...admin,membership:{...admin.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const learner:RequestContext={...admin,membership:{...admin.membership!,roles:["LEARNER"]}};
describe.skipIf(!enabled)("College elective slot lifecycle isolated PostgreSQL",()=>{
  it("COL-academic-setup-R02 keeps archived slots recoverable with version CAS",async()=>{
    const {electiveLifecyclePrompt}=await import("@/modules/electives/college-elective-lifecycle-model");
    expect(electiveLifecyclePrompt("A","ARCHIVE")).toContain("enrolled students lose access");
    expect(electiveLifecyclePrompt("A","RESTORE")).toContain("program and academic period");
  });
  it("uses own-college fixture, prevents stale restore, persists immutable audit and rolls back",async()=>{
    const ids={program:randomUUID(),period:randomUUID(),slot:randomUUID()};
    const tag="elective-cycle-"+ids.slot.slice(0,8);
    await expect(getDb().transaction(async tx=>{
      await tx.execute(sql`insert into academic_periods(id,college_id,name,code,start_date,end_date)
        values (${ids.period},${SEED_IDS.collegeA},${tag},${tag},'2026-07-01','2026-12-31')`);
      await tx.execute(sql`insert into programs(id,department_id,name,code,duration_terms)
        values (${ids.program},${SEED_IDS.departmentA},${tag},${tag},4)`);
      await tx.execute(sql`insert into elective_slots(id,college_id,program_id,academic_period_id,
        semester_number,name,status)
        values (${ids.slot},${SEED_IDS.collegeA},${ids.program},${ids.period},2,${tag},'ACTIVE')`);
      const call=(ctx:RequestContext,data:unknown,id=ids.slot)=>
        changeCollegeElectiveLifecycle(ctx,id,data,cb=>tx.transaction(cb));
      const archive={action:"ARCHIVE" as const,expectedVersion:0,confirm:true as const};
      await expect(call(foreign,archive)).rejects.toMatchObject({code:"ELECTIVE_SLOT_NOT_FOUND"});
      await expect(call(admin,archive,randomUUID())).rejects.toMatchObject({code:"ELECTIVE_SLOT_NOT_FOUND"});
      await expect(call(learner,archive)).rejects.toBeInstanceOf(AuthorizationError);
      await expect(call(admin,{...archive,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
      const closed=await call(admin,archive);
      expect(closed).toMatchObject({status:"ARCHIVED",version:1});
      await expect(call(admin,archive)).rejects.toMatchObject({code:"ELECTIVE_SLOT_STALE"});
      const restored=await call(admin,{action:"RESTORE",expectedVersion:1,confirm:true});
      expect(restored).toMatchObject({status:"ACTIVE",version:2});
      const history=await tx.execute(sql`select summary from activity_events
        where subject_type='elective_slot' and subject_id=${ids.slot}::text`);
      expect(history.rows.map(row=>row.summary)).toContain("College Admin archived elective slot");
      expect(history.rows.map(row=>row.summary)).toContain("College Admin restored elective slot");
      throw new Error("ROLLBACK_AFTER_ELECTIVE_CYCLE");
    })).rejects.toThrow("ROLLBACK_AFTER_ELECTIVE_CYCLE");
  });
});
