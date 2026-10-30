import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { attachProjectTeamGroup, createGroup, joinGroup, leaveGroup, transitionGroup } from "@/modules/groups/service";
import { addProjectMember, endProjectMember } from "@/modules/projects/member-service";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const url = process.env.TEST_DATABASE_URL;
if (!url || process.env.DB03_ISOLATED_TEST_DATABASE !== "1")
  throw new Error("DB03 team tests REQUIRE a disposable TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1");
const pool = new Pool({ connectionString:url, max:2 });
const admin: RequestContext = {
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const fixtures: Array<{groupId:string;projectId:string;templateId:string;versionId:string}> = [];
const unrelatedGroups: string[] = [];

async function setupTeam() {
  const group = await createGroup(admin,{
    collegeId:SEED_IDS.collegeA,kind:"PROJECT_TEAM",name:"DB03 Team "+randomUUID(),
    capacity:3,configJson:{allowWaitlist:true},
  });
  const templateId=randomUUID(),versionId=randomUUID(),projectId=randomUUID();
  fixtures.push({groupId:group.id,projectId,templateId,versionId});
  // DB071's header-current-version FK is deferred until COMMIT. A template
  // header and its immutable initial revision must share one transaction.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO project_templates (id,slug,title,created_by_user_id) VALUES ($1,$2,'DB03 Team Template',$3)",
      [templateId,"db03-team-"+templateId,SEED_IDS.collegeAdminUser],
    );
    await client.query(
      "INSERT INTO project_template_versions (id,template_id,version,title,blueprint,created_by_user_id) VALUES ($1,$2,1,'DB03 Team Version',$3::jsonb,$4)",
      [versionId,templateId,JSON.stringify({releases:[]}),SEED_IDS.collegeAdminUser],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  await pool.query(
    "INSERT INTO project_instances (id,college_id,template_id,template_version_id,slug,title,created_by_user_id) VALUES ($1,$2,$3,$4,$5,'DB03 Team Workspace',$6)",
    [projectId,SEED_IDS.collegeA,templateId,versionId,"db03-team-"+projectId,SEED_IDS.collegeAdminUser],
  );
  return {groupId:group.id,projectId};
}
afterEach(async () => {
  await pool.query("TRUNCATE TABLE lms_group_member_events");
  for (const f of fixtures) {
    await pool.query("DELETE FROM lms_group_members WHERE group_id=$1",[f.groupId]);
    await pool.query("DELETE FROM project_members WHERE project_id=$1",[f.projectId]);
    await pool.query("DELETE FROM project_instances WHERE id=$1",[f.projectId]);
    // Do not remove DB070 append-only revisions or the DB071 parent header.
    const retention=await pool.query<{retainHistory:boolean}>(
      "select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"",
    );
    if (!retention.rows[0]?.retainHistory) {
      await pool.query("DELETE FROM project_template_versions WHERE id=$1",[f.versionId]);
      await pool.query("DELETE FROM project_templates WHERE id=$1",[f.templateId]);
    }
    await pool.query("DELETE FROM lms_groups WHERE id=$1",[f.groupId]);
  }
  fixtures.length=0;
  for (const id of unrelatedGroups) {
    await pool.query("DELETE FROM lms_groups WHERE id=$1",[id]);
  }
  unrelatedGroups.length=0;
});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("DB03 project TEAM roster mirroring (PostgreSQL)", () => {
  it("attaches only an empty project and mirrors joins, exits and history", async () => {
    const f=await setupTeam();
    const attached=await attachProjectTeamGroup(admin,f.projectId,f.groupId);
    expect(attached.teamGroupId).toBe(f.groupId);
    await transitionGroup(admin,f.groupId,"ACTIVATE");
    const joined=await joinGroup(admin,f.groupId,SEED_IDS.learnerCollegeAMembership,"MANUAL");
    expect(joined.state).toBe("ACTIVE");
    const [members,events,group]=await Promise.all([
      pool.query("SELECT id,role,ended_at FROM project_members WHERE project_id=$1",[f.projectId]),
      pool.query("SELECT to_state FROM lms_group_member_events WHERE group_id=$1",[f.groupId]),
      pool.query("SELECT active_count FROM lms_groups WHERE id=$1",[f.groupId]),
    ]);
    expect(members.rows).toHaveLength(1);
    expect(members.rows[0]).toMatchObject({role:"LEARNER",ended_at:null});
    expect(events.rows).toHaveLength(1);
    expect(group.rows[0].active_count).toBe(1);

    await expect(addProjectMember(admin,f.projectId,{
      membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",isPrimary:false,
    })).rejects.toMatchObject({code:"PROJECT_TEAM_GROUP_MANAGED"});
    await expect(endProjectMember(admin,f.projectId,members.rows[0].id))
      .rejects.toMatchObject({code:"PROJECT_TEAM_GROUP_MANAGED"});

    await leaveGroup(admin,f.groupId,SEED_IDS.learnerCollegeAMembership,"MANUAL");
    const ended=await pool.query(
      "SELECT ended_at FROM project_members WHERE id=$1",[members.rows[0].id],
    );
    expect(ended.rows[0].ended_at).not.toBeNull();
    const rejoined=await joinGroup(admin,f.groupId,SEED_IDS.learnerCollegeAMembership,"MANUAL");
    expect(rejoined.state).toBe("ACTIVE");
    const total=await pool.query(
      "SELECT count(*)::integer AS n FROM project_members WHERE project_id=$1 AND ended_at IS NULL",[f.projectId],
    );
    expect(total.rows[0].n).toBe(1);
  });

  it("rejects privileged SQL binding a project to an unrelated group kind", async () => {
    const f=await setupTeam();
    // The registered DB03 lifecycle trigger correctly forbids changing a
    // group's kind. Create an unrelated kind directly, so this witness reaches
    // and exercises the project→team-group parent validation instead.
    const other=await createGroup(admin,{
      collegeId:SEED_IDS.collegeA,kind:"BUS",
      name:"DB03 unrelated "+randomUUID(),configJson:{},
    });
    unrelatedGroups.push(other.id);
    await expect(pool.query(
      "UPDATE project_instances SET team_group_id=$1 WHERE id=$2",
      [other.id,f.projectId],
    )).rejects.toMatchObject({code:"23514"});
    const link=await pool.query("SELECT team_group_id FROM project_instances WHERE id=$1",[f.projectId]);
    expect(link.rows[0].team_group_id).toBeNull();
  });

  it("rolls back a group join when the project mirror cannot accept it", async () => {
    const f=await setupTeam();
    await attachProjectTeamGroup(admin,f.projectId,f.groupId);
    await transitionGroup(admin,f.groupId,"ACTIVATE");
    // Privileged SQL simulates a bad preexisting mirror row. The join must
    // roll back group member state, event and counter together.
    await pool.query(
      "INSERT INTO project_members (project_id,membership_id,role,is_primary,created_by_user_id) VALUES ($1,$2,'MENTOR',false,$3)",
      [f.projectId,SEED_IDS.learnerCollegeAMembership,SEED_IDS.collegeAdminUser],
    );
    await expect(joinGroup(admin,f.groupId,SEED_IDS.learnerCollegeAMembership,"MANUAL"))
      .rejects.toMatchObject({code:"PROJECT_TEAM_MEMBER_ROLE_CONFLICT"});
    const [groups,members,events]=await Promise.all([
      pool.query("SELECT active_count FROM lms_groups WHERE id=$1",[f.groupId]),
      pool.query("SELECT count(*)::integer AS n FROM lms_group_members WHERE group_id=$1",[f.groupId]),
      pool.query("SELECT count(*)::integer AS n FROM lms_group_member_events WHERE group_id=$1",[f.groupId]),
    ]);
    expect(groups.rows[0].active_count).toBe(0);
    expect(members.rows[0].n).toBe(0);
    expect(events.rows[0].n).toBe(0);
  });
});
