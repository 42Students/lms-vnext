import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  isNotNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { projectCompletionPercent } from "./progress-percentage-policy";
import { groupProjectAdminRows } from "./admin-insights-group-model";
import {
  collegeMemberships,
  projectInstances,
  projectMeetings,
  projectMembers,
  projectReleases,
  projectResources,
  projectSprints,
  projectSubmissions,
  projectSubmissionReviews,
  projectTasks,
  projectTaskSubmissions,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {getProjectAdminCollegeId} from "./admin-college-scope";
import {ProjectsServiceError} from "./errors";
import { deriveProjectExecutionReadiness } from "./execution-readiness";
import {
  deriveProjectRiskReasons,
  latestProjectSubmission,
} from "./risk-signals";
import { loadProjectCollegeScope } from "./scope";
import {adminUnsubmittedLiteralSearchPattern} from "./admin-unsubmitted-query-model";
import {latestReviewedProjectSubmissionSql} from "./admin-submission-kpi-model";
import {isCurrentProjectSubmissionSql} from "./admin-submission-current-version-model";

// Service inputs also arrive from internal callers, not only from the URL
// parser. Never admit JS numeric coercions (hex, exponent, blanks, NaN)
// or extra, caller-injected filters into the selected-college query.
const strictPageNumber=(min:number,max:number,fallback:number)=>z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number)
    .pipe(z.number().int().min(min).max(max)),
]).default(fallback);

const projectAdminQuerySchema = z.strictObject({
  riskBucket: z.enum(["STALLED", "BLOCKER", "REVIEW"]).optional(),
  riskSort: z.enum(["INACTIVE","WORKSPACE","SEVERITY"]).optional(),
  q: z.string().trim().max(120).optional(),
  status: z
    .enum([
      "PLANNED",
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ])
    .optional(),
  page: strictPageNumber(1,100000,1),
  pageSize: strictPageNumber(10,100,20),
});

export type ProjectAdminQuery = z.input<
  typeof projectAdminQuerySchema
>;

function latestDate(
  current: Date,
  candidate: Date | null | undefined,
) {
  return candidate && candidate > current
    ? candidate
    : current;
}

