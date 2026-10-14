import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCandidatePreferences, upsertCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) throw new Error("Disposable TEST_DATABASE_URL required");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const id = {
  college:randomUUID(),department:randomUUID(),user:randomUUID(),membership:randomUUID(),
  role:randomUUID(),period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  enrollment:randomUUID(),access:randomUUID(),decision:randomUUID(),
};
const unique=id.user.slice(0,8).toUpperCase();
const context:RequestContext = {
  user:{id:id.user,identityUid:"prefs-"+id.user,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:id.membership,collegeId:id.college,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["LEARNER"]},
};
let prepared=false;
beforeAll(async()=>{
  prepared=true;
  // Mirror the passing learner-placement-notification-preferences fixture:
  // V188 ignores MEMBERSHIP module overrides; entitlement must be at COLLEGE.
  await pool.query("INSERT INTO colleges(id,organization_id,name,code) VALUES($1,$2,$3,$4)",
    [id.college,SEED_IDS.organization,"Preferences College "+unique,"PREF-C-"+unique]);
  await pool.query("INSERT INTO departments(id,college_id,name) VALUES($1,$2,$3)",
    [id.department,id.college,"Preferences Department "+unique]);
  await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
    [id.user,context.user.identityUid,"Preferences Learner "+unique]);
  await pool.query("INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",
    [id.membership,id.user,id.college]);
  await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [id.role,id.membership]);
  await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2027-12-31')",
    [id.period,id.college,"Preferences Period "+unique,"PREF-P-"+unique]);
  await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
    [id.program,id.department,"Preferences Program "+unique,"PREF-G-"+unique]);
  await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
    [id.cohort,id.program,"Preferences Cohort "+unique,"PREF-B-"+unique,id.period]);
  // cohort_progression_state is created by the cohort trigger.
  await pool.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",
    [id.enrollment,id.membership,id.program,id.cohort]);
  await pool.query("INSERT INTO module_access_rules(id,scope_type,scope_id,module,enabled,locked) VALUES($1,'COLLEGE',$2,'placements',true,false)",
    [id.access,id.college]);
  await pool.query("INSERT INTO placement_eligibility_decisions(id,college_id,scope_type,scope_id,status,decided_by_user_id) VALUES($1,$2,'MEMBERSHIP',$3,'ELIGIBLE',$4)",
    [id.decision,id.college,id.membership,SEED_IDS.collegeAdminUser]);
},45000);
beforeEach(async()=>{
  await pool.query("DELETE FROM placement_candidate_preferences WHERE membership_id=$1",[id.membership]);
});
afterAll(async()=>{
  try {
    if(!prepared)return;
    await pool.query("DELETE FROM placement_candidate_preferences WHERE membership_id=$1",[id.membership]);
    await pool.query("DELETE FROM placement_eligibility_decisions WHERE id=$1",[id.decision]);
    await pool.query("DELETE FROM module_access_rules WHERE id=$1",[id.access]);
    await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[id.enrollment]);
    await pool.query("DELETE FROM cohorts WHERE id=$1",[id.cohort]);
    await pool.query("DELETE FROM programs WHERE id=$1",[id.program]);
    await pool.query("DELETE FROM academic_periods WHERE id=$1",[id.period]);
    await pool.query("DELETE FROM departments WHERE id=$1",[id.department]);
    // Immutable audit rows must never be deleted; keep their owning identity and college.
    const evidence=await pool.query<{retained:boolean}>(`SELECT EXISTS(
      SELECT 1 FROM activity_events WHERE actor_user_id=$1 OR actor_membership_id=$2 OR college_id=$3
    ) AS retained`,[id.user,id.membership,id.college]);
    if(!evidence.rows[0]?.retained){
      await pool.query("DELETE FROM membership_roles WHERE id=$1",[id.role]);
      await pool.query("DELETE FROM college_memberships WHERE id=$1",[id.membership]);
      await pool.query("DELETE FROM users WHERE id=$1",[id.user]);
      await pool.query("DELETE FROM colleges WHERE id=$1",[id.college]);
    }
  } finally { await pool.end(); await closeDatabaseConnection(); }
},45000);
describe("learner placement preferences with own enrolled college",()=>{
  it("writes bounded roles, locations and CTC with private actor audit",async()=>{
    const saved=await upsertCandidatePreferences(context,{
      preferredRoleTitles:["Backend Engineer"],preferredLocations:["Hyderabad"],
      minimumAnnualCtcInr:1_200_000,
    });
    expect(saved.membershipId).toBe(id.membership);
    expect(await getCandidatePreferences(context)).toMatchObject({
      preferredRoleTitles:["Backend Engineer"],preferredLocations:["Hyderabad"],
      minimumAnnualCtcInr:1_200_000,
    });
    const audit=await pool.query<{total:string}>(`SELECT count(*)::text AS total FROM activity_events
      WHERE actor_user_id=$1 AND event_type='placements.candidate_preferences.updated'`,[id.user]);
    expect(audit.rows[0]?.total).toBe("1");
  });
  it("denies forged-college, suspended, wrong-role and swapped principal",async()=>{
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of denied) await expect(upsertCandidatePreferences(actor,{
      preferredRoleTitles:["Forged"],minimumAnnualCtcInr:1,
    })).rejects.toBeInstanceOf(AuthorizationError);
    const count=await pool.query("SELECT membership_id FROM placement_candidate_preferences WHERE membership_id=$1",[id.membership]);
    expect(count.rows).toHaveLength(0);
  });
});
