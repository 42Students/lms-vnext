import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  projectInstances,
  projectMeetings,
  projectMembers,
  projectReleases,
  projectResources,
  projectSprints,
  projectSubmissions,
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
    const progressPercent =
      executionDenominator > 0
        ? Math.round(
            ((doneTasks + completedSprints) /
              executionDenominator) *
              100,
          )
        : 0;

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
      )
    : undefined;
  const lastActivityAt = sql<Date>`greatest(
    ${projectInstances.updatedAt},
    coalesce((select max(pt.updated_at) from project_tasks pt where pt.project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(ps.updated_at) from project_sprints ps where ps.project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(pr.updated_at) from project_releases pr where pr.project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(pfs.updated_at) from project_submissions pfs where pfs.project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(pts.updated_at) from project_task_submissions pts where pts.project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(pm.updated_at) from project_meetings pm where pm.project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(pres.updated_at) from project_resources pres where pres.project_id = ${projectInstances.id}), 'epoch'::timestamptz),
    coalesce((select max(pmem.updated_at) from project_members pmem where pmem.project_id = ${projectInstances.id}), 'epoch'::timestamptz)
  )`;
  // Only the latest submission version can be awaiting review.
  // The unique (project_id, version) constraint makes this
  // ordering deterministic. No submission means false.
  const pendingReview = sql<boolean>`coalesce((
    select latest.status = 'SUBMITTED'
    from project_submissions latest
    where latest.project_id = ${projectInstances.id}
    order by latest.version desc
    limit 1
  ), false)`;
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
    ),
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
          slug: projectInstances.slug,
          title: projectInstances.title,
          summary: projectInstances.summary,
          status: projectInstances.status,
          updatedAt: projectInstances.updatedAt,
          lastActivityAt,
          pendingReview,
        })
        .from(projectInstances)
        .where(where)
        .orderBy(
          asc(lastActivityAt),
          asc(projectInstances.title),
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
      blockerSignalSupported: false,
    };
  }

  const ids = projects.map((row) => row.id);
  const mentors = await db
    .select({
      projectId: projectMembers.projectId,
      displayName: users.displayName,
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
        mentorName:
          mentor?.displayName ?? null,
      };
    }),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(total / query.pageSize),
    ),
    // Legacy also has a free-text workspace blocker signal.
    // DB07 vNext has no persisted blocker column yet; never
    // claim that dimension is covered until W01 promotes it.
    blockerSignalSupported: false,
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
      ])
      .optional(),
  });

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
    query.submissionStatus
      ? eq(
          projectSubmissions.status,
          query.submissionStatus,
        )
      : undefined,
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
          version: projectSubmissions.version,
          status: projectSubmissions.status,
          summary: projectSubmissions.summary,
          sourceUrl: projectSubmissions.sourceUrl,
          demoUrl: projectSubmissions.demoUrl,
          submittedAt: projectSubmissions.submittedAt,
          updatedAt: projectSubmissions.updatedAt,
        })
        .from(projectSubmissions)
        .innerJoin(
          projectInstances,
          eq(
            projectInstances.id,
            projectSubmissions.projectId,
          ),
        )
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