export async function listProjectAdminSnapshots(
  context: RequestContext,
  collegeIdInput: string,
  rawQuery: ProjectAdminQuery = {},
) {
  const query =
    projectAdminQuerySchema.parse(rawQuery);
  // Never resolve an attacker-supplied tenant ID before the selected actor
  // is authorized to see that exact college. Prevent an existence oracle.
  if(getProjectAdminCollegeId(context)!==collegeIdInput)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college =
    await loadProjectCollegeScope(
      collegeIdInput,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  // A valid session snapshot is not enough: the College Admin role may be
  // removed while a project directory request is in flight. Hold persisted
  // actor role locks through both the page query and its eight aggregations.
  return getDb().transaction(async db=>{
    await assertPersistedPlatformPermission(db,context,"projects.manage",{
      collegeId:college.id,organizationId:college.organizationId,
    });
  const searchPattern=adminUnsubmittedLiteralSearchPattern(query.q??"");
  const search = query.q
    ? or(
        ilike(
          projectInstances.title,
          searchPattern,
        ),
        ilike(
          projectInstances.slug,
          searchPattern,
        ),
        sql`${projectInstances.id}::text ilike ${searchPattern}`,
      )
    : undefined;
  const where = and(
    eq(projectInstances.collegeId, college.id),
    isNull(projectInstances.deletedAt),
    query.status
      ? eq(projectInstances.status, query.status)
      : undefined,
    search,
  );
  const [totalRow, projects] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(projectInstances)
        .where(where),
      db
        .select({
          id: projectInstances.id,
          templateId: projectInstances.templateId,
          slug: projectInstances.slug,
          title: projectInstances.title,
          summary: projectInstances.summary,courseLabel:projectInstances.courseLabel,
          phase:projectInstances.phase,dueLabel:projectInstances.dueLabel,
          status: projectInstances.status,
          updatedAt: projectInstances.updatedAt,
          createdAt: projectInstances.createdAt,
          archivedAt: projectInstances.archivedAt,
        })
        .from(projectInstances)
        .where(where)
        .orderBy(
          asc(projectInstances.title),
          asc(projectInstances.id),
        )
        .limit(query.pageSize)
        .offset(
          (query.page - 1) * query.pageSize,
        ),
    ]);

  const total = Number(totalRow[0]?.value ?? 0);
  if (!projects.length) {
    return {
      items: [],
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(
        1,
        Math.ceil(total / query.pageSize),
      ),
    };
  }

  const ids = projects.map((project) => project.id);
  const [
    tasks,
    sprints,
    releases,
    submissions,
    taskSubmissions,
    meetings,
    resources,
    members,
    memberMutations,
  ] = await Promise.all([
    db
      .select({
        projectId: projectTasks.projectId,
        status: projectTasks.status,
        updatedAt: projectTasks.updatedAt,
      })
      .from(projectTasks)
      .where(inArray(projectTasks.projectId, ids)),
    db
      .select({
        projectId: projectSprints.projectId,
        status: projectSprints.status,
        updatedAt: projectSprints.updatedAt,
      })
      .from(projectSprints)
      .where(inArray(projectSprints.projectId, ids)),
    db
      .select({
        projectId: projectReleases.projectId,
        status: projectReleases.status,
        updatedAt: projectReleases.updatedAt,
      })
      .from(projectReleases)
      .where(inArray(projectReleases.projectId, ids)),
    db
      .select({
        id: projectSubmissions.id,
        projectId: projectSubmissions.projectId,
        version: projectSubmissions.version,
        status: projectSubmissions.status,
        submittedAt: projectSubmissions.submittedAt,
        updatedAt: projectSubmissions.updatedAt,
      })
      .from(projectSubmissions)
      .where(
        inArray(
          projectSubmissions.projectId,
          ids,
        ),
      )
      .orderBy(
        desc(projectSubmissions.version),
      ),
    db
      .select({
        projectId: projectTaskSubmissions.projectId,
        submittedAt:
          projectTaskSubmissions.submittedAt,
        reviewedAt:
          projectTaskSubmissions.reviewedAt,
        updatedAt:
          projectTaskSubmissions.updatedAt,
      })
      .from(projectTaskSubmissions)
      .where(
        inArray(
          projectTaskSubmissions.projectId,
          ids,
        ),
      ),
    db
      .select({
        projectId: projectMeetings.projectId,
        updatedAt: projectMeetings.updatedAt,
        startsAt: projectMeetings.startsAt,
      })
      .from(projectMeetings)
      .where(
        inArray(projectMeetings.projectId, ids),
      ),
    db
      .select({
        projectId: projectResources.projectId,
        updatedAt: projectResources.updatedAt,
      })
      .from(projectResources)
      .where(
        inArray(projectResources.projectId, ids),
      ),
    db
      .select({
        projectId: projectMembers.projectId,
        role: projectMembers.role,
        isPrimary: projectMembers.isPrimary,
        displayName: users.displayName,
        updatedAt: projectMembers.updatedAt,
      })
      .from(projectMembers)
      .innerJoin(
      collegeMemberships,
      and(
        eq(collegeMemberships.id, projectMembers.membershipId),
        eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
      .innerJoin(
        users,
        and(eq(users.id, collegeMemberships.userId),
          eq(users.platformStatus, "ACTIVE")),
      )
      .where(
        and(
          inArray(projectMembers.projectId, ids),
          isNull(projectMembers.endedAt),
        ),
      ),
    // UI labels include only active mentors, but removing or disabling a
    // mentor is still an activity. Capture every project-member transition
    // without exposing inactive identities or loading one row per member.
    db
      .select({
        projectId: projectMembers.projectId,
        updatedAt: sql<Date>`max(${projectMembers.updatedAt})`
          .mapWith(projectMembers.updatedAt),
      })
      .from(projectMembers)
      .where(inArray(projectMembers.projectId, ids))
      .groupBy(projectMembers.projectId),
  ]);

  // Index each result set once: at 100 visible projects, rescanning all
  // task/submission rows per card becomes needlessly quadratic.
  const tasksByProject = groupProjectAdminRows(tasks);
  const sprintsByProject = groupProjectAdminRows(sprints);
  const releasesByProject = groupProjectAdminRows(releases);
  const submissionsByProject = groupProjectAdminRows(submissions);
  const taskSubmissionsByProject = groupProjectAdminRows(taskSubmissions);
  const meetingsByProject = groupProjectAdminRows(meetings);
  const resourcesByProject = groupProjectAdminRows(resources);
  const membersByProject = groupProjectAdminRows(members);
  const memberMutationByProject = new Map(memberMutations.map(row => [row.projectId,row.updatedAt]));

  const items = projects.map((project) => {
    const projectTasksRows = tasksByProject.get(project.id) ?? [];
    const projectSprintRows = sprintsByProject.get(project.id) ?? [];
    const projectReleaseRows = releasesByProject.get(project.id) ?? [];
    const projectSubmissionRows = submissionsByProject.get(project.id) ?? [];
    const latestSubmission = latestProjectSubmission(projectSubmissionRows);
    const projectMembersRows = membersByProject.get(project.id) ?? [];
    const primaryMentor =
      projectMembersRows.find(
        (row) =>
          row.role === "MENTOR" &&
          row.isPrimary,
      ) ??
      projectMembersRows.find(
        (row) => row.role === "MENTOR",
      ) ??
      null;

    const execution =
      deriveProjectExecutionReadiness({
        projectStatus: project.status,
        releaseStatuses: projectReleaseRows.map(
          (row) => row.status,
        ),
        sprintStatuses: projectSprintRows.map(
          (row) => row.status,
        ),
        taskStatuses: projectTasksRows.map(
          (row) => row.status,
        ),
      });
    const doneTasks = execution.tasks.done;
    const completedSprints =
      execution.sprints.completed;
    const shippedReleases =
      execution.releases.shipped;
    const executionDenominator =
      execution.tasks.total +
      execution.sprints.total;
    const progressPercent = projectCompletionPercent(doneTasks + completedSprints, executionDenominator) ?? 0;

    let lastActivityAt = project.updatedAt;
    for (const row of projectTasksRows) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }
    for (const row of projectSprintRows) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }
    for (const row of projectReleaseRows) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }
    for (const row of projectSubmissionRows) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
      lastActivityAt = latestDate(
        lastActivityAt,
        row.submittedAt,
      );
    }
    for (const row of taskSubmissionsByProject.get(project.id) ?? []) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
      lastActivityAt = latestDate(
        lastActivityAt,
        row.submittedAt,
      );
      lastActivityAt = latestDate(
        lastActivityAt,
        row.reviewedAt,
      );
    }
    for (const row of meetingsByProject.get(project.id) ?? []) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }
    for (const row of resourcesByProject.get(project.id) ?? []) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }
    // Historical transitions count toward recency, but only live and
    // college-scoped mentors above may appear by name in the workspace.
    lastActivityAt = latestDate(
      lastActivityAt,
      memberMutationByProject.get(project.id),
    );

    const ageDays = Math.max(
      0,
      Math.floor(
        (Date.now() - lastActivityAt.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    );
    const riskReasons =
      deriveProjectRiskReasons({
        projectStatus: project.status,
        inactiveDays: ageDays,
        latestSubmissionStatus:
          latestSubmission?.status ?? null,
      });

    const executionComplete = execution.complete;

    return {
      ...project,
      mentorName:
        primaryMentor?.displayName ?? null,
      memberCount: projectMembersRows.length,
      taskCount: projectTasksRows.length,
      doneTaskCount: doneTasks,
      sprintCount: projectSprintRows.length,
      completedSprintCount:
        completedSprints,
      releaseCount: projectReleaseRows.length,
      shippedReleaseCount: shippedReleases,
      progressPercent,
      latestSubmission,
      executionComplete,
      lastActivityAt,
      inactiveDays: ageDays,
      riskReasons,
      riskSeverity: riskReasons.length >= 2 ? "RISK" : riskReasons.length === 1 ? "WATCH" : "NONE",
    };
  });

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(total / query.pageSize),
    ),
  };
  });
}

