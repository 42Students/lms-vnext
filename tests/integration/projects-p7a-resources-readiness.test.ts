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
} from "@/modules/projects/member-service";
import {
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  completeProjectSprint,
  shipProjectRelease,
  startProjectSprint,
} from "@/modules/projects/lifecycle-service";
import {
  getProjectReadiness,
} from "@/modules/projects/readiness-service";
import {
  archiveProjectResource,
  createProjectResource,
  listProjectResources,
  updateProjectResource,
} from "@/modules/projects/resource-service";
import {
  createProjectSubmissionDraft,
} from "@/modules/projects/submission-service";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
} from "@/modules/projects/template-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {approveProjectTaskThroughReview} from "./support/projects-review-fixture";

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

/** Mentor ship/unship is optimistic: send the release version the UI would hold. */
async function releaseVersion(releaseId: string) {
  const { rows } = await pool.query<{ updated_at: Date }>(
    "select updated_at from project_releases where id = $1",
    [releaseId],
  );
  return { expectedUpdatedAt: rows[0]!.updated_at.toISOString() };
}

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

function blueprint() {
  return {
    overview: {
      goal: "P7 readiness",
      deliverables: ["P7 demo"],
    },
    releases: [
      {
        key: "release-1",
        title: "P7 Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "P7 Sprint",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "P7 Task",
        priority: "MEDIUM" as const,
        sequence: 0,
      },
    ],
    resources: [
      {
        key: "template-guide",
        title: "Template guide",
        url: "https://example.com/template-guide",
        required: true,
        sequence: 0,
      },
    ],
  };
}

