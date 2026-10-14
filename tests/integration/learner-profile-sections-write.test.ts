import { randomUUID } from "node:crypto";
import { afterAll,afterEach,beforeEach,describe,expect,it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { updateOwnLearnerProfileSection } from "@/modules/people/learner-profile-section-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:{ids:{user:string;membership:string;role:string};context:RequestContext}|null=null;
beforeEach(async()=>{
  const ids={user:randomUUID(),membership:randomUUID(),role:randomUUID()};
  const context:RequestContext={
    user:{id:ids.user,identityUid:"profile-section-"+ids.user,platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:ids.membership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
      status:"ACTIVE",roles:["LEARNER"]},
  };
  fixture={ids,context};
  await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
    [ids.user,context.user.identityUid,"Section profile "+ids.user]);
  await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
    [ids.membership,ids.user,SEED_IDS.collegeA]);
  await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [ids.role,ids.membership]);
  await pool.query("INSERT INTO learner_profiles(membership_id,profile_document) VALUES($1,$2::jsonb)",
    [ids.membership,JSON.stringify({headline:"Preserve my headline",contacts:{alternatePhone:"",
      contactEmail:"saved@example.test"},metadata:[{id:randomUUID(),key:"source",type:"text",value:"existing"}]})]);
},30000);
afterEach(async()=>{
  const x=fixture;fixture=null;if(!x)return;
  await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[x.ids.membership]);
  const audit=await pool.query<{used:boolean}>(`SELECT EXISTS(
    SELECT 1 FROM activity_events WHERE actor_user_id=$1 OR actor_membership_id=$2
  ) AS used`,[x.ids.user,x.ids.membership]);
  if(!audit.rows[0]?.used){
    await pool.query("DELETE FROM membership_roles WHERE id=$1",[x.ids.role]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1",[x.ids.membership]);
    await pool.query("DELETE FROM users WHERE id=$1",[x.ids.user]);
  }
},30000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own education skills projects jsonb_set PATCH on fresh PostgreSQL",()=>{
  it("rejects a stale same-section version, preserves unrelated edits, and never audits the denied write",async()=>{
    const {ids,context}=fixture!;
    const first={id:randomUUID(),name:"React"};
    const second={id:randomUUID(),name:"PostgreSQL"};
    await updateOwnLearnerProfileSection(context,{
      confirmed:true,section:"skills",items:[first],expectedItems:[],
    });
    await expect(updateOwnLearnerProfileSection(context,{
      confirmed:true,section:"skills",items:[second],expectedItems:[],
    })).rejects.toMatchObject({code:"LEARNER_PROFILE_SECTION_STALE"});
    await updateOwnLearnerProfileSection(context,{
      confirmed:true,section:"education",
      items:[{id:randomUUID(),educationType:"Degree",program:"B.Tech",institution:"College"}],
      expectedItems:[],
    });
    const rows=await pool.query<{profile_document:Record<string,unknown>}>(
      "SELECT profile_document FROM learner_profiles WHERE membership_id=$1",[ids.membership]);
    expect(rows.rows[0]?.profile_document).toMatchObject({
      skills:[expect.objectContaining({name:"React"})],
      education:[expect.objectContaining({program:"B.Tech"})],
    });
    const audits=await pool.query<{total:string}>(
      "SELECT count(*)::text AS total FROM activity_events WHERE actor_membership_id=$1 AND event_type='identity.learner_profile_section.updated'",
      [ids.membership]);
    expect(audits.rows[0]?.total).toBe("2");
  },30000);

  it("patches only each submitted section, preserves all others and audits without payload",async()=>{
    const {ids,context}=fixture!;
    const edu={id:randomUUID(),educationType:"Degree",program:"B.Tech",institution:"College"};
    const skill={id:randomUUID(),name:"TypeScript"};
    const project={id:randomUUID(),name:"LMS"};
    await updateOwnLearnerProfileSection(context,{confirmed:true,section:"education",items:[edu]});
    await updateOwnLearnerProfileSection(context,{confirmed:true,section:"skills",items:[skill]});
    await updateOwnLearnerProfileSection(context,{confirmed:true,section:"projects",items:[project]});
    const rows=await pool.query<{profile_document:Record<string,unknown>}>(
      "SELECT profile_document FROM learner_profiles WHERE membership_id=$1",[ids.membership]);
    expect(rows.rows[0]?.profile_document).toMatchObject({
      headline:"Preserve my headline",
      contacts:{contactEmail:"saved@example.test"},
      education:[expect.objectContaining({program:"B.Tech"})],
      skills:[expect.objectContaining({name:"TypeScript"})],
      projects:[expect.objectContaining({name:"LMS"})],
    });
    const audit=await pool.query<{metadata:Record<string,unknown>}>(
      "SELECT metadata FROM activity_events WHERE actor_membership_id=$1 AND event_type='identity.learner_profile_section.updated'",
      [ids.membership]);
    expect(audit.rows).toHaveLength(3);
    expect(JSON.stringify(audit.rows)).not.toContain("saved@example.test");
    expect(JSON.stringify(audit.rows)).not.toContain("TypeScript");
  },30000);
  it("denies forged-college, suspended, wrong-role and swapped principal",async()=>{
    const {ids,context}=fixture!;
    const bad:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of bad)await expect(updateOwnLearnerProfileSection(actor,{
      confirmed:true,section:"skills",items:[{id:randomUUID(),name:"Injected"}],
    })).rejects.toBeInstanceOf(AuthorizationError);
    const rows=await pool.query<{profile_document:Record<string,unknown>}>(
      "SELECT profile_document FROM learner_profiles WHERE membership_id=$1",[ids.membership]);
    expect(rows.rows[0]?.profile_document.skills).toBeUndefined();
  });
});