export async function listProjectAdminRiskQueue(
  context: RequestContext,
  collegeIdInput: string,
  rawQuery: ProjectAdminQuery = {},
) {
  const query =
    projectAdminQuerySchema.parse(rawQuery);
  // Never resolve an attacker-supplied tenant ID before the selected actor
  // is authorized to see that exact college. Prevent an existence oracle.
  if(getProjectAdminCollegeId(context)!==collegeIdInput)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college =
    await loadProjectCollegeScope(
      collegeIdInput,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  return getDb().transaction(async db=>{
    await assertPersistedPlatformPermission(db,context,"projects.manage",{
      collegeId:college.id,organizationId:college.organizationId,
    });
  const searchPattern=adminUnsubmittedLiteralSearchPattern(query.q??"");
  const search = query.q
    ? or(
        ilike(projectInstances.title,searchPattern),
        ilike(projectInstances.slug,searchPattern),
        sql`${projectInstances.id}::text ilike ${searchPattern}`,
        sql`exists (
          select 1 from project_members m
          join college_memberships cm on cm.id=m.membership_id
          join users u on u.id=cm.user_id
          where m.project_id=project_instances.id and m.role='MENTOR'
            and m.ended_at is null and cm.college_id=${college.id}
            and cm.status='ACTIVE' and u.platform_status='ACTIVE'
            and u.display_name ilike ${searchPattern}
        )`,
      )
    : undefined;
  // Correlated subqueries below need a qualified outer reference: Drizzle
  // renders single-table column interpolations unqualified, which would bind
  // to the inner table's own columns instead of project_instances.
  const instanceId = sql.raw('"project_instances"."id"');
  const instanceUpdatedAt = sql.raw('"project_instances"."updated_at"');
  const instanceBlocker = sql.raw('"project_instances"."blocker"');
  const lastActivityAt = sql<Date>`greatest(
    ${instanceUpdatedAt},
    coalesce((select max(pt.updated_at) from project_tasks pt where pt.project_id = ${instanceId} and pt.deleted_at is null), 'epoch'::timestamptz),
    coalesce((select max(ps.updated_at) from project_sprints ps where ps.project_id = ${instanceId}), 'epoch'::timestamptz),
    coalesce((select max(pr.updated_at) from project_releases pr where pr.project_id = ${instanceId}), 'epoch'::timestamptz),
    coalesce((select max(pfs.updated_at) from project_submissions pfs where pfs.project_id = ${instanceId}), 'epoch'::timestamptz),
    coalesce((select max(pts.updated_at) from project_task_submissions pts where pts.project_id = ${instanceId}), 'epoch'::timestamptz),
    coalesce((select max(pm.updated_at) from project_meetings pm where pm.project_id = ${instanceId}), 'epoch'::timestamptz),
    coalesce((select max(pres.updated_at) from project_resources pres where pres.project_id = ${instanceId}), 'epoch'::timestamptz),
    coalesce((select max(pmem.updated_at) from project_members pmem where pmem.project_id = ${instanceId}), 'epoch'::timestamptz)
  )`.mapWith((value: string | Date) => new Date(value));
  // Only the latest submission version can be awaiting review.
  // The unique (project_id, version) constraint makes this
  // ordering deterministic. No submission means false.
  const pendingReview = sql<boolean>`coalesce((
    select latest.status = 'SUBMITTED'
    from project_submissions latest
    where latest.project_id = ${instanceId}
    order by latest.version desc
    limit 1
  ), false)`;
  const blockedTask = sql<boolean>`(
    nullif(trim(${instanceBlocker}), '') is not null
    or exists (
      select 1 from project_tasks blocked
      where blocked.project_id = ${instanceId} and blocked.deleted_at is null
        and blocked.status = 'BLOCKED'
        and nullif(trim(blocked.blocker_reason), '') is not null
    )
  )`;
  const blockerSummary = sql<string | null>`coalesce(nullif(trim(${instanceBlocker}), ''), (
    select nullif(trim(blocked.blocker_reason), '')
    from project_tasks blocked
    where blocked.project_id = ${instanceId} and blocked.deleted_at is null
      and blocked.status = 'BLOCKED'
      and nullif(trim(blocked.blocker_reason), '') is not null
    order by blocked.updated_at desc, blocked.id desc limit 1
  ))`;
  const staleCutoff =
    new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    );
  const stalledSignal=sql<boolean>`(
    ${projectInstances.status}<>'COMPLETED' and
    ${lastActivityAt} <= ${staleCutoff}
  )`;
  const reasonCount=sql<number>`(
    (case when ${stalledSignal} then 1 else 0 end)
    + (case when ${pendingReview} then 1 else 0 end)
    + (case when ${blockedTask} then 1 else 0 end)
  )`;
  const completedWithOpenRisk=sql<boolean>`(
    ${projectInstances.status}<>'COMPLETED' or
    ${pendingReview} or ${blockedTask}
  )`;
  const where = and(
    eq(projectInstances.collegeId, college.id),
    isNull(projectInstances.deletedAt),
    ne(projectInstances.status, "ARCHIVED"),
    completedWithOpenRisk,
    query.status
      ? eq(projectInstances.status, query.status)
      : undefined,
    search,
    or(
      stalledSignal,
      pendingReview,
      blockedTask,
    ),
    query.riskBucket === "STALLED" ? stalledSignal :
      query.riskBucket === "BLOCKER" ? blockedTask :
      query.riskBucket === "REVIEW" ? pendingReview : undefined,
  );

  const [bucketTotals] = await db.select({
    stalled: sql<number>`count(*) filter (where ${stalledSignal})`.mapWith(Number),
    blocker: sql<number>`count(*) filter (where ${blockedTask})`.mapWith(Number),
    review: sql<number>`count(*) filter (where ${pendingReview})`.mapWith(Number),
  }).from(projectInstances).where(and(
    eq(projectInstances.collegeId, college.id),
    isNull(projectInstances.deletedAt),
    ne(projectInstances.status, "ARCHIVED"),
    completedWithOpenRisk,
    search,
    query.status?eq(projectInstances.status,query.status):undefined,
  ));
  const buckets = {
    stalled: bucketTotals?.stalled ?? 0,
    blocker: bucketTotals?.blocker ?? 0,
    review: bucketTotals?.review ?? 0,
  };

  const [totalRow, projects] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(projectInstances)
        .where(where),
      db
        .select({
          id: projectInstances.id,
          slug: projectInstances.slug,
          title: projectInstances.title,
          summary: projectInstances.summary,
          status: projectInstances.status,
          legacyStatus: projectInstances.legacyStatus,
          updatedAt: projectInstances.updatedAt,
          lastActivityAt,
          pendingReview,
          blockedTask,
          blockerSummary,
        })
        .from(projectInstances)
        .where(where)
        .orderBy(
          query.riskSort==="INACTIVE_DESC"?desc(lastActivityAt):
          query.riskSort==="WORKSPACE"?asc(projectInstances.title):
          query.riskSort==="INACTIVE"?asc(lastActivityAt):
            sql`${reasonCount} desc`,
          asc(projectInstances.title),
          asc(projectInstances.id),
        )
        .limit(query.pageSize)
        .offset(
          (query.page - 1) *
            query.pageSize,
        ),
    ]);
  const total = Number(totalRow[0]?.value ?? 0);

  if (!projects.length) {
    return {
      items: [],
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(
        1,
        Math.ceil(total / query.pageSize),
      ),
      blockerSignalSupported: true,
      buckets,
    };
  }

  const ids = projects.map((row) => row.id);
  const mentors = await db
    .select({
      projectId: projectMembers.projectId,
      displayName: users.displayName,
      membershipId: projectMembers.membershipId,
      isPrimary: projectMembers.isPrimary,
    })
    .from(projectMembers)
    .innerJoin(
      collegeMemberships,
      and(
        eq(collegeMemberships.id, projectMembers.membershipId),
        eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      users,
      and(eq(users.id, collegeMemberships.userId),
        eq(users.platformStatus, "ACTIVE")),
    )
    .where(
      and(
        inArray(projectMembers.projectId, ids),
        eq(projectMembers.role, "MENTOR"),
        isNull(projectMembers.endedAt),
      ),
    );

  const mentorsByProject = groupProjectAdminRows(mentors);
  return {
    items: projects.map((project) => {
      const inactivityDays = Math.max(
        0,
        Math.floor(
          (Date.now() -
            project.lastActivityAt.getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      );
      const reasons =
        deriveProjectRiskReasons({
          projectStatus: project.status,
          inactiveDays: inactivityDays,
          latestSubmissionStatus:
            project.pendingReview
              ? "SUBMITTED"
              : null,
          hasBlockedTask: project.blockedTask || project.legacyStatus === "BLOCKED",
        });
      const projectMentors = mentorsByProject.get(project.id) ?? [];
      const mentor =
        projectMentors.find(
          (candidate) =>
            candidate.isPrimary,
        ) ??
        projectMentors[0] ??
        null;

      return {
        ...project,
        inactiveDays: inactivityDays,
        riskReasons: reasons,
        riskSeverity: reasons.length>=3?"HIGH_RISK":reasons.length===2?"AT_RISK":
          reasons.length===1?"WATCH":"NONE",
        blockerReason: project.blockerSummary,
        mentorName:
          mentor?.displayName ?? null,
        mentorMembershipId: mentor?.membershipId ?? null,
      };
    }),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(total / query.pageSize),
    ),
    blockerSignalSupported: true,
    buckets,
  };
  });
}

