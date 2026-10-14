import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll,beforeAll,beforeEach,describe,expect,it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { updateOwnPlacementNotificationPreferences } from "@/modules/placements/learner-placement-notification-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Only disposable TEST_DATABASE_URL is permitted for learner notification preference tests");
}
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const id={
  user:randomUUID(),membership:randomUUID(),role:randomUUID(),period:randomUUID(),
  program:randomUUID(),cohort:randomUUID(),enrollment:randomUUID(),
  access:randomUUID(),decision:randomUUID(),
};
const suffix=randomUUID().slice(0,8).toUpperCase();
const code="C4NP-"+suffix;
const learner:RequestContext={
  user:{id:id.user,identityUid:"c4-notify-"+suffix,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{
    id:id.membership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"],
  },
};

async function reset() {
  await pool.query("DELETE FROM activity_events WHERE subject_type='PLACEMENT_NOTIFICATION_PREFERENCES' AND subject_id=$1",[id.membership]);
  await pool.query("DELETE FROM placement_candidate_preferences WHERE membership_id=$1",[id.membership]);
}
async function cleanup(){
  await reset();
  await pool.query("DELETE FROM placement_eligibility_decisions WHERE id=$1",[id.decision]);
  await pool.query("DELETE FROM module_access_rules WHERE id=$1",[id.access]);
  await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[id.enrollment]);
  await pool.query("DELETE FROM membership_roles WHERE id=$1",[id.role]);
  await pool.query("DELETE FROM college_memberships WHERE id=$1",[id.membership]);
  await pool.query("DELETE FROM users WHERE id=$1",[id.user]);
  await pool.query("DELETE FROM cohorts WHERE id=$1",[id.cohort]);
  await pool.query("DELETE FROM programs WHERE id=$1",[id.program]);
  await pool.query("DELETE FROM academic_periods WHERE id=$1",[id.period]);
}

beforeAll(async()=>{
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name,platform_status) VALUES($1,$2,$3,'ACTIVE')",
    [id.user,learner.user.identityUid,"C4 Preferences Test Learner "+suffix],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",
    [id.membership,id.user,SEED_IDS.collegeA],
  );
  await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [id.role,id.membership]);
  await pool.query(
    "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2027-12-31')",
    [id.period,SEED_IDS.collegeA,code+" Period",code+"-PERIOD"],
  );
  await pool.query(
    "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
    [id.program,SEED_IDS.departmentA,code+" Program",code+"-PROGRAM"],
  );
  await pool.query(
    "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
    [id.cohort,id.program,code+" Cohort",code+"-COHORT",id.period],
  );
  await pool.query(
    "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",
    [id.enrollment,id.membership,id.program,id.cohort],
  );
  await pool.query(
    "INSERT INTO module_access_rules(id,scope_type,scope_id,module,enabled,locked) VALUES($1,'MEMBERSHIP',$2,'placements',true,false)",
    [id.access,id.membership],
  );
  await pool.query(
    "INSERT INTO placement_eligibility_decisions(id,college_id,scope_type,scope_id,status,decided_by_user_id) VALUES($1,$2,'MEMBERSHIP',$3,'ELIGIBLE',$4)",
    [id.decision,SEED_IDS.collegeA,id.membership,SEED_IDS.collegeAdminUser],
  );
});
beforeEach(reset);
afterAll(async()=>{
  try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}
});

