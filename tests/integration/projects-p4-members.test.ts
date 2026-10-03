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