const projectSubmissionQueueQuerySchema =
  projectAdminQuerySchema.extend({
    submissionStatus: z
      .enum([
        "DRAFT",
        "SUBMITTED",
        "CHANGES_REQUESTED",
        "APPROVED",
        "UNDER_REVIEW",
        "LOCKED",
        "DRAFT_REVISING",
      ])
      .optional(),
    sort:z.enum(["SUBMITTED_DESC","PENDING_DESC","REVISIONS_DESC"]).default("SUBMITTED_DESC"),
    focusedProjectId: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  });

/** COL-projects-13: whole-college cards reflect the latest delivery only. */
export async function getProjectAdminSubmissionSummary(context: RequestContext, collegeIdInput: string) {
  // Never resolve an attacker-supplied tenant ID before the selected actor
  // is authorized to see that exact college. Prevent an existence oracle.
  if(getProjectAdminCollegeId(context)!==collegeIdInput)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college = await loadProjectCollegeScope(collegeIdInput);
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId, collegeId: college.id,
  });
  return getDb().transaction(async db=>{
    await assertPersistedPlatformPermission(db,context,"projects.manage",{
      collegeId:college.id,organizationId:college.organizationId,
    });
  // This reference is evaluated inside a correlated subquery. Drizzle
  // otherwise renders the bare column as "id", which binds to the inner
  // submission table instead of the outer project_instances row.
  const instanceId = sql.raw('"project_instances"."id"');
  const latestStatus = sql<string | null>`(
    select sub.status from project_submissions sub
    where sub.project_id = ${instanceId}
    order by sub.version desc limit 1
  )`;
  const latestApproved=latestReviewedProjectSubmissionSql();
  const [row] = await db.select({
    activeWorkspaces: sql<number>`count(*) filter (where ${projectInstances.status} = 'ACTIVE')`.mapWith(Number),
    pendingReview: sql<number>`count(*) filter (where ${projectInstances.status} = 'ACTIVE' and ${latestStatus} = 'SUBMITTED')`.mapWith(Number),
    needsStudentAction: sql<number>`count(*) filter (where ${projectInstances.status} = 'ACTIVE' and ${latestStatus} = 'CHANGES_REQUESTED')`.mapWith(Number),
    reviewed: sql<number>`count(*) filter (where ${latestApproved})`.mapWith(Number),
  }).from(projectInstances).where(and(eq(projectInstances.collegeId, college.id),
    isNull(projectInstances.deletedAt)));
  return {
    activeWorkspaces: row?.activeWorkspaces ?? 0,
    pendingReview: row?.pendingReview ?? 0,
    needsStudentAction: row?.needsStudentAction ?? 0,
    reviewed: row?.reviewed ?? 0,
  };
  });
}

