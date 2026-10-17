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
import { projectCompletionPercent } from "./progress-percentage-policy";
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
import { deriveProjectExecutionReadiness } from "./execution-readiness";
import {
  deriveProjectRiskReasons,
  latestProjectSubmission,
} from "./risk-signals";
import { loadProjectCollegeScope } from "./scope";

const projectAdminQuerySchema = z.object({
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
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(10)
    .max(100)
    .default(25),
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
  const college =
    await loadProjectCollegeScope(
      collegeIdInput,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const search = query.q
    ? or(
        ilike(
          projectInstances.title,
          `%${query.q}%`,
        ),
        ilike(
          projectInstances.slug,
          `%${query.q}%`,
        ),
        sql`${projectInstances.id}::text ilike ${"%"+query.q+"%"}`,
      )
    : undefined;
  const where = and(
    eq(projectInstances.collegeId, college.id),
    query.status
      ? eq(projectInstances.status, query.status)
      : undefined,
    search,
  );
  const db = getDb();

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
          summary: projectInstances.summary,
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
        eq(
          collegeMemberships.id,
          projectMembers.membershipId,
        ),
      )
      .innerJoin(
        users,
        eq(users.id, collegeMemberships.userId),
      )
      .where(
        and(
          inArray(projectMembers.projectId, ids),
          isNull(projectMembers.endedAt),
        ),
      ),
  ]);

  const items = projects.map((project) => {
    const projectTasksRows = tasks.filter(
      (row) => row.projectId === project.id,
    );
    const projectSprintRows = sprints.filter(
      (row) => row.projectId === project.id,
    );
    const projectReleaseRows = releases.filter(
      (row) => row.projectId === project.id,
    );
    const projectSubmissionRows =
      submissions.filter(
        (row) => row.projectId === project.id,
      );
    const latestSubmission =
      latestProjectSubmission(projectSubmissionRows);
    const projectMembersRows = members.filter(
      (row) => row.projectId === project.id,
    );
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
    for (const row of taskSubmissions.filter(
      (candidate) =>
        candidate.projectId === project.id,
    )) {
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
    for (const row of meetings.filter(
      (candidate) =>
        candidate.projectId === project.id,
    )) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }
    for (const row of resources.filter(
      (candidate) =>
        candidate.projectId === project.id,
    )) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }
    for (const row of projectMembersRows) {
      lastActivityAt = latestDate(
        lastActivityAt,
        row.updatedAt,
      );
    }

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
}

