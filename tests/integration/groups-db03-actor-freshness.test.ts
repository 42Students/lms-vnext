import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { createGroup, joinGroup, leaveGroup, transitionGroup } from "@/modules/groups/service";
import { upsertGroupRule } from "@/modules/groups/rules-service";
import { createElectiveSlot, createElectiveOffering } from "@/modules/electives/service";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || process.env.DB03_ISOLATED_TEST_DATABASE !== "1")
  throw new Error("DB03 actor tests require disposable TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1");
const pool = new Pool({connectionString:databaseUrl,max:2});

type Account = { userId:string; membershipId:string; context:RequestContext };
const accounts: Account[] = [];
const groups: string[] = [];
const slots: string[] = [];
const programs: string[] = [];
const label=()=> "DB03-ACTOR-" + randomUUID();

async function newActor(role: "LEARNER" | "COLLEGE_ADMIN"): Promise<Account> {
  const userId=randomUUID(), membershipId=randomUUID();
  await pool.query("INSERT INTO users (id, identity_uid, display_name) VALUES ($1,$2,$3)",
    [userId,"db03-actor-"+userId,label()]);
  await pool.query("INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
    [membershipId,userId,SEED_IDS.collegeA]);
  await pool.query("INSERT INTO membership_roles (membership_id,role) VALUES ($1,$2)",
    [membershipId,role]);
  const account:Account={userId,membershipId,context:{
    user:{id:userId,identityUid:"db03-actor-"+userId,platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:membershipId,collegeId:SEED_IDS.collegeA,
      organizationId:SEED_IDS.organization,status:"ACTIVE",roles:[role]},
  }};
  accounts.push(account);
  return account;
}

async function newGroup(context:RequestContext) {
  const group=await createGroup(context,{collegeId:SEED_IDS.collegeA,
    kind:"STUDY_GROUP",name:label(),configJson:{allowSelfLeave:true}});
  groups.push(group.id);
  return group;
}

afterAll(async()=>{
  // Every test must leave no inserted member events; rejected mutations must
  // never emit events. Keep cleanup scoped to our owned group IDs.
  for(const groupId of groups.reverse()) {
    const events=await pool.query("SELECT count(*)::int AS n FROM lms_group_member_events WHERE group_id=$1",[groupId]);
    if(events.rows[0].n!==0) throw new Error("Rejected DB03 actor write unexpectedly emitted events");
    await pool.query("DELETE FROM lms_group_members WHERE group_id=$1",[groupId]);
    await pool.query("DELETE FROM lms_groups WHERE id=$1",[groupId]);
  }
  for(const slotId of slots.reverse()) {
    await pool.query("DELETE FROM elective_slots WHERE id=$1",[slotId]);
  }
  for(const programId of programs.reverse()) {
    await pool.query("DELETE FROM programs WHERE id=$1",[programId]);
  }
  for(const a of accounts.reverse()) {
    await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[a.membershipId]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1",[a.membershipId]);
    await pool.query("DELETE FROM users WHERE id=$1",[a.userId]);
  }
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB03 actor persistence guards against stale request contexts",()=>{
  it("blocks a revoked COLLEGE_ADMIN from creating/transiting groups and updating rules",async()=>{
    const actor=await newActor("COLLEGE_ADMIN");
    const group=await newGroup(actor.context);
    await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[actor.membershipId]);

    await expect(createGroup(actor.context,{
      collegeId:SEED_IDS.collegeA,kind:"STUDY_GROUP",name:label(),configJson:{},
    })).rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
    await expect(transitionGroup(actor.context,group.id,"ACTIVATE"))
      .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
    await expect(upsertGroupRule(actor.context,group.id,{criteria:{minCgpa:5}}))
      .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
    const rows=await pool.query("SELECT status FROM lms_groups WHERE id=$1",[group.id]);
    expect(rows.rows[0].status).toBe("DRAFT");
  });

  it("blocks a suspended admin membership even when its context still says ACTIVE",async()=>{
    const actor=await newActor("COLLEGE_ADMIN");
    const group=await newGroup(actor.context);
    await pool.query("UPDATE college_memberships SET status='SUSPENDED' WHERE id=$1",[actor.membershipId]);
    await expect(transitionGroup(actor.context,group.id,"ACTIVATE"))
      .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  });

  it("blocks a disabled admin account from mutating an existing group",async()=>{
    const actor=await newActor("COLLEGE_ADMIN");
    const group=await newGroup(actor.context);
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[actor.userId]);
    await expect(transitionGroup(actor.context,group.id,"ACTIVATE"))
      .rejects.toMatchObject({code:"GROUP_ACTOR_INACTIVE"});
  });

  it("blocks stale LEARNER self-leave after learner role removal",async()=>{
    const actor=await newActor("LEARNER");
    const admin: RequestContext={
      user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
        platformStatus:"ACTIVE",systemRoles:[]},
      membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
        organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
    };
    const group=await newGroup(admin);
    await pool.query("UPDATE lms_groups SET status='ACTIVE' WHERE id=$1",[group.id]);
    // Direct fixture insert avoids any existing event, and proves a revoked
    // actor cannot remove an already persisted roster membership.
    await pool.query(
      "INSERT INTO lms_group_members (group_id,membership_id,state,source) VALUES ($1,$2,'WAITLISTED','SELF')",
      [group.id,actor.membershipId],
    );
    await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[actor.membershipId]);
    await expect(leaveGroup(actor.context,group.id,actor.membershipId))
      .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
    const result=await pool.query("SELECT state FROM lms_group_members WHERE group_id=$1",[group.id]);
    expect(result.rows[0].state).toBe("WAITLISTED");
    await expect(joinGroup(actor.context,group.id,actor.membershipId))
      .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
  });
  it("blocks revoked college admins in elective slot and offering writers",async()=>{
    const actor=await newActor("COLLEGE_ADMIN");
    const programId=randomUUID();
    programs.push(programId);
    await pool.query(
      "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
      [programId,SEED_IDS.departmentA,label(),label()],
    );
    const slotInput={collegeId:SEED_IDS.collegeA,programId,
      semesterNumber:1,name:label(),credits:3,minPick:1,maxPick:1};
    const seedAdmin:RequestContext={
      user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
        platformStatus:"ACTIVE",systemRoles:[]},
      membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
        organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
    };
    const slot=await createElectiveSlot(seedAdmin,slotInput);
    slots.push(slot.id);
    await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[actor.membershipId]);
    await expect(createElectiveSlot(actor.context,{...slotInput,name:label()}))
      .rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
    await expect(createElectiveOffering(actor.context,{
      slotId:slot.id,courseId:randomUUID(),groupId:randomUUID(),
      backedDeliveryId:randomUUID(),
    })).rejects.toMatchObject({code:"GROUP_ACTOR_NOT_AUTHORIZED"});
    const rows=await pool.query("SELECT count(*)::int AS n FROM elective_offerings WHERE slot_id=$1",[slot.id]);
    expect(rows.rows[0].n).toBe(0);
  });

});