export async function listProjectAdminSubmissionQueue(
  context: RequestContext,
  collegeIdInput: string,
  rawQuery: z.input<
    typeof projectSubmissionQueueQuerySchema
  > = {},
) {
  const query =
    projectSubmissionQueueQuerySchema.parse(
      rawQuery,
    );
  // Never resolve an attacker-supplied tenant ID before the selected actor
  // is authorized to see that exact college. Prevent an existence oracle.
  if(getProjectAdminCollegeId(context)!==collegeIdInput)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college =
    await loadProjectCollegeScope(
      collegeIdInput,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
  return getDb().transaction(async db=>{
    await assertPersistedPlatformPermission(db,context,"projects.manage",{
      collegeId:college.id,organizationId:college.organizationId,
    });
  // Keep the outer project ID qualified inside the mentor subquery.
  const instanceId = sql.raw('"project_instances"."id"');
  const searchPattern=adminUnsubmittedLiteralSearchPattern(query.q??"");
  const focus=query.focusedProjectId;
  const focusUuid=focus&&z.string().uuid().safeParse(focus).success?focus:null;
  const focusLegacy=focus&&/^[0-9]+$/.test(focus)&&Number.isSafeInteger(Number(focus))&&Number(focus)>0?Number(focus):null;
  const focusCondition=focus?or(
    focusUuid?eq(projectInstances.id,focusUuid):undefined,
    eq(projectInstances.slug,focus),
    focusLegacy!==null?eq(projectInstances.legacyProjectId,focusLegacy):undefined,
  ):undefined;
  const search = query.q
    ? or(
        ilike(
          projectInstances.title,
          searchPattern,
        ),
        ilike(
          projectInstances.slug,
          searchPattern,
        ),
        sql`${projectInstances.id}::text ilike ${searchPattern}`,
      )
    : undefined;
  const where = and(
    eq(projectInstances.collegeId, college.id),
    isNull(projectInstances.deletedAt),
    focusCondition,
    // The unfiltered All view intentionally includes revision history.
    // Operational status shortcuts must never show superseded versions.
    query.submissionStatus?isCurrentProjectSubmissionSql():undefined,
    query.status
      ? eq(projectInstances.status, query.status)
      : undefined,
    query.submissionStatus==="UNDER_REVIEW"?and(
      eq(projectSubmissions.status,"SUBMITTED"),isNull(projectSubmissions.lockedAt)):
    query.submissionStatus==="LOCKED"?and(
      isNotNull(projectSubmissions.lockedAt),isNull(projectSubmissions.reopenedAt)):
    query.submissionStatus==="DRAFT_REVISING"?and(
      eq(projectSubmissions.status,"APPROVED"),isNotNull(projectSubmissions.reopenedAt)):
    query.submissionStatus==="APPROVED"?and(
      eq(projectSubmissions.status,"APPROVED"),isNull(projectSubmissions.reopenedAt)):
    query.submissionStatus?eq(projectSubmissions.status,query.submissionStatus):undefined,
    search,
  );
  const [totalRow, rows] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(projectSubmissions)
        .innerJoin(
          projectInstances,
          eq(
            projectInstances.id,
            projectSubmissions.projectId,
          ),
        )
        .where(where),
      db
        .select({
          id: projectSubmissions.id,
          projectId: projectSubmissions.projectId,
          projectTitle: projectInstances.title,
          projectStatus: projectInstances.status,
          mentorMembershipId:sql<string|null>`(select pm.membership_id from project_members pm
            where pm.project_id=${instanceId} and pm.role='MENTOR'
              and pm.is_primary=true and pm.ended_at is null
               and exists (
                 select 1 from college_memberships cm
                 where cm.id=pm.membership_id
                   and cm.college_id=${college.id}
                   and cm.status='ACTIVE'
               )
            order by pm.created_at limit 1)`,
          version: projectSubmissions.version,
          revisionCount:projectSubmissions.legacyRevisionCount,
          submittedBy:sql<string|null>`(
            select u.display_name from college_memberships cm
              join users u on u.id=cm.user_id
            where cm.id=${projectSubmissions.submittedByMembershipId}
              and cm.college_id=${college.id} limit 1
          )`,
          isCurrentVersion:sql<boolean>`not exists (
            select 1 from project_submissions newer
            where newer.project_id=${projectSubmissions.projectId}
              and newer.version > ${projectSubmissions.version}
          )`,
          status: projectSubmissions.status,
          summary: projectSubmissions.summary,
          sourceUrl: projectSubmissions.sourceUrl,
          demoUrl: projectSubmissions.demoUrl,
          attachments: projectSubmissions.attachments,
          reviewedAt: projectSubmissionReviews.reviewedAt,
          reviewedBy: users.displayName,
          reviewedByType:sql<string|null>`case
            when ${projectSubmissionReviews.reviewedByUserId} is null then null
            when ${projectSubmissionReviews.reviewedByMembershipId} is null then 'SUPER_ADMIN'
            else 'ADMIN' end`,
          lockedAt: projectSubmissions.lockedAt,
          reopenedAt:projectSubmissions.reopenedAt,
          submittedAt: projectSubmissions.submittedAt,
          updatedAt: projectSubmissions.updatedAt,
        })
        .from(projectSubmissions)
        .innerJoin(
          projectInstances,
          eq(projectInstances.id, projectSubmissions.projectId),
        )
        .leftJoin(projectSubmissionReviews, eq(projectSubmissionReviews.submissionId, projectSubmissions.id))
        .leftJoin(users, eq(users.id, projectSubmissionReviews.reviewedByUserId))
        .where(where)
        .orderBy(
          query.sort==="PENDING_DESC"
            ? sql`case when ${projectSubmissions.status}='SUBMITTED'
              then ${projectSubmissions.submittedAt} else null end asc nulls last`
            : query.sort==="REVISIONS_DESC"
              ? sql`${projectSubmissions.legacyRevisionCount} desc nulls last`
              : desc(projectSubmissions.submittedAt),
          desc(projectSubmissions.version),
          desc(projectSubmissions.updatedAt),
        )
        .limit(query.pageSize)
        .offset(
          (query.page - 1) *
            query.pageSize,
        ),
    ]);

  const total = Number(totalRow[0]?.value ?? 0);
  return {
    items: rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(total / query.pageSize),
    ),
  };
  });
}

