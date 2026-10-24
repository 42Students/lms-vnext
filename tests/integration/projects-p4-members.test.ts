import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  addProjectMember,
  endProjectMember,
  listMyProjectInstances,
  listProjectMemberCandidates,
  listProjectMembers,
  updateProjectMember,
} from "@/modules/projects/member-service";
import {
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
} from "@/modules/projects/template-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: null,
};

const scopedSuperAdmin: RequestContext = {
  ...superAdmin,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
  },
};

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

const mentor: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "MENTOR"],
  },
};

const outsider = {
  userId: "74000000-0000-4000-8000-000000000001",
  membershipId:
    "74000000-0000-4000-8000-000000000002",
  roleId: "74000000-0000-4000-8000-000000000003",
};

const secondMentor = {
  userId: "75000000-0000-4000-8000-000000000001",
  membershipId:
    "75000000-0000-4000-8000-000000000002",
  roleId: "75000000-0000-4000-8000-000000000003",
};

function blueprint() {
  return {
    overview: {
      goal: "P4 goal",
      deliverables: ["P4 demo"],
    },
    releases: [
      {
        key: "release-1",
        title: "P4 Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "P4 Sprint",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "P4 Task",
        priority: "MEDIUM" as const,
        sequence: 0,
      },
    ],
    resources: [],
  };
}

async function seedExtraMemberships() {
  await pool.query(
    `insert into users
      (id, identity_uid, display_name)
     values
      ($1, 'p4-outsider', 'P4 Outsider'),
      ($2, 'p4-second-mentor', 'P4 Second Mentor')`,
    [outsider.userId, secondMentor.userId],
  );
  await pool.query(
    `insert into college_memberships
      (id, user_id, college_id, status)
     values
      ($1, $2, $5, 'ACTIVE'),
      ($3, $4, $5, 'ACTIVE')`,
    [
      outsider.membershipId,
      outsider.userId,
      secondMentor.membershipId,
      secondMentor.userId,
      SEED_IDS.collegeA,
    ],
  );
  await pool.query(
    `insert into membership_roles
      (id, membership_id, role)
     values
      ($1, $2, 'LEARNER'),
      ($3, $4, 'MENTOR')`,
    [
      outsider.roleId,
      outsider.membershipId,
      secondMentor.roleId,
      secondMentor.membershipId,
    ],
  );
}

async function cleanup() {
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p4-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p4-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p4-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p4-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p4-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p4-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p4-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p4-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p4-%'",
  );
  await pool.query(
    "delete from membership_roles where membership_id in ($1, $2)",
    [outsider.membershipId, secondMentor.membershipId],
  );
  await pool.query(
    "delete from college_memberships where id in ($1, $2)",
    [outsider.membershipId, secondMentor.membershipId],
  );
  await pool.query(
    "delete from in_app_notifications where user_id in ($1, $2)",
    [outsider.userId, secondMentor.userId],
  );
  await pool.query(
    "delete from activity_events where actor_user_id in ($1, $2)",
    [outsider.userId, secondMentor.userId],
  );
  await pool.query(
    "delete from users where id in ($1, $2)",
    [outsider.userId, secondMentor.userId],
  );
}

async function createProject() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p4-team-template",
      title: "P4 Team Template",
      blueprint: blueprint(),
    },
  );
  await publishProjectTemplate(
    superAdmin,
    template.template.id,
  );
  await assignProjectTemplateToCollege(
    scopedSuperAdmin,
    template.template.id,
    SEED_IDS.collegeA,
  );

  return createProjectInstance(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      templateId: template.template.id,
      slug: "p4-team-project",
      title: "P4 Team Project",
    },
  );
}

