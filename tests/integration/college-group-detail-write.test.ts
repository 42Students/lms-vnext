import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {writeCollegeGroupDetail} from "@/modules/groups/college-group-detail-write-service";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const own:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"w-group-detail-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const foreign:RequestContext={...own,membership:{...own.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const learner:RequestContext={...own,membership:{...own.membership!,roles:["LEARNER"]}};
const ids={user:randomUUID(),membership:randomUUID(),role:randomUUID(),
  group:randomUUID(),groupMember:randomUUID()};
const label="w-group-detail-"+ids.group.slice(0,8);
const rule={action:"SAVE_RULE",criteria:{allowedPassingYears:[2028]},autoRefresh:false,
  expectedGroupVersion:0,confirm:true} as const;
const promotion={action:"PROMOTE_WAITLIST",memberId:ids.membership,
  expectedGroupVersion:1,expectedMemberVersion:0,confirm:true} as const;
describe.skipIf(!enabled)("College study group rule and waitlist PG",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable test PostgreSQL required");
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2::text,$3::text)",
      [ids.user,ids.user,label]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
      [ids.membership,ids.user,SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
      [ids.role,ids.membership]);
    await pool.query("INSERT INTO lms_groups(id,kind,owner_scope,college_id,name,status,capacity,active_count,created_by_user_id) "+
      "VALUES($1,'STUDY_GROUP','COLLEGE',$2,$3::text,'ACTIVE',1,0,$4)",
      [ids.group,SEED_IDS.collegeA,label,SEED_IDS.collegeAdminUser]);
    await pool.query("INSERT INTO lms_group_members(id,group_id,membership_id,member_type,state,source,waitlist_position) "+
      "VALUES($1,$2,$3,'LEARNER','WAITLISTED','MANUAL',1)",
      [ids.groupMember,ids.group,ids.membership]);
  });
  afterAll(async()=>{try{
    // Immutable lms_group_member_events and activity_events reference these
    // fixture rows; the database is disposable so leave them for audit integrity.
  }finally{await pool?.end();await closeDatabaseConnection();}});
  it("rejects foreign-college/not-found/wrong-role and forged selectors",async()=>{
    await expect(writeCollegeGroupDetail(foreign,ids.group,rule))
      .rejects.toMatchObject({code:"GROUP_NOT_FOUND"});
    await expect(writeCollegeGroupDetail(own,randomUUID(),rule))
      .rejects.toMatchObject({code:"GROUP_NOT_FOUND"});
    await expect(writeCollegeGroupDetail(learner,ids.group,rule))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(writeCollegeGroupDetail(own,ids.group,{...rule,collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
  it("saves a scoped rule, rejects stale group version, promotes first waitlisted member and audits",async()=>{
    const saved=await writeCollegeGroupDetail(own,ids.group,rule);
    expect(saved.groupVersion).toBe(1);
    await expect(writeCollegeGroupDetail(own,ids.group,rule))
      .rejects.toMatchObject({code:"GROUP_STALE"});
    const promoted=await writeCollegeGroupDetail(own,ids.group,promotion);
    expect(promoted.groupVersion).toBe(2);
    await expect(writeCollegeGroupDetail(own,ids.group,promotion))
      .rejects.toMatchObject({code:"GROUP_STALE"});
    const rows=await pool!.query("SELECT state,version,waitlist_position FROM lms_group_members WHERE id=$1",[ids.groupMember]);
    expect(rows.rows[0].state).toBe("ACTIVE");
    expect(rows.rows[0].version).toBe(1);
    expect(rows.rows[0].waitlist_position).toBeNull();
    const history=await pool!.query("SELECT from_state,to_state FROM lms_group_member_events WHERE group_id=$1",[ids.group]);
    expect(history.rows).toContainEqual({from_state:"WAITLISTED",to_state:"ACTIVE"});
    const audit=await pool!.query("SELECT summary FROM activity_events WHERE subject_type='lms_group' AND subject_id=$1::text",[ids.group]);
    expect(audit.rows.map(row=>row.summary)).toContain("College Admin updated group eligibility rule");
    expect(audit.rows.map(row=>row.summary)).toContain("College Admin promoted waitlisted learner");
  });
});