// Soft-deleted projects are not the same as user-archived projects.
export async function listProjectAdminDeletedWorkspaces(
  context: RequestContext, collegeIdInput: string,
  rawQuery: Pick<ProjectAdminQuery, "page" | "pageSize" | "q"> = {},
) {
  const query = projectAdminQuerySchema.parse(rawQuery);
  if (getProjectAdminCollegeId(context) !== collegeIdInput)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college = await loadProjectCollegeScope(collegeIdInput);
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId, collegeId: college.id,
  });
  return getDb().transaction(async (db) => {
    await assertPersistedPlatformPermission(db, context, "projects.manage", {
      organizationId: college.organizationId, collegeId: college.id,
    });
    const oldId = query.q && /^[0-9]+$/.test(query.q) && Number.isSafeInteger(Number(query.q))
      ? Number(query.q) : null;
    const where = and(
      eq(projectInstances.collegeId, college.id),
      isNotNull(projectInstances.deletedAt),
      query.q ? or(
        ilike(projectInstances.title, adminUnsubmittedLiteralSearchPattern(query.q)),
        ilike(projectInstances.slug, adminUnsubmittedLiteralSearchPattern(query.q)),
        oldId === null ? undefined : eq(projectInstances.legacyProjectId, oldId),
      ) : undefined,
    );
    const [totals, items] = await Promise.all([
      db.select({ value: count() }).from(projectInstances).where(where),
      db.select({
        id: projectInstances.id,
        slug: projectInstances.slug,
        legacyProjectId: projectInstances.legacyProjectId,
        title: projectInstances.title,
        status: projectInstances.status,
        deletedAt: projectInstances.deletedAt,
        archivedAt: projectInstances.archivedAt,
      }).from(projectInstances).where(where)
        .orderBy(desc(projectInstances.deletedAt), asc(projectInstances.id))
        .limit(query.pageSize).offset((query.page - 1) * query.pageSize),
    ]);
    const total = Number(totals[0]?.value ?? 0);
    return { items, total, page: query.page, pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
  });
}
