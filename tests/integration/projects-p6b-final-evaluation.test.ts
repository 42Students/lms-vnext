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
  createProjectEvaluation,
  getProjectEvaluation,
} from "@/modules/projects/evaluation-service";
import {
  createProjectSubmissionDraft,
  listProjectSubmissions,
  reviewProjectSubmission,
  submitProjectSubmission,
  updateProjectSubmissionDraft,
} from "@/modules/projects/submission-service";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
} from "@/modules/projects/template-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {approveProjectTaskThroughReview} from "./support/projects-review-fixture";
import {reopenApprovedProjectDelivery} from "@/modules/projects/delivery-reopen-service";

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

function blueprint() {
  return {
    overview: {
      goal: "P6 final delivery",
      deliverables: ["Final demo"],
    },
    releases: [
      {
        key: "release-1",
        title: "P6 Release",
        sequence: 0,
      },
    ],
    sprints: [
      {
        key: "sprint-1",
        releaseKey: "release-1",
        title: "P6 Sprint",
        sequence: 0,
      },
    ],
    tasks: [
      {
        key: "task-1",
        sprintKey: "sprint-1",
        title: "P6 Task",
        priority: "HIGH" as const,
        sequence: 0,
      },
    ],
    resources: [],
  };
}

async function cleanup() {
  await pool.query(
    `delete from in_app_notifications
     where event_id in (
       select id from activity_events where module='PROJECTS'
       and metadata ->> 'projectId' in (
         select id::text from project_instances where slug like 'p6b-%'
       )
     )`,
  );
  await pool.query(
    `delete from activity_events where module='PROJECTS'
     and metadata ->> 'projectId' in (
       select id::text from project_instances where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_evaluation_items
     where evaluation_id in (
       select id from project_evaluations
       where project_id in (
         select id from project_instances
         where slug like 'p6b-%'
       )
     )`,
  );
  await pool.query(
    `delete from project_evaluations
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_submission_reviews
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_delivery_events
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_task_submissions
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p6b-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p6b-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p6b-%'",
  );
}

async function createProject() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p6b-final-template",
      title: "P6B Final Template",
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
      slug: "p6b-final-project",
      title: "P6B Final Project",
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

async function finishExecution(
  projectId: string,
) {
  const workspace =
    await getProjectInstanceWorkspace(
      mentor,
      projectId,
    );
  const sprint = workspace.sprints[0]!;
  const task = workspace.tasks[0]!;
  const release = workspace.releases[0]!;

  await startProjectSprint(
    mentor,
    projectId,
    sprint.id,
  );
  await approveProjectTaskThroughReview({learner,mentor,projectId,taskId:task.id});
  await completeProjectSprint(
    mentor,
    projectId,
    sprint.id,
  );
  const currentRelease=(await getProjectInstanceWorkspace(mentor,projectId))
    .releases.find(item=>item.id===release.id);
  if(!currentRelease)throw new Error("Release no longer belongs to project");
  await shipProjectRelease(
    mentor,
    projectId,
    release.id,
    {expectedUpdatedAt:currentRelease.updatedAt.toISOString()},
  );
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P6B final delivery and evaluation", () => {
  it("PROJ-BREAK-submissions-10 supports draft editing, gates readiness and enforces exact saved revision", async () => {
    const project = await createProject();

    const draft =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Initial final delivery",
        },
      );
    expect(draft).toMatchObject({
      version: 1,
      status: "DRAFT",
    });

    const updated =
      await updateProjectSubmissionDraft(
        learner,
        project.id,
        draft.id,
        {
          summary: "Ready final delivery",
          sourceUrl:
            "https://example.com/source",
          demoUrl:
            "https://example.com/demo",
          expectedUpdatedAt:draft.updatedAt.toISOString(),
        },
      );
    expect(updated.sourceUrl).toBe(
      "https://example.com/source",
    );

    await expect(
      submitProjectSubmission(
        learner,
        project.id,
        draft.id,
        {expectedUpdatedAt:updated.updatedAt.toISOString()},
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SUBMISSION_INVALID_STATE",
    });

    await finishExecution(project.id);

    // A stale browser must never submit an edited revision from a second
    // session, even when the project execution readiness has become complete.
    await expect(submitProjectSubmission(learner,project.id,draft.id,{
      expectedUpdatedAt:"2099-01-01T00:00:00.000Z",
    })).rejects.toMatchObject({code:"PROJECT_SUBMISSION_CONFLICT"});

    await expect(
      submitProjectSubmission(
        learner,
        project.id,
        draft.id,
        {expectedUpdatedAt:updated.updatedAt.toISOString()},
      ),
    ).resolves.toMatchObject({
      status: "SUBMITTED",
      submittedByMembershipId:
        SEED_IDS.learnerCollegeAMembership,
    });
  });

  it("keeps immutable review history across final submission versions", async () => {
    const project = await createProject();
    await finishExecution(project.id);

    const first =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Version one",
          sourceUrl:
            "https://example.com/v1",
        },
      );
    await submitProjectSubmission(
      learner,
      project.id,
      first.id,
      {expectedUpdatedAt:first.updatedAt.toISOString()},
    );

    const changes =
      await reviewProjectSubmission(
        mentor,
        project.id,
        first.id,
        {
          decision: "CHANGES_REQUESTED",
          feedback: "Improve the demo evidence.",
        },
      );
    expect(changes.submission.status).toBe(
      "CHANGES_REQUESTED",
    );

    const second =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Version two",
          sourceUrl:
            "https://example.com/v2",
          demoUrl:
            "https://example.com/v2-demo",
        },
      );
    expect(second.version).toBe(2);
    await submitProjectSubmission(
      learner,
      project.id,
      second.id,
      {expectedUpdatedAt:second.updatedAt.toISOString()},
    );

    const approved =
      await reviewProjectSubmission(
        collegeAdmin,
        project.id,
        second.id,
        {
          decision: "APPROVED",
          feedback: "Approved for evaluation.",
        },
      );
    expect(approved.submission.status).toBe(
      "APPROVED",
    );

    const audit = await pool.query<{
      event_type:string;subject_id:string;metadata:{projectId:string;version:number;decision?:string};
      summary:string;
    }>(
      `select event_type,subject_id,metadata,summary from activity_events
       where module='PROJECTS' and metadata ->> 'projectId' = $1::text
         and event_type like 'projects.delivery.%'
       order by occurred_at,id`,
      [project.id],
    );
    expect(audit.rows.map(row=>row.event_type).sort()).toEqual([
      "projects.delivery.draft_created","projects.delivery.draft_created","projects.delivery.locked",
      "projects.delivery.reviewed","projects.delivery.reviewed",
      "projects.delivery.submitted","projects.delivery.submitted",
    ].sort());
    expect(audit.rows.filter(row=>row.event_type==="projects.delivery.reviewed")
      .map(row=>row.metadata.decision).sort()).toEqual(["APPROVED","CHANGES_REQUESTED"]);
    expect(audit.rows.every(row=>row.subject_id===first.id||row.subject_id===second.id)).toBe(true);
    expect(audit.rows.every(row=>row.metadata.projectId===project.id)).toBe(true);
    expect(JSON.stringify(audit.rows)).not.toMatch(/example.com|Improve the demo evidence|Approved for evaluation/);

    const history =
      await listProjectSubmissions(
        learner,
        project.id,
      );
    expect(
      history.submissions.map(
        (item) => item.status,
      ),
    ).toEqual([
      "CHANGES_REQUESTED",
      "APPROVED",
    ]);
    expect(history.reviews).toHaveLength(2);
    expect(
      history.reviews.map(
        (item) => item.decision,
      ),
    ).toEqual([
      "CHANGES_REQUESTED",
      "APPROVED",
    ]);
  });

  it("locks approved delivery, audits mentor reopen, then permits exactly one new draft version",async()=>{
    const project=await createProject();
    await finishExecution(project.id);
    const draft=await createProjectSubmissionDraft(learner,project.id,{
      summary:"Initial accepted delivery",sourceUrl:"https://example.com/final-approved",
    });
    const submitted=await submitProjectSubmission(learner,project.id,draft.id,{expectedUpdatedAt:draft.updatedAt.toISOString()});
    const outcome=await reviewProjectSubmission(mentor,project.id,submitted.id,{
      decision:"APPROVED",
    });
    expect(outcome.submission.status).toBe("APPROVED");
    expect(outcome.submission.lockedAt).not.toBeNull();
    await expect(createProjectSubmissionDraft(learner,project.id,{
      summary:"Cannot draft without mentor reopen",
    })).rejects.toMatchObject({code:"PROJECT_SUBMISSION_INVALID_STATE"});
    const reopened=await reopenApprovedProjectDelivery(mentor,project.id,submitted.id,{
      expectedUpdatedAt:outcome.submission.updatedAt.toISOString(),
      reason:"Needs an additional demonstration",
    });
    expect(reopened.reopened).toBe(true);
    await expect(reopenApprovedProjectDelivery(mentor,project.id,submitted.id,{
      expectedUpdatedAt:outcome.submission.updatedAt.toISOString(),reason:"Replay",
    })).rejects.toMatchObject({code:"PROJECT_SUBMISSION_INVALID_STATE"});
    const later=await createProjectSubmissionDraft(learner,project.id,{
      summary:"Resubmission after approved review",sourceUrl:"https://example.com/revised",
    });
    expect(later.version).toBe(2);
    const stored=await pool.query<{locked_at:Date;reopened_at:Date}>(`
      select locked_at,reopened_at from project_submissions where id=$1
    `,[submitted.id]);
    expect(stored.rows[0]?.locked_at).toBeTruthy();
    expect(stored.rows[0]?.reopened_at).toBeTruthy();
    const deliveryEvents=await pool.query<{event_type:string}>(`
      select event_type from project_delivery_events
      where project_id=$1 and submission_id=$2 order by occurred_at
    `,[project.id,submitted.id]);
    expect(deliveryEvents.rows.map(row=>row.event_type).sort()).toEqual(["LOCKED","REOPENED"]);
    const events=await pool.query<{event_type:string}>(`
      select event_type from activity_events where subject_id=$1 and
      event_type in ('projects.delivery.locked','projects.delivery.reopened')
      order by occurred_at,event_type
    `,[submitted.id]);
    expect(events.rows.map(row=>row.event_type).sort()).toEqual([
      "projects.delivery.locked","projects.delivery.reopened",
    ]);
  });

  it("round-trips registered 0091 LINK attachment metadata and append-only events",async()=>{
    const project=await createProject();
    const link={kind:"LINK" as const,name:"Demo",fileId:null,url:"https://example.com/safe"};
    const draft=await createProjectSubmissionDraft(learner,project.id,{
      summary:"Link roundtrip",attachments:[link],
    });
    expect(draft.attachments).toEqual([link]);
    const updated=await updateProjectSubmissionDraft(learner,project.id,draft.id,{
      summary:"Updated links",attachments:[{...link,url:"https://example.com/revised"}],
      expectedUpdatedAt:draft.updatedAt.toISOString(),
    });
    expect(updated.attachments).toHaveLength(1);
    const rows=await pool.query<{event_type:string}>(`
      select event_type from project_delivery_events
      where project_id=$1 and submission_id=$2 order by occurred_at
    `,[project.id,draft.id]);
    expect(rows.rows.map(row=>row.event_type)).toEqual(["ATTACHMENTS_CHANGED","ATTACHMENTS_CHANGED"]);
    await expect(createProjectSubmissionDraft(learner,project.id,{
      summary:"Unsafe",attachments:[{...link,url:"javascript:alert(1)"}],
    })).rejects.toMatchObject({name:"ZodError"});
  });

  it("creates one rubric evaluation only for an approved submission and exposes it only to authorized reviewers", async () => {
    const project = await createProject();
    await finishExecution(project.id);

    const draft =
      await createProjectSubmissionDraft(
        learner,
        project.id,
        {
          summary: "Evaluation candidate",
          sourceUrl:
            "https://example.com/eval",
        },
      );
    await submitProjectSubmission(
      learner,
      project.id,
      draft.id,
      {expectedUpdatedAt:draft.updatedAt.toISOString()},
    );

    await expect(
      createProjectEvaluation(
        mentor,
        project.id,
        draft.id,
        {
          items: [
            {
              criterion: "Engineering quality",
              score: 8,
              maxScore: 10,
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_EVALUATION_INVALID_STATE",
    });

    await reviewProjectSubmission(
      mentor,
      project.id,
      draft.id,
      {
        decision: "APPROVED",
      },
    );

    const created =
      await createProjectEvaluation(
        mentor,
        project.id,
        draft.id,
        {
          summary: "Strong final project",
          items: [
            {
              criterion: "Engineering quality",
              score: 8,
              maxScore: 10,
              feedback: "Well structured.",
            },
            {
              criterion: "Delivery",
              score: 18,
              maxScore: 20,
            },
          ],
        },
      );
    expect(created.evaluation).toMatchObject({
      totalScore: 26,
      maxScore: 30,
    });
    expect(created.items).toHaveLength(2);

    const activity =
      await pool.query<{
        event_type: string;
      }>(
        `select event_type
           from activity_events
          where dedupe_key = $1`,
        [
          `project-evaluation:${created.evaluation.id}:recorded`,
        ],
      );
    expect(activity.rows).toEqual([
      {
        event_type:
          "projects.evaluation.recorded",
      },
    ]);

    await expect(
      createProjectEvaluation(
        collegeAdmin,
        project.id,
        draft.id,
        {
          items: [
            {
              criterion: "Duplicate",
              score: 1,
              maxScore: 1,
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_EVALUATION_CONFLICT",
    });

    // An approved delivery is not an audited release of private rubric scores.
    await expect(getProjectEvaluation(learner,project.id,draft.id))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    const visible =
      await getProjectEvaluation(
        mentor,
        project.id,
        draft.id,
      );
    expect(visible).toMatchObject({
      evaluation: {
        totalScore: 26,
        maxScore: 30,
      },
    });
  });

  it("rejects all final delivery writes on a soft-deleted project without changing saved rows",async()=>{
    const project=await createProject();
    const draft=await createProjectSubmissionDraft(learner,project.id,{
      summary:"Original safe draft",sourceUrl:"https://example.com/original",
    });
    await finishExecution(project.id);
    await pool.query("UPDATE project_instances SET deleted_at=now() WHERE id=$1",[project.id]);
    try{
      await expect(createProjectSubmissionDraft(learner,project.id,{
        summary:"Forbidden deleted-project draft",
      })).rejects.toBeDefined();
      await expect(updateProjectSubmissionDraft(learner,project.id,draft.id,{
        summary:"Forbidden deleted-project edit",
        expectedUpdatedAt:draft.updatedAt.toISOString(),
      })).rejects.toBeDefined();
      await expect(submitProjectSubmission(learner,project.id,draft.id,{
        expectedUpdatedAt:draft.updatedAt.toISOString(),
      })).rejects.toBeDefined();
      const saved=await pool.query<{status:string;summary:string;updated_at:Date}>(
        "SELECT status,summary,updated_at FROM project_submissions WHERE id=$1",[draft.id]);
      expect(saved.rows[0]?.status).toBe("DRAFT");
      expect(saved.rows[0]?.summary).toBe("Original safe draft");
      expect(saved.rows[0]?.updated_at.getTime()).toBe(draft.updatedAt.getTime());
      const count=await pool.query<{total:string}>(
        "SELECT count(*)::text AS total FROM project_submissions WHERE project_id=$1",[project.id]);
      expect(count.rows[0]?.total).toBe("1");
    }finally{
      await pool.query("UPDATE project_instances SET deleted_at=null WHERE id=$1",[project.id]);
    }
    const sent=await submitProjectSubmission(learner,project.id,draft.id,{
      expectedUpdatedAt:draft.updatedAt.toISOString(),
    });
    expect(sent.status).toBe("SUBMITTED");
    await pool.query("UPDATE project_instances SET deleted_at=now() WHERE id=$1",[project.id]);
    try{
      await expect(reviewProjectSubmission(mentor,project.id,draft.id,{
        decision:"APPROVED",feedback:"Should never persist",
      })).rejects.toBeDefined();
      const reviews=await pool.query<{total:string}>(
        "SELECT count(*)::text AS total FROM project_submission_reviews WHERE submission_id=$1",
        [draft.id]);
      expect(reviews.rows[0]?.total).toBe("0");
      const stillSubmitted=await pool.query<{status:string}>(
        "SELECT status FROM project_submissions WHERE id=$1",[draft.id]);
      expect(stillSubmitted.rows[0]?.status).toBe("SUBMITTED");
    }finally{
      await pool.query("UPDATE project_instances SET deleted_at=null WHERE id=$1",[project.id]);
    }
  });

  it("requires persisted live learner and Mentor grants at each final-delivery write",async()=>{
    const project=await createProject();
    const setMutate=async(role:"LEARNER"|"MENTOR",value:boolean)=>{
      await pool.query("UPDATE project_members SET can_mutate=$1 WHERE project_id=$2 AND role=$3",
        [value,project.id,role]);
    };
    await setMutate("LEARNER",false);
    try{
      await expect(createProjectSubmissionDraft(learner,project.id,{
        summary:"Should not create",
      })).rejects.toBeDefined();
      const rows=await pool.query<{n:string}>(
        "SELECT count(*)::text AS n FROM project_submissions WHERE project_id=$1",[project.id]);
      expect(rows.rows[0]?.n).toBe("0");
    }finally{await setMutate("LEARNER",true);}
    const draft=await createProjectSubmissionDraft(learner,project.id,{
      summary:"Persisted revision",sourceUrl:"https://example.com/review",
    });
    await finishExecution(project.id);
    await setMutate("LEARNER",false);
    try{
      await expect(updateProjectSubmissionDraft(learner,project.id,draft.id,{
        summary:"Forbidden stale role update",
        expectedUpdatedAt:draft.updatedAt.toISOString(),
      })).rejects.toBeDefined();
      await expect(submitProjectSubmission(learner,project.id,draft.id,{
        expectedUpdatedAt:draft.updatedAt.toISOString(),
      })).rejects.toBeDefined();
      const row=await pool.query<{summary:string;status:string}>(
        "SELECT summary,status FROM project_submissions WHERE id=$1",[draft.id]);
      expect(row.rows[0]).toMatchObject({summary:"Persisted revision",status:"DRAFT"});
    }finally{await setMutate("LEARNER",true);}
    const sent=await submitProjectSubmission(learner,project.id,draft.id,{
      expectedUpdatedAt:draft.updatedAt.toISOString(),
    });
    expect(sent.status).toBe("SUBMITTED");
    await setMutate("MENTOR",false);
    try{
      await expect(reviewProjectSubmission(mentor,project.id,draft.id,{
        decision:"APPROVED",feedback:"Should be rolled back",
      })).rejects.toBeDefined();
      const reviews=await pool.query<{n:string}>(
        "SELECT count(*)::text AS n FROM project_submission_reviews WHERE submission_id=$1",[draft.id]);
      expect(reviews.rows[0]?.n).toBe("0");
    }finally{await setMutate("MENTOR",true);}
  });

  it("blocks non-learners from final submission authoring and enforces DB review/score invariants", async () => {
    const project = await createProject();

    await expect(
      createProjectSubmissionDraft(
        mentor,
        project.id,
        {
          summary: "Mentor cannot author",
          sourceUrl:
            "https://example.com/nope",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_SUBMISSION_ACCESS_DENIED",
    });

    await expect(
      pool.query(
        `insert into project_evaluations
          (project_id, submission_id, evaluator_user_id, total_score, max_score)
         values ($1, $2, $3, 11, 10)`,
        [
          project.id,
          "00000000-0000-4000-8000-000000000001",
          SEED_IDS.facultyUser,
        ],
      ),
    ).rejects.toMatchObject({
      code: expect.stringMatching(/23503|23514/),
    });
  });
});