beforeEach(async () => {
  await cleanup();
  await seedExtraMemberships();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P4 team and mentor membership", () => {
  it.each(["COMPLETED","ARCHIVED"] as const)(
    "denies direct roster add, edit and removal after a project is %s",async(status)=>{
      const project=await createProject();
      const member=await addProjectMember(collegeAdmin,project.id,{
        membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
      });
      await pool.query("update project_instances set status=$1 where id=$2",
        [status,project.id]);
      await expect(addProjectMember(collegeAdmin,project.id,{
        membershipId:outsider.membershipId,role:"LEARNER",
      })).rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
      await expect(updateProjectMember(collegeAdmin,project.id,member.id,{
        roleLabel:"Illicit roster change",
      })).rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
      await expect(endProjectMember(collegeAdmin,project.id,member.id))
        .rejects.toMatchObject({code:"PROJECT_INVALID_STATE"});
      const persistent=await pool.query<{
        active_count:number;role_label:string|null;
      }>(`select count(*) filter(where ended_at is null)::int as active_count,
          max(role_label) as role_label
         from project_members where project_id=$1 and role='LEARNER'`,[project.id]);
      expect(persistent.rows[0]).toEqual({active_count:1,role_label:null});
    },
  );

  it("uses canonical college memberships and exact project membership for participant access", async () => {
    const project = await createProject();

    await expect(
      getProjectInstanceWorkspace(
        learner,
        project.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });

    const learnerMember = await addProjectMember(
      collegeAdmin,
      project.id,
      {
        membershipId:
          SEED_IDS.learnerCollegeAMembership,
        role: "LEARNER",
      },
    );
    const mentorMember = await addProjectMember(
      collegeAdmin,
      project.id,
      {
        membershipId:
          SEED_IDS.facultyCollegeAMembership,
        role: "MENTOR",
        isPrimary: true,
        roleLabel: "Primary mentor",
      },
    );

    await expect(
      getProjectInstanceWorkspace(
        learner,
        project.id,
      ),
    ).resolves.toMatchObject({
      project: { id: project.id },
    });
    await expect(
      getProjectInstanceWorkspace(
        mentor,
        project.id,
      ),
    ).resolves.toMatchObject({
      project: { id: project.id },
    });

    const members = await listProjectMembers(
      learner,
      project.id,
    );
    expect(members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: learnerMember.id,
          role: "LEARNER",
        }),
        expect.objectContaining({
          id: mentorMember.id,
          role: "MENTOR",
          isPrimary: true,
        }),
      ]),
    );

    await expect(
      getProjectInstanceWorkspace(
        {
          user: {
            id: outsider.userId,
            identityUid: "p4-outsider",
            platformStatus: "ACTIVE",
            systemRoles: [],
          },
          membership: {
            id: outsider.membershipId,
            collegeId: SEED_IDS.collegeA,
            organizationId:
              SEED_IDS.organization,
            status: "ACTIVE",
            roles: ["LEARNER"],
          },
        },
        project.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });

    await expect(
      listMyProjectInstances(learner),
    ).resolves.toEqual([
      expect.objectContaining({
        project: expect.objectContaining({
          id: project.id,
        }),
        memberRole: "LEARNER",
      }),
    ]);

    await endProjectMember(
      collegeAdmin,
      project.id,
      learnerMember.id,
    );
    await expect(
      getProjectInstanceWorkspace(
        learner,
        project.id,
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_ACCESS_DENIED",
    });
  });

  it("atomically unassigns unfinished tasks on learner removal while preserving completed owner history", async () => {
    const project=await createProject();
    const member=await addProjectMember(collegeAdmin,project.id,{
      membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
    });
    const work=await pool.query<{id:string}>(`
      update project_tasks
      set assignee_membership_id=$1
      where project_id=$2 and status <> 'DONE' and deleted_at is null
      returning id
    `,[SEED_IDS.learnerCollegeAMembership,project.id]);
    expect(work.rowCount).toBeGreaterThan(0);
    const oldDone=await pool.query<{id:string}>(`
      insert into project_tasks
        (project_id,template_key,title,status,sequence,assignee_membership_id)
      values ($1,'history-done-before-removal','Historical completed task',
        'DONE',99,$2)
      returning id
    `,[project.id,SEED_IDS.learnerCollegeAMembership]);
    const removed=await endProjectMember(collegeAdmin,project.id,member.id);
    expect(removed.endedAt).not.toBeNull();
    const unassigned=await pool.query<{id:string;assignee_membership_id:string|null}>(`
      select id,assignee_membership_id from project_tasks
      where project_id=$1 and id=any($2::uuid[])
    `,[project.id,work.rows.map(row=>row.id)]);
    expect(unassigned.rows).toHaveLength(work.rows.length);
    expect(unassigned.rows.every(task=>task.assignee_membership_id===null))
      .toBe(true);
    const completed=await pool.query<{assignee_membership_id:string|null}>(`
      select assignee_membership_id from project_tasks where id=$1
    `,[oldDone.rows[0]!.id]);
    expect(completed.rows[0]?.assignee_membership_id)
      .toBe(SEED_IDS.learnerCollegeAMembership);
    const events=await pool.query<{subject_id:string}>(`
      select subject_id from activity_events
      where subject_id=any($1::uuid[]) and event_type='projects.task.details_updated'
        and metadata->>'previousAssigneeMembershipId'=$2
    `,[work.rows.map(row=>row.id),SEED_IDS.learnerCollegeAMembership]);
    expect(events.rowCount).toBe(work.rows.length);
    await expect(getProjectInstanceWorkspace(learner,project.id)).rejects
      .toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  });

  it("lets an assigned Mentor promote, edit and remove learners without granting roster administration", async () => {
    const project=await createProject();
    const student=await addProjectMember(collegeAdmin,project.id,{
      membershipId:SEED_IDS.learnerCollegeAMembership,role:"LEARNER",
    });
    const faculty=await addProjectMember(collegeAdmin,project.id,{
      membershipId:SEED_IDS.facultyCollegeAMembership,role:"MENTOR",isPrimary:true,
    });
    const candidateList=await listProjectMemberCandidates(mentor,project.id,{
      role:"LEARNER",q:"",limit:20,
    });
    expect(candidateList.map(row=>row.membershipId)).toContain(outsider.membershipId);
    await expect(listProjectMemberCandidates(mentor,project.id,{
      role:"MENTOR",q:"",limit:20,
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    await expect(addProjectMember(mentor,project.id,{
      membershipId:secondMentor.membershipId,role:"MENTOR",
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    const second=await addProjectMember(mentor,project.id,{
      membershipId:outsider.membershipId,role:"LEARNER",
    });
    const promoted=await updateProjectMember(mentor,project.id,student.id,{
      roleLabel:"Student lead",
    });
    expect(promoted.roleLabel).toBe("Student lead");
    await expect(updateProjectMember(mentor,project.id,second.id,{
      roleLabel:"Team lead",
    })).rejects.toMatchObject({code:"PROJECT_MEMBER_CONFLICT"});
    await expect(updateProjectMember(mentor,project.id,faculty.id,{
      roleLabel:"Illicit new Mentor responsibility",
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    await expect(updateProjectMember(mentor,project.id,student.id,{
      canMutate:false,
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    await expect(endProjectMember(mentor,project.id,faculty.id))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    await expect(updateProjectMember(learner,project.id,student.id,{
      roleLabel:"Student lead",
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    const demoted=await updateProjectMember(mentor,project.id,student.id,{
      roleLabel:"Student",
    });
    expect(demoted.roleLabel).toBe("Student");
    const lead=await updateProjectMember(mentor,project.id,second.id,{
      roleLabel:"Team lead",
    });
    expect(lead.roleLabel).toBe("Team lead");
    const removed=await endProjectMember(mentor,project.id,student.id);
    expect(removed.endedAt).toBeInstanceOf(Date);
    await expect(getProjectInstanceWorkspace(learner,project.id))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    const history=await pool.query<{action:string;total:string}>(`
      select metadata->>'action' as action,count(*)::text as total from activity_events
      where module='PROJECTS' and metadata->>'projectId'=$1
        and subject_type='project_member'
      group by metadata->>'action'`,[project.id]);
    expect(history.rows.length).toBeGreaterThan(0);
  });

  it("lists only eligible same-college candidates and excludes active teammates", async () => {
    const project = await createProject();

    await expect(
      listProjectMemberCandidates(collegeAdmin, project.id, {
        role: "LEARNER",
        q: "P4 Outsider",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        membershipId: outsider.membershipId,
        displayName: "P4 Outsider",
      }),
    ]);

    await expect(
      listProjectMemberCandidates(collegeAdmin, project.id, {
        role: "MENTOR",
        q: "Second Mentor",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        membershipId: secondMentor.membershipId,
        displayName: "P4 Second Mentor",
      }),
    ]);

    await addProjectMember(collegeAdmin, project.id, {
      membershipId: outsider.membershipId,
      role: "LEARNER",
    });

    await expect(
      listProjectMemberCandidates(collegeAdmin, project.id, {
        role: "LEARNER",
        q: "P4 Outsider",
      }),
    ).resolves.toEqual([]);
  });

  it("enforces learner/mentor college roles and one active primary mentor", async () => {
    const project = await createProject();

    await expect(
      addProjectMember(
        collegeAdmin,
        project.id,
        {
          membershipId:
            SEED_IDS.collegeAdminMembership,
          role: "MENTOR",
          isPrimary: true,
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEMBER_ROLE_REQUIRED",
    });

    await expect(
      addProjectMember(
        collegeAdmin,
        project.id,
        {
          membershipId:
            SEED_IDS.facultyCollegeBMembership,
          role: "MENTOR",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEMBER_ROLE_REQUIRED",
    });

    const primary = await addProjectMember(
      collegeAdmin,
      project.id,
      {
        membershipId:
          SEED_IDS.facultyCollegeAMembership,
        role: "MENTOR",
        isPrimary: true,
      },
    );

    await expect(
      addProjectMember(
        collegeAdmin,
        project.id,
        {
          membershipId:
            secondMentor.membershipId,
          role: "MENTOR",
          isPrimary: true,
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_PRIMARY_MENTOR_CONFLICT",
    });

    const coMentor = await addProjectMember(
      collegeAdmin,
      project.id,
      {
        membershipId:
          secondMentor.membershipId,
        role: "MENTOR",
        roleLabel: "Co-mentor",
      },
    );

    await expect(
      updateProjectMember(
        collegeAdmin,
        project.id,
        coMentor.id,
        { isPrimary: true },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_PRIMARY_MENTOR_CONFLICT",
    });

    await updateProjectMember(
      collegeAdmin,
      project.id,
      primary.id,
      { isPrimary: false },
    );
    await expect(
      updateProjectMember(
        collegeAdmin,
        project.id,
        coMentor.id,
        { isPrimary: true },
      ),
    ).resolves.toMatchObject({
      isPrimary: true,
    });
  });

  it("keeps ended membership history and allows an explicit later re-add", async () => {
    const project = await createProject();
    const first = await addProjectMember(
      collegeAdmin,
      project.id,
      {
        membershipId:
          SEED_IDS.learnerCollegeAMembership,
        role: "LEARNER",
      },
    );

    await endProjectMember(
      collegeAdmin,
      project.id,
      first.id,
    );
    const second = await addProjectMember(
      collegeAdmin,
      project.id,
      {
        membershipId:
          SEED_IDS.learnerCollegeAMembership,
        role: "LEARNER",
      },
    );

    expect(second.id).not.toBe(first.id);

    const history = await pool.query(
      `select id, ended_at
       from project_members
       where project_id = $1
         and membership_id = $2
       order by created_at asc`,
      [
        project.id,
        SEED_IDS.learnerCollegeAMembership,
      ],
    );
    expect(history.rowCount).toBe(2);
    expect(history.rows[0]?.ended_at).not.toBeNull();
    expect(history.rows[1]?.ended_at).toBeNull();
  });

  it("enforces primary mentor shape at the database boundary", async () => {
    const project = await createProject();

    await expect(
      pool.query(
        `insert into project_members
          (project_id, membership_id, role, is_primary, created_by_user_id)
         values ($1, $2, 'LEARNER', true, $3)`,
        [
          project.id,
          SEED_IDS.learnerCollegeAMembership,
          SEED_IDS.collegeAdminUser,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
});
