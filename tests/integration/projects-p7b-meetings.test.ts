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
  listMyProjectInstances,
} from "@/modules/projects/member-service";
import {
  createProjectInstance,
  getProjectInstanceWorkspace,
} from "@/modules/projects/instance-service";
import {
  listProjectMeetings,
  requestProjectMeeting,
  scheduleProjectMeeting,
  transitionProjectMeeting,
} from "@/modules/projects/meeting-service";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
} from "@/modules/projects/template-service";
import { listMyMentorCalendarMeetings } from "@/modules/projects/mentor-calendar-service";
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

function blueprint() {
  return {
    overview: {
      goal: "P7 meetings",
      deliverables: ["Meeting workflow"],
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
    resources: [],
  };
}

async function cleanup() {
  await pool.query(
    `delete from project_meetings
     where project_id in (
       select id from project_instances
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    `delete from project_members
     where project_id in (
       select id from project_instances
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    `delete from project_resources
     where project_id in (
       select id from project_instances
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    `delete from project_tasks
     where project_id in (
       select id from project_instances
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    `delete from project_sprints
     where project_id in (
       select id from project_instances
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    `delete from project_releases
     where project_id in (
       select id from project_instances
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    "delete from project_instances where slug like 'p7b-%'",
  );
  await pool.query(
    `delete from project_template_college_assignments
     where template_id in (
       select id from project_templates
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    `delete from project_template_versions
     where template_id in (
       select id from project_templates
       where slug like 'p7b-%'
     )`,
  );
  await pool.query(
    "delete from project_templates where slug like 'p7b-%'",
  );
}

async function createProject() {
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p7b-meeting-template",
      title: "P7B Meeting Template",
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
      slug: "p7b-meeting-project",
      title: "P7B Meeting Project",
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

const requestedWindow = {
  title: "Sprint help",
  agenda: "Clarify the acceptance criteria",
  startsAt: "2099-10-10T10:00:00+05:30",
  endsAt: "2099-10-10T10:30:00+05:30",
  timeZone: "Asia/Kolkata" as const,
};

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Projects P7B meetings", () => {
  it("lets a learner request and a mentor schedule then complete a meeting", async () => {
    const project = await createProject();
    const request = await requestProjectMeeting(
      learner,
      project.id,
      requestedWindow,
    );

    expect(request).toMatchObject({
      status: "REQUESTED",
      meetingType: "GENERAL",
      requestedByMembershipId:
        SEED_IDS.learnerCollegeAMembership,
      meetingUrl: null,
    });

    await expect(
      scheduleProjectMeeting(
        learner,
        project.id,
        request.id,
        {
          ...requestedWindow,
          meetingUrl:
            "https://meet.example.com/project",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_LIFECYCLE_ACCESS_DENIED",
    });

    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );
    const scheduled =
      await scheduleProjectMeeting(
        mentor,
        project.id,
        request.id,
        {
          ...requestedWindow,
          meetingType: "REVIEW",
          meetingUrl:
            "https://meet.example.com/project",
          linkedSprintId:
            workspace.sprints[0]!.id,
          linkedTaskId: workspace.tasks[0]!.id,
        },
      );

    expect(scheduled).toMatchObject({
      id: request.id,
      status: "SCHEDULED",
      meetingType: "REVIEW",
      meetingUrl:
        "https://meet.example.com/project",
      scheduledByUserId: SEED_IDS.facultyUser,
    });

    await expect(
      transitionProjectMeeting(
        learner,
        project.id,
        request.id,
        {
          action: "COMPLETE",
          outcome: "Should be denied",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEETING_ACCESS_DENIED",
    });

    const completed =
      await transitionProjectMeeting(
        mentor,
        project.id,
        request.id,
        {
          action: "COMPLETE",
          outcome:
            "Acceptance criteria clarified.",
        },
      );
    expect(completed).toMatchObject({
      status: "COMPLETED",
      outcome:
        "Acceptance criteria clarified.",
    });

    await expect(
      transitionProjectMeeting(
        mentor,
        project.id,
        request.id,
        { action: "CANCEL" },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEETING_INVALID_STATE",
    });

    const visible = await listProjectMeetings(
      learner,
      project.id,
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.status).toBe("COMPLETED");
  });

  it("lets a learner cancel only their own pending request", async () => {
    const project = await createProject();
    const request = await requestProjectMeeting(
      learner,
      project.id,
      requestedWindow,
    );

    const cancelled =
      await transitionProjectMeeting(
        learner,
        project.id,
        request.id,
        {
          action: "CANCEL",
          note: "No longer needed",
        },
      );

    expect(cancelled).toMatchObject({
      status: "CANCELLED",
      cancellationNote: "No longer needed",
    });
  });

  it("supports direct mentor/admin scheduling with validated project links", async () => {
    const project = await createProject();
    const workspace =
      await getProjectInstanceWorkspace(
        mentor,
        project.id,
      );

    const meeting = await scheduleProjectMeeting(
      collegeAdmin,
      project.id,
      null,
      {
        title: "Planning",
        startsAt:
          "2099-10-11T11:00:00+05:30",
        endsAt:
          "2099-10-11T11:45:00+05:30",
        timeZone: "Asia/Kolkata" as const,
        meetingType: "PLANNING",
        meetingUrl:
          "https://meet.example.com/planning",
        linkedSprintId:
          workspace.sprints[0]!.id,
      },
    );

    expect(meeting).toMatchObject({
      status: "SCHEDULED",
      meetingType: "PLANNING",
      linkedSprintId:
        workspace.sprints[0]!.id,
      scheduledByUserId:
        SEED_IDS.collegeAdminUser,
    });

    await expect(
      scheduleProjectMeeting(
        mentor,
        project.id,
        null,
        {
          title: "Bad link",
          startsAt:
            "2099-10-12T11:00:00+05:30",
          endsAt:
            "2099-10-12T11:30:00+05:30",
          timeZone: "Asia/Kolkata" as const,
          meetingUrl:
            "https://meet.example.com/bad",
          linkedTaskId:
            "00000000-0000-4000-8000-000000000001",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEETING_LINK_INVALID",
    });
  });

  it("rejects invalid windows in validation and PostgreSQL", async () => {
    const project = await createProject();

    await expect(
      requestProjectMeeting(
        learner,
        project.id,
        {
          ...requestedWindow,
          startsAt:
            "2099-10-10T11:00:00+05:30",
          endsAt:
            "2099-10-10T10:00:00+05:30",
        },
      ),
    ).rejects.toMatchObject({
      name: "ZodError",
    });

    await expect(
      pool.query(
        `insert into project_meetings
          (project_id, title, starts_at, ends_at, time_zone,
           requested_by_membership_id, created_by_user_id)
         values ($1, 'Bad time', $2, $3, 'Asia/Kolkata', $4, $5)`,
        [
          project.id,
          "2099-10-10T11:00:00+05:30",
          "2099-10-10T10:00:00+05:30",
          SEED_IDS.learnerCollegeAMembership,
          SEED_IDS.learnerUser,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint:
        "project_meetings_time_order_ck",
    });
  });
  it("aggregates only active mentor assignments into the personal calendar", async () => {
    const project = await createProject();
    const pending = await requestProjectMeeting(learner,project.id,requestedWindow);
    const rows = await listMyMentorCalendarMeetings(mentor);
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id:pending.id,projectId:project.id,projectTitle:project.title,
        status:"REQUESTED",timeZone:"Asia/Kolkata" as const,
      }),
    ]));
    expect(rows.find(x=>x.id===pending.id)?.endsAt).toContain("T");
    await expect(listMyMentorCalendarMeetings({
      ...mentor,membership:{...mentor.membership!,roles:["FACULTY"]},
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    await expect(listMyMentorCalendarMeetings({
      ...mentor,membership:{...mentor.membership!,status:"SUSPENDED"},
    })).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    const otherCollege = await listMyMentorCalendarMeetings({
      ...mentor,membership:{...mentor.membership!,collegeId:SEED_IDS.collegeB},
    });
    expect(otherCollege.some(x=>x.id===pending.id)).toBe(false);
  });

  it("cannot revive a cancelled or completed meeting through a stale schedule", async () => {
    const project = await createProject();
    const request = await requestProjectMeeting(learner,project.id,requestedWindow);
    await transitionProjectMeeting(learner,project.id,request.id,{action:"CANCEL"});
    await expect(scheduleProjectMeeting(mentor,project.id,request.id,{
      ...requestedWindow,meetingUrl:"https://meet.example.com/revived",
    })).rejects.toMatchObject({code:"PROJECT_MEETING_INVALID_STATE"});
    const [meeting] = await listProjectMeetings(mentor,project.id);
    expect(meeting).toMatchObject({id:request.id,status:"CANCELLED"});
  });

  it("denies disabled platform accounts in both project list and direct workspace reads",async()=>{
    const project=await createProject();
    const disabled: RequestContext = {
      ...mentor,
      user:{...mentor.user,platformStatus:"DISABLED"},
    };
    await expect(listMyProjectInstances(disabled))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    await expect(listProjectMeetings(disabled,project.id))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  });

});
