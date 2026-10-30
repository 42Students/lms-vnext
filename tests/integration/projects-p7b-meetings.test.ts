import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import {randomUUID} from "node:crypto";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
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
import {respondToProjectMeeting,listProjectMeetingRsvpFacts} from "@/modules/projects/mentor-meeting-rsvp-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Disposable TEST_DATABASE_URL is required for DB integration tests");
}

assertDb018DisposableTarget(process.env,{serviceBound:true});

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

// Meeting history is immutable. Each case owns a fresh project/template in the
// disposable database; suite teardown must never erase audited meeting rows.

async function createProject() {
  const nonce = randomUUID().slice(0,12);
  const template = await createProjectTemplate(
    superAdmin,
    {
      slug: "p7b-meeting-template-"+nonce,
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
      slug: "p7b-meeting-project-"+nonce,
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

afterAll(async () => {
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
          expectedUpdatedAt:request.updatedAt.toISOString(),
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

  it("cannot request or cancel a meeting after project soft deletion",async()=>{
    const project=await createProject();
    const request=await requestProjectMeeting(learner,project.id,requestedWindow);
    await pool.query("UPDATE project_instances SET deleted_at=now() WHERE id=$1",[project.id]);
    try{
      await expect(requestProjectMeeting(learner,project.id,{
        ...requestedWindow,
        startsAt:"2099-10-11T10:00:00+05:30",
        endsAt:"2099-10-11T10:30:00+05:30",
      })).rejects.toBeDefined();
      await expect(transitionProjectMeeting(learner,project.id,request.id,{
        action:"CANCEL",note:"Should not persist",
      })).rejects.toBeDefined();
      await expect(transitionProjectMeeting(mentor,project.id,request.id,{
        action:"CANCEL",note:"Should also be rejected",
      })).rejects.toBeDefined();
      const stored=await pool.query<{status:string;cancellation_note:string|null}>(
        "SELECT status,cancellation_note FROM project_meetings WHERE id=$1",[request.id]);
      expect(stored.rows[0]).toMatchObject({
        status:"REQUESTED",cancellation_note:null,
      });
      const count=await pool.query<{total:string}>(
        "SELECT count(*)::text AS total FROM project_meetings WHERE project_id=$1",[project.id]);
      expect(count.rows[0]?.total).toBe("1");
    }finally{
      await pool.query("UPDATE project_instances SET deleted_at=null WHERE id=$1",[project.id]);
    }
  });

  it("persists member RSVPs and displays real in-app response counts, not provider receipts",async()=>{
    const project=await createProject();
    const request=await requestProjectMeeting(learner,project.id,requestedWindow);
    const scheduled=await scheduleProjectMeeting(mentor,project.id,request.id,{
      ...requestedWindow,expectedUpdatedAt:request.updatedAt.toISOString(),
      meetingUrl:"https://meet.example.com/project",
    });
    const input={response:"ACCEPTED" as const,
      expectedUpdatedAt:scheduled.updatedAt.toISOString()};
    await expect(respondToProjectMeeting(learner,project.id,request.id,input))
      .resolves.toMatchObject({response:"ACCEPTED",changed:true});
    await expect(respondToProjectMeeting(learner,project.id,request.id,input))
      .resolves.toMatchObject({response:"ACCEPTED",changed:false});
    await expect(respondToProjectMeeting(learner,project.id,request.id,{
      ...input,response:"DECLINED",expectedUpdatedAt:"2000-01-01T00:00:00Z",
    })).rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
    const facts=await listProjectMeetingRsvpFacts(mentor,project.id,[request.id]);
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({
      meetingId:request.id,accepted:1,declined:0,tentative:0,notRecorded:1,
      activeInvitees:2,myResponse:null,
    });
    const second=await respondToProjectMeeting(mentor,project.id,request.id,{
      ...input,response:"TENTATIVE",
    });
    expect(second.changed).toBe(true);
    const after=await listProjectMeetingRsvpFacts(learner,project.id,[request.id]);
    expect(after[0]).toMatchObject({accepted:1,tentative:1,notRecorded:0,
      myResponse:"ACCEPTED"});
    const notices=await pool.query<{count:string}>(`
      select count(*)::text as count from activity_events where
      subject_id=$1 and event_type='projects.meeting.rsvp'
      and actor_user_id=$2`,[request.id,SEED_IDS.learnerUser]);
    expect(notices.rows[0]?.count).toBe("1");
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
          // Mentor scheduling requires a fresh optimistic project token;
          // otherwise stale-version denial correctly runs before link checks.
          expectedProjectUpdatedAt: (await getProjectInstanceWorkspace(mentor, project.id)).project.updatedAt.toISOString(),
          linkedTaskId:
            "00000000-0000-4000-8000-000000000001",
        },
      ),
    ).rejects.toMatchObject({
      code: "PROJECT_MEETING_LINK_INVALID",
    });
  });

  it("validates retained and partially cleared meeting links before saving an edit",async()=>{
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    const sprintId=workspace.sprints[0]!.id;
    const taskId=workspace.tasks[0]!.id;
    const window={
      title:"DB075 ancestry retention",startsAt:"2099-06-03T18:05:00+05:30",
      endsAt:"2099-06-03T18:35:00+05:30",
      timeZone:"Asia/Kolkata" as const,
      meetingUrl:"https://meet.example.com/db075-ancestry",
    };
    const first=await scheduleProjectMeeting(collegeAdmin,project.id,null,{
      ...window,linkedSprintId:sprintId,linkedTaskId:taskId,
    });
    // Older clients omit link fields when editing title or facilitation.
    // The retained final pair still requires same-project/same-sprint checks.
    const kept=await scheduleProjectMeeting(collegeAdmin,project.id,first.id,{
      ...window,title:"Edited DB075 meeting",
    });
    expect(kept).toMatchObject({
      linkedSprintId:sprintId,linkedTaskId:taskId,
      title:"Edited DB075 meeting",
    });
    // Null explicitly clears a sprint link without clearing the same-project task.
    const taskOnly=await scheduleProjectMeeting(collegeAdmin,project.id,kept.id,{
      ...window,title:"Task-only DB075 meeting",linkedSprintId:null,
    });
    expect(taskOnly).toMatchObject({
      linkedSprintId:null,linkedTaskId:taskId,
    });
    const foreignProject=await createProject();
    const foreign=await getProjectInstanceWorkspace(mentor,foreignProject.id);
    await expect(scheduleProjectMeeting(collegeAdmin,project.id,taskOnly.id,{
      ...window,title:"Invalid foreign sprint",linkedSprintId:foreign.sprints[0]!.id,
    })).rejects.toMatchObject({code:"PROJECT_MEETING_LINK_INVALID"});
    const stored=await pool.query<{
      linked_sprint_id:string|null;linked_task_id:string;title:string;
    }>("SELECT linked_sprint_id,linked_task_id,title FROM project_meetings WHERE id=$1",
      [first.id]);
    expect(stored.rows[0]).toMatchObject({
      linked_sprint_id:null,linked_task_id:taskId,title:"Task-only DB075 meeting",
    });
  });

  it("does not revive or notify for soft-deleted scheduled meetings",async()=>{
    const project=await createProject();
    const window={
      title:"Soft deleted meeting",startsAt:"2099-07-04T09:10:00+05:30",
      endsAt:"2099-07-04T09:40:00+05:30",
      timeZone:"Asia/Kolkata" as const,
      meetingUrl:"https://meet.example.com/deleted-meeting",
    };
    const scheduled=await scheduleProjectMeeting(collegeAdmin,project.id,null,window);
    await pool.query("UPDATE project_meetings SET deleted_at=now() WHERE id=$1",[scheduled.id]);
    await expect(scheduleProjectMeeting(collegeAdmin,project.id,scheduled.id,{
      ...window,title:"Must not revive",
      expectedUpdatedAt:scheduled.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_MEETING_NOT_FOUND"});
    const persisted=await pool.query<{title:string;deleted_at:Date|null}>(
      "SELECT title,deleted_at FROM project_meetings WHERE id=$1",[scheduled.id]);
    expect(persisted.rows[0]?.title).toBe(window.title);
    expect(persisted.rows[0]?.deleted_at).not.toBeNull();
  });

  it("persists in-person venues through real scheduling and rescheduling, with CAS and role checks",async()=>{
    const project=await createProject();
    const workspace=await getProjectInstanceWorkspace(mentor,project.id);
    const venueWindow={
      title:"In-person Sprint review",agenda:"Review the team demo",
      startsAt:"2099-12-27T13:05:00+05:30",
      endsAt:"2099-12-27T13:35:00+05:30",
      timeZone:"Asia/Kolkata" as const,
    };
    await expect(scheduleProjectMeeting(learner,project.id,null,{
      ...venueWindow,location:"Lab 2",
    })).rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
    const created=await scheduleProjectMeeting(mentor,project.id,null,{
      ...venueWindow,meetingUrl:null,location:"Lab 2",
      expectedProjectUpdatedAt:workspace.project.updatedAt.toISOString(),
    });
    expect(created).toMatchObject({status:"SCHEDULED",meetingUrl:null,
      agenda:"Location: Lab 2\nReview the team demo"});
    const stored=await pool.query<{agenda:string;meeting_url:string|null}>(
      "SELECT agenda,meeting_url FROM project_meetings WHERE id=$1",[created.id]);
    expect(stored.rows[0]).toEqual({
      agenda:"Location: Lab 2\nReview the team demo",meeting_url:null,
    });
    const nextWindow={...venueWindow,
      startsAt:"2099-12-27T13:35:00+05:30",
      endsAt:"2099-12-27T14:05:00+05:30",
      status:"RESCHEDULED" as const,location:"Room 304",
      // An editor sends agenda without the old Location: line.
      agenda:"Review the team demo",meetingUrl:null,
      expectedUpdatedAt:created.updatedAt.toISOString(),
    };
    const moved=await scheduleProjectMeeting(mentor,project.id,created.id,nextWindow);
    expect(moved).toMatchObject({status:"RESCHEDULED",meetingUrl:null,
      agenda:"Location: Room 304\nReview the team demo"});
    await expect(scheduleProjectMeeting(mentor,project.id,created.id,{
      ...nextWindow,location:"Lab 999",
    })).rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
    const latest=await listProjectMeetings(learner,project.id);
    expect(latest.find(item=>item.id===created.id)).toMatchObject({
      agenda:"Location: Room 304\nReview the team demo",meetingUrl:null,
    });
    // Replacing an in-person venue with a valid online link may remove the
    // old venue; invalid empty link + no venue cannot erase the meeting mode.
    await expect(scheduleProjectMeeting(mentor,project.id,created.id,{
      ...nextWindow,agenda:"Review the team demo",location:undefined,
      expectedUpdatedAt:moved.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_MEETING_INVALID_STATE"});
    const online=await scheduleProjectMeeting(mentor,project.id,created.id,{
      ...nextWindow,agenda:"Review the team demo",location:undefined,
      meetingUrl:"https://meet.example.com/updated-review",
      expectedUpdatedAt:moved.updatedAt.toISOString(),
    });
    expect(online).toMatchObject({meetingUrl:"https://meet.example.com/updated-review",
      agenda:"Review the team demo"});
    const count=await pool.query<{count:string}>(
      "SELECT count(*)::text AS count FROM project_meetings WHERE id=$1",[created.id]);
    expect(count.rows[0]?.count).toBe("1");
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
    const cancelled=await transitionProjectMeeting(learner,project.id,request.id,{action:"CANCEL"});
    await expect(scheduleProjectMeeting(mentor,project.id,request.id,{
      ...requestedWindow,meetingUrl:"https://meet.example.com/revived",
      expectedUpdatedAt:cancelled.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"PROJECT_MEETING_INVALID_STATE"});
    const [meeting] = await listProjectMeetings(mentor,project.id);
    expect(meeting).toMatchObject({id:request.id,status:"CANCELLED"});
  });

  it("serializes competing Mentor bookings across two projects and permits adjacent slots",async()=>{
    const projectA=await createProject(),projectB=await createProject();
    const [a,b]=await Promise.all([
      getProjectInstanceWorkspace(mentor,projectA.id),
      getProjectInstanceWorkspace(mentor,projectB.id),
    ]);
    const proposed={
      title:"Cross-project mentor office hour",
      startsAt:"2099-11-18T10:00:00+05:30",
      endsAt:"2099-11-18T10:30:00+05:30",
      timeZone:"Asia/Kolkata" as const,
      meetingUrl:"https://meet.example.com/cross-project",
    };
    const results=await Promise.allSettled([
      scheduleProjectMeeting(mentor,projectA.id,null,{
        ...proposed,expectedProjectUpdatedAt:a.project.updatedAt.toISOString(),
      }),
      scheduleProjectMeeting(mentor,projectB.id,null,{
        ...proposed,expectedProjectUpdatedAt:b.project.updatedAt.toISOString(),
      }),
    ]);
    const accepted=results.filter(result=>result.status==="fulfilled");
    const refused=results.filter(result=>result.status==="rejected");
    expect(accepted).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatchObject({
      reason:{code:"PROJECT_MEETING_SCHEDULE_CONFLICT"},
    });
    const meetings=await pool.query<{project_id:string}>(`
      select project_id from project_meetings where
      scheduled_by_user_id=$1 and status in ('SCHEDULED','RESCHEDULED')
        and starts_at='2099-11-18T10:00:00+05:30'::timestamptz
    `,[mentor.user.id]);
    expect(meetings.rows).toHaveLength(1);
    const losing=results[0]?.status==="rejected"?projectA:projectB;
    const fresh=await getProjectInstanceWorkspace(mentor,losing.id);
    const adjacent=await scheduleProjectMeeting(mentor,losing.id,null,{
      ...proposed,title:"Adjacent office hour",
      startsAt:"2099-11-18T10:30:00+05:30",
      endsAt:"2099-11-18T11:00:00+05:30",
      expectedProjectUpdatedAt:fresh.project.updatedAt.toISOString(),
    });
    expect(adjacent).toMatchObject({status:"SCHEDULED"});
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