describe("Learner placement notification choice write against fresh PostgreSQL",()=>{
  it("updates only registered notification columns and creates one actor audit per real change",async()=>{
    await pool.query(
      "INSERT INTO placement_candidate_preferences(membership_id,preferred_role_titles,preferred_locations,minimum_annual_ctc_inr,notify_matching_jobs,notify_application_updates) VALUES($1,ARRAY['Engineer'],ARRAY['Hyderabad'],800000,true,true)",
      [id.membership],
    );
    const changed=await updateOwnPlacementNotificationPreferences(learner,{
      notifyMatchingJobs:false,notifyApplicationUpdates:true,confirmed:true,
    });
    expect(changed).toMatchObject({notifyMatchingJobs:false,notifyApplicationUpdates:true,changed:true});
    const persisted=await getCandidatePreferences(learner);
    expect(persisted).toMatchObject({
      membershipId:id.membership,preferredRoleTitles:["Engineer"],
      preferredLocations:["Hyderabad"],minimumAnnualCtcInr:800000,
      notifyMatchingJobs:false,notifyApplicationUpdates:true,
    });
    const audit=await pool.query<{event_type:string;actor_user_id:string;actor_membership_id:string;college_id:string;subject_id:string}>(
      "SELECT event_type,actor_user_id,actor_membership_id,college_id,subject_id FROM activity_events WHERE subject_type='PLACEMENT_NOTIFICATION_PREFERENCES' AND subject_id=$1",[id.membership],
    );
    expect(audit.rowCount).toBe(1);
    expect(audit.rows[0]).toMatchObject({
      event_type:"placements.notification_preferences.updated",
      actor_user_id:id.user,actor_membership_id:id.membership,
      college_id:SEED_IDS.collegeA,subject_id:id.membership,
    });
    const retry=await updateOwnPlacementNotificationPreferences(learner,{
      notifyMatchingJobs:false,notifyApplicationUpdates:true,confirmed:true,
    });
    expect(retry.changed).toBe(false);
    const auditAfter=await pool.query(
      "SELECT id FROM activity_events WHERE subject_type='PLACEMENT_NOTIFICATION_PREFERENCES' AND subject_id=$1",[id.membership],
    );
    expect(auditAfter.rowCount).toBe(1);
  });
  it("rejects foreign college, suspended membership, and wrong role without writes or audits",async()=>{
    const input={
      notifyMatchingJobs:false,notifyApplicationUpdates:false,confirmed:true,
    } as const;
    await expect(updateOwnPlacementNotificationPreferences({
      ...learner,membership:{...learner.membership!,collegeId:SEED_IDS.collegeB},
    },input)).rejects.toBeDefined();

    await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[id.membership]);
    try{
      // Stale in-memory ACTIVE is not enough; persisted SUSPENDED must deny.
      await expect(updateOwnPlacementNotificationPreferences(learner,input)).rejects.toBeDefined();
    }finally{
      await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[id.membership]);
    }

    await expect(updateOwnPlacementNotificationPreferences({
      ...learner,membership:{...learner.membership!,roles:["TPO"]},
    },input)).rejects.toBeDefined();

    await pool.query("DELETE FROM membership_roles WHERE id=$1",[id.role]);
    try{
      // Even a context that claims LEARNER cannot bypass a revoked DB role.
      await expect(updateOwnPlacementNotificationPreferences(learner,input)).rejects.toBeDefined();
    }finally{
      await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
        [id.role,id.membership]);
    }
    const preferences=await pool.query("SELECT membership_id FROM placement_candidate_preferences WHERE membership_id=$1",[id.membership]);
    const audit=await pool.query("SELECT id FROM activity_events WHERE subject_type='PLACEMENT_NOTIFICATION_PREFERENCES' AND subject_id=$1",[id.membership]);
    expect(preferences.rowCount).toBe(0);
    expect(audit.rowCount).toBe(0);
  });
  it("rejects missing confirmation, malformed values, and caller-controlled membership selectors",async()=>{
    const examples=[
      {notifyMatchingJobs:false,notifyApplicationUpdates:false},
      {notifyMatchingJobs:"false",notifyApplicationUpdates:false,confirmed:true},
      {notifyMatchingJobs:false,notifyApplicationUpdates:false,confirmed:true,
        collegeId:SEED_IDS.collegeB},
      {notifyMatchingJobs:false,notifyApplicationUpdates:false,confirmed:true,
        membershipId:SEED_IDS.learnerCollegeAMembership},
    ];
    for(const item of examples){
      await expect(updateOwnPlacementNotificationPreferences(learner,item)).rejects.toBeDefined();
    }
    const db=await pool.query("SELECT * FROM placement_candidate_preferences WHERE membership_id=$1",[id.membership]);
    expect(db.rowCount).toBe(0);
  });
});
