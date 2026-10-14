import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCollegeActivityDetail, listCollegeActivity } from "@/modules/activity/college-activity-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool = enabled ? new Pool({connectionString:process.env.TEST_DATABASE_URL}) : null;
const admin: RequestContext = {
  user: { id:SEED_IDS.collegeAdminUser, identityUid:"college-activity-audit",platformStatus:"ACTIVE",systemRoles:[] },
  membership: { id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"] },
};
const other: RequestContext = {
  user: { ...admin.user,id:SEED_IDS.facultyUser },
  membership: { id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"] },
};
const faculty: RequestContext = { ...admin,membership:{...admin.membership!,roles:["FACULTY"]} };
const ids={own:randomUUID(),foreign:randomUUID()};
const subject="w-college-audit-"+ids.own.slice(0,8);

describe.skipIf(!enabled)("College Admin Activity Log PG cursor and denial",()=>{
  beforeAll(async()=>{
    if(!pool) throw Error("Isolated PostgreSQL is required");
    const now=Date.now();
    // Audit rows are deliberately permanent; UUID-scoped test events never collide.
    for(let i=0;i<27;i++) {
      const id=i===0?ids.own:randomUUID();
      await pool.query(
        "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,importance,subject_type,subject_id,summary,occurred_at) " +
        "VALUES($1,$2,$3,$4,'ACADEMICS','academics.program.updated','NORMAL',$5,$6,$7,$8)",
        [id,SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser,
          subject,id,"w-audit-own-"+i,new Date(now-i*60_000).toISOString()],
      );
    }
    await pool.query(
      "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,importance,subject_type,subject_id,summary,occurred_at) " +
      "VALUES($1,$2,$3,$4,'ACADEMICS','academics.program.updated','NORMAL',$5,$6,$7,$8)",
      [ids.foreign,SEED_IDS.organization,SEED_IDS.collegeB,SEED_IDS.facultyUser,
        subject,ids.foreign,"w-audit-foreign",new Date(now).toISOString()],
    );
  });
  afterAll(async()=>{
    // Never delete append-only activity_events; fixture has unique subjects/IDs.
    await pool?.end();
    await closeDatabaseConnection();
  });
  it("paginates 27 own events and never reads another college",async()=>{
    const page1=await listCollegeActivity(admin,{subjectType:subject,actorUserId:SEED_IDS.collegeAdminUser});
    expect(page1.items).toHaveLength(25);
    expect(page1.nextCursor).not.toBeNull();
    expect(page1.items.every(x=>x.event.collegeId===SEED_IDS.collegeA)).toBe(true);
    const page2=await listCollegeActivity(admin,{
      subjectType:subject,
      beforeOccurredAt:page1.nextCursor!.beforeOccurredAt.toISOString(),
      beforeId:page1.nextCursor!.beforeId,
    });
    expect(page2.items).toHaveLength(2);
    expect(page2.nextCursor).toBeNull();
    const foreign=await listCollegeActivity(other,{subjectType:subject});
    expect(foreign.items).toHaveLength(1);
    expect(foreign.items[0].event.collegeId).toBe(SEED_IDS.collegeB);
  });
  it("filters persisted event module, importance and exact event type before cursor pagination",async()=>{
    const match=await listCollegeActivity(admin,{subjectType:subject,module:"ACADEMICS",
      importance:"NORMAL",eventType:"academics.program.updated"});
    expect(match.items).toHaveLength(25);
    expect(match.nextCursor).not.toBeNull();
    const excluded=await listCollegeActivity(admin,{subjectType:subject,importance:"CRITICAL"});
    expect(excluded.items).toHaveLength(0);
    const anotherCollege=await listCollegeActivity(other,{subjectType:subject,module:"ACADEMICS"});
    expect(anotherCollege.items).toHaveLength(1);
  });
  it("protects event detail and denies wrong-role/forged college filter",async()=>{
    const detail=await getCollegeActivityDetail(admin,ids.own);
    expect(detail.event.id).toBe(ids.own);
    await expect(getCollegeActivityDetail(other,ids.own)).rejects.toBeDefined();
    await expect(getCollegeActivityDetail(admin,ids.foreign)).rejects.toBeDefined();
    await expect(listCollegeActivity(faculty,{subjectType:subject}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeActivity(admin,{subjectType:subject,collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
});