async function cleanup() {
  await pool.query(
    `delete from project_evaluation_items
     where evaluation_id in (
       select id from project_evaluations
       where project_id in (
         select id from project_instances
         where slug like 'p7a-%'
       )
     )`,
  );
  await pool.query(
    `delete from project_evaluations
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_submission_reviews
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_task_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  // Trigger-written resource audit rows for these disposable projects.
  await pool.query(
    `delete from project_resource_audit
     where project_id in (
       select id from project_instances
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p7a-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p7a-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p7a-%'",
  );
}

async function createProject() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p7a-resource-template",
      title: "P7A Resource Template",
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
  const project = await createProjectInstance(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      templateId: template.template.id,
      slug: "p7a-resource-project",
      title: "P7A Resource Project",
    },
  );

  await addProjectMember(
    collegeAdmin,
    project.id,
    {
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
      role: "LEARNER",
    },
  );
  await addProjectMember(
    collegeAdmin,
    project.id,
    {
      membershipId:
        SEED_IDS.facultyCollegeAMembership,
      role: "MENTOR",
      isPrimary: true,
    },
  );

  return project;
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P7A resources and readiness", () => {
  it("stores API-created metadata-only documents as DRAFT and refuses early publication",async()=>{
    const project=await createProject();
    await pool.query("update project_instances set status='ACTIVE' where id=$1",[project.id]);
    const initial=await createProjectResource(mentor,project.id,{
      title:"Unattached document",resourceType:"DOCUMENT",status:"ACTIVE",
      visibility:"TEAM",
    });
    // A forged direct API request cannot announce that empty metadata is a
    // published downloadable file. The UI and service enforce the same rule.
    expect(initial.status).toBe("DRAFT");
    expect((await listProjectResources(learner,project.id))
      .some(row=>row.id===initial.id)).toBe(false);
    await expect(updateProjectResource(mentor,project.id,initial.id,{
      status:"ACTIVE",expectedUpdatedAt:initial.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_RESOURCE_INVALID_STATE"});
    const read=await pool.query<{status:string}>(
      "select status from project_resources where id=$1",[initial.id]);
    expect(read.rows[0]?.status).toBe("DRAFT");
  });

  it("keeps file drafts private until activation, and restores only with a fresh version", async () => {
    const project=await createProject();
    await pool.query("update project_instances set status='ACTIVE' where id=$1",[project.id]);
    await expect(createProjectResource(learner,project.id,{
      title:"Forged empty learner file",resourceType:"FILE",
    })).rejects.toMatchObject({code:"PROJECT_RESOURCE_INVALID_STATE"});
    const unread=async()=>{
      const result=await pool.query<{total:string}>(`select count(*)::text as total
        from in_app_notifications n
        inner join activity_events e on e.id=n.event_id
        where n.user_id=$1 and e.subject_type='project_resource'
          and e.metadata->>'projectId'=$2`,[SEED_IDS.learnerUser,project.id]);
      return Number(result.rows[0]?.total??0);
    };
    const before=await unread();
    const draft=await createProjectResource(mentor,project.id,{
      title:"Private draft placeholder",resourceType:"FILE",status:"DRAFT",
      visibility:"TEAM",
    });
    expect(draft.status).toBe("DRAFT");
    expect((await listProjectResources(learner,project.id)).some(item=>item.id===draft.id))
      .toBe(false);
    expect(await unread()).toBe(before);
    const active=await updateProjectResource(mentor,project.id,draft.id,{
      expectedUpdatedAt:draft.updatedAt.toISOString(),
      url:"https://example.com/ready-reference.pdf",status:"ACTIVE",
    });
    expect(active.status).toBe("ACTIVE");
    expect((await listProjectResources(learner,project.id)).some(item=>item.id===draft.id))
      .toBe(true);
    expect(await unread()).toBeGreaterThan(before);
    const archived=await archiveProjectResource(mentor,project.id,draft.id,{
      expectedUpdatedAt:active.updatedAt.toISOString(),
    });
    expect(archived.status).toBe("ARCHIVED");
    expect((await listProjectResources(learner,project.id)).some(item=>item.id===draft.id))
      .toBe(false);
    await expect(updateProjectResource(mentor,project.id,draft.id,{
      status:"ACTIVE",expectedUpdatedAt:active.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_RESOURCE_STALE_VERSION"});
    const restored=await updateProjectResource(mentor,project.id,draft.id,{
      status:"ACTIVE",expectedUpdatedAt:archived.updatedAt.toISOString(),
    });
    expect(restored.status).toBe("ACTIVE");
    expect((await listProjectResources(learner,project.id)).some(item=>item.id===draft.id))
      .toBe(true);
  });

  it("keeps template provenance separate from mentor-added resources", async () => {
    const project = await createProject();

    await expect(
      createProjectResource(
        learner,
        project.id,
        {
          title: "Learner mutation",
          url: "https://example.com/no",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_RESOURCE_INVALID_STATE",
    });

    const created = await createProjectResource(
      mentor,
      project.id,
      {
        title: "Mentor guide",
        description: "Use this during the sprint.",
        url: "https://example.com/mentor-guide",
        required: false,
      },
    );

    // Every resource now receives a stable, project-unique resource key derived
    // from its title; it never reuses the template-provided key.
    expect(created).toMatchObject({
      templateKey: "mentor-guide",
      sequence: 1,
      status: "ACTIVE",
    });

    const updated = await updateProjectResource(
      collegeAdmin,
      project.id,
      created.id,
      {
        title: "Updated mentor guide",
        required: true,
      },
    );
    expect(updated).toMatchObject({
      title: "Updated mentor guide",
      required: true,
    });

    let visible = await listProjectResources(
      learner,
      project.id,
    );
    expect(visible).toHaveLength(2);
    expect(visible[0]?.templateKey).toBe(
      "template-guide",
    );
    // Renaming does not rewrite the stable key assigned on creation.
    expect(visible[1]?.templateKey).toBe("mentor-guide");

    await archiveProjectResource(
      mentor,
      project.id,
      created.id,
      { expectedUpdatedAt: updated.updatedAt.toISOString() },
    );
    visible = await listProjectResources(
      learner,
      project.id,
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.templateKey).toBe(
      "template-guide",
    );
  });

  it("derives readiness from normalized lifecycle and final-delivery state", async () => {
    const project = await createProject();

    let readiness = await getProjectReadiness(
      learner,
      project.id,
    );
    expect(readiness).toMatchObject({
      projectStatus: "PLANNED",
      execution: {
        complete: false,
        releases: { total: 1, shipped: 0 },
        sprints: { total: 1, completed: 0 },
        tasks: { total: 1, done: 0 },
      },
      finalSubmission: {
        latest: null,
        canCreateDraft: true,
        canSubmitDraft: false,
        approved: false,
      },
      evaluation: {
        exists: false,
        canEvaluate: false,
      },
    });

    const draft =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Prepared early",
          sourceUrl:
            "https://example.com/final",
        },
      );

    readiness = await getProjectReadiness(
      mentor,
      project.id,
    );
    expect(readiness.finalSubmission).toMatchObject({
      latest: {
        id: draft.id,
        status: "DRAFT",
        version: 1,
      },
      canCreateDraft: false,
      canSubmitDraft: false,
    });

    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const sprint = workspace.sprints[0]!;
    const task = workspace.tasks[0]!;
    const release = workspace.releases[0]!;

    await startProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );
    await approveProjectTaskThroughReview({learner,mentor,projectId:project.id,taskId:task.id});
    await completeProjectSprint(
      mentor,
      project.id,
      sprint.id,
    );
    await shipProjectRelease(
      mentor,
      project.id,
      release.id,
      await releaseVersion(release.id),
    );

    readiness = await getProjectReadiness(
      learner,
      project.id,
    );
    expect(readiness).toMatchObject({
      projectStatus: "ACTIVE",
      execution: {
        complete: true,
        releases: { total: 1, shipped: 1 },
        sprints: { total: 1, completed: 1 },
        tasks: { total: 1, done: 1 },
      },
      finalSubmission: {
        canCreateDraft: false,
        canSubmitDraft: true,
      },
    });
  });

  it("enforces the no-empty-resource rule on create and update", async () => {
    const project = await createProject();

    await expect(
      createProjectResource(
        mentor,
        project.id,
        { title: "Empty resource" },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });

    const resource = await createProjectResource(
      mentor,
      project.id,
      {
        title: "Described resource",
        description: "Useful notes",
      },
    );

    await expect(
      updateProjectResource(
        mentor,
        project.id,
        resource.id,
        {
          description: null,
          url: null,
          expectedUpdatedAt: resource.updatedAt.toISOString(),
        },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
  });
});