export async function listProjectAdminRiskQueue(
  context: RequestContext,
  collegeIdInput: string,
  rawQuery: ProjectAdminQuery = {},
) {
  const query =
    projectAdminQuerySchema.parse(rawQuery);
  const college =
    await loadProjectCollegeScope(
      collegeIdInput,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const search = query.q
    ? or(
        ilike(
          projectInstances.title,
          `%${query.q}%`,
        ),
        ilike(
          projectInstances.slug,
          `%${query.q}%`,
        ),
        sql`${projectInstances.id}::text ilike ${"%"+query.q+"%"}`,
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
    coalesce((select max(pt.updated_at) from project_tasks pt where pt.project_id = ${instanceId}), 'epoch'::timestamptz),
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
      where blocked.project_id = ${instanceId}
        and blocked.status = 'BLOCKED'
        and nullif(trim(blocked.blocker_reason), '') is not null
    )
  )`;
  const blockerSummary = sql<string | null>`coalesce(nullif(trim(${instanceBlocker}), ''), (
    select nullif(trim(blocked.blocker_reason), '')
    from project_tasks blocked
    where blocked.project_id = ${instanceId}
      and blocked.status = 'BLOCKED'
      and nullif(trim(blocked.blocker_reason), '') is not null
    order by blocked.updated_at desc, blocked.id desc limit 1
  ))`;
  const staleCutoff =
    new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    );
  const where = and(
    eq(projectInstances.collegeId, college.id),
    ne(projectInstances.status, "ARCHIVED"),
    ne(projectInstances.status, "COMPLETED"),
    query.status
      ? eq(projectInstances.status, query.status)
      : undefined,
    search,
    or(
      sql`${lastActivityAt} <= ${staleCutoff}`,
      pendingReview,
      blockedTask,
    ),
    query.riskBucket === "STALLED" ? sql`${lastActivityAt} <= ${staleCutoff}` :
      query.riskBucket === "BLOCKER" ? blockedTask :
      query.riskBucket === "REVIEW" ? pendingReview : undefined,
  );
  const db = getDb();

  const [bucketTotals] = await db.select({
    stalled: sql<number>`count(*) filter (where ${lastActivityAt} <= ${staleCutoff})`.mapWith(Number),
    blocker: sql<number>`count(*) filter (where ${blockedTask})`.mapWith(Number),
    review: sql<number>`count(*) filter (where ${pendingReview})`.mapWith(Number),
  }).from(projectInstances).where(and(
    eq(projectInstances.collegeId, college.id),
    ne(projectInstances.status, "ARCHIVED"),
    ne(projectInstances.status, "COMPLETED"),
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
          updatedAt: projectInstances.updatedAt,
          lastActivityAt,
          pendingReview,
          blockedTask,
          blockerSummary,
        })
        .from(projectInstances)
        .where(where)
        .orderBy(
          query.riskSort==="WORKSPACE"?asc(projectInstances.title):
            query.riskSort==="SEVERITY"
              ? asc(sql`case when ${blockedTask} or (${lastActivityAt} <= ${staleCutoff} and ${pendingReview}) then 0 else 1 end`)
              : asc(lastActivityAt),
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
      eq(
        collegeMemberships.id,
        projectMembers.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      and(
        inArray(projectMembers.projectId, ids),
        eq(projectMembers.role, "MENTOR"),
        isNull(projectMembers.endedAt),
      ),
    );

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
          hasBlockedTask: project.blockedTask,
        });
      const projectMentors =
        mentors.filter(
          (mentor) =>
            mentor.projectId === project.id,
        );
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
  });

/** COL-projects-13: whole-college cards reflect the latest delivery only. */
export async function getProjectAdminSubmissionSummary(context: RequestContext, collegeIdInput: string) {
  const college = await loadProjectCollegeScope(collegeIdInput);
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId, collegeId: college.id,
  });
  const latestStatus = sql<string | null>`(
    select sub.status from project_submissions sub
    where sub.project_id = ${projectInstances.id}
    order by sub.version desc limit 1
  )`;
  const [row] = await getDb().select({
    activeWorkspaces: sql<number>`count(*) filter (where ${projectInstances.status} = 'ACTIVE')`.mapWith(Number),
    pendingReview: sql<number>`count(*) filter (where ${latestStatus} = 'SUBMITTED')`.mapWith(Number),
    needsStudentAction: sql<number>`count(*) filter (where ${latestStatus} = 'CHANGES_REQUESTED')`.mapWith(Number),
    reviewed: sql<number>`count(*) filter (where ${latestStatus} = 'APPROVED')`.mapWith(Number),
  }).from(projectInstances).where(eq(projectInstances.collegeId, college.id));
  return {
    activeWorkspaces: row?.activeWorkspaces ?? 0,
    pendingReview: row?.pendingReview ?? 0,
    needsStudentAction: row?.needsStudentAction ?? 0,
    reviewed: row?.reviewed ?? 0,
  };
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
  const college =
    await loadProjectCollegeScope(
      collegeIdInput,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
  const search = query.q
    ? or(
        ilike(
          projectInstances.title,
          `%${query.q}%`,
        ),
        ilike(
          projectInstances.slug,
          `%${query.q}%`,
        ),
      )
    : undefined;
  const where = and(
    eq(projectInstances.collegeId, college.id),
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
  const db = getDb();
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
            where pm.project_id=${projectInstances.id} and pm.role='MENTOR'
              and pm.is_primary=true and pm.ended_at is null
            order by pm.created_at limit 1)`,
          version: projectSubmissions.version,
          status: projectSubmissions.status,
          summary: projectSubmissions.summary,
          sourceUrl: projectSubmissions.sourceUrl,
          demoUrl: projectSubmissions.demoUrl,
          attachments: projectSubmissions.attachments,
          reviewedAt: projectSubmissionReviews.reviewedAt,
          reviewedBy: users.displayName,
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
          desc(projectSubmissions.updatedAt),
          desc(projectSubmissions.version),
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
}
