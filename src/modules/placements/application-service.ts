import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationStatusHistory,
  placementApplicationScreenings,
  placementCompanyRelationships,
  placementCompanies,
  placementJobs,
  placementJobRoleOptions,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { evaluatePlacementEligibility } from "./eligibility-service";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {
  createPlacementApplicationInputSchema,
  placementApplicationIdSchema,
  placementJobIdSchema,
  type CreatePlacementApplicationInput,
} from "./validation";

async function loadJob(jobId: string) {
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }
  return job;
}

function requireLearnerMembership(
  context: RequestContext,
  collegeId?: string,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER") ||
    (collegeId &&
      context.membership.collegeId !== collegeId)
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

async function resolveApplicationRoleOption(
  jobId: string,
  roleOptionId: string | undefined,
) {
  const db = getDb();

  if (roleOptionId) {
    const [role] = await db
      .select()
      .from(placementJobRoleOptions)
      .where(
        and(
          eq(
            placementJobRoleOptions.id,
            roleOptionId,
          ),
          eq(
            placementJobRoleOptions.jobId,
            jobId,
          ),
          eq(
            placementJobRoleOptions.status,
            "ACTIVE",
          ),
        ),
      )
      .limit(1);

    if (!role) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROLE_OPTION_NOT_FOUND",
      );
    }
    return role;
  }

  const roles = await db
    .select()
    .from(placementJobRoleOptions)
    .where(
      and(
        eq(
          placementJobRoleOptions.jobId,
          jobId,
        ),
        eq(
          placementJobRoleOptions.status,
          "ACTIVE",
        ),
      ),
    )
    .orderBy(
      desc(
        placementJobRoleOptions.isPrimary,
      ),
      asc(placementJobRoleOptions.createdAt),
    );

  if (roles.length === 1) {
    return roles[0]!;
  }

  throw new PlacementsServiceError(
    "PLACEMENT_ROLE_OPTION_REQUIRED",
  );
}

function resolveApplicationChannel(
  applicationMode: string,
  input: ReturnType<
    typeof createPlacementApplicationInputSchema.parse
  >,
) {
  let channel: "INTERNAL" | "EXTERNAL";

  if (applicationMode === "INTERNAL") {
    if (input.channel === "EXTERNAL") {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_CHANNEL_INVALID",
      );
    }
    channel = "INTERNAL";
  } else if (applicationMode === "EXTERNAL_ONLY") {
    if (input.channel === "INTERNAL") {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_CHANNEL_INVALID",
      );
    }
    channel = "EXTERNAL";
  } else if (applicationMode === "HYBRID") {
    if (!input.channel) {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_CHANNEL_REQUIRED",
      );
    }
    channel = input.channel;
  } else {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_CHANNEL_INVALID",
    );
  }

  if (
    channel === "EXTERNAL" &&
    !input.externalConfirmation
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_EXTERNAL_CONFIRMATION_REQUIRED",
    );
  }

  return channel;
}

async function loadApplicationDetails(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      job: placementJobs,
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
      },
      candidate: {
        membershipId: collegeMemberships.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        phoneE164: users.phoneE164,
      },
    })
    .from(placementApplications)
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementApplications.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(eq(placementApplications.id, applicationId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_NOT_FOUND",
    );
  }

  const history = await getDb()
    .select()
    .from(placementApplicationStatusHistory)
    .where(
      eq(
        placementApplicationStatusHistory.applicationId,
        applicationId,
      ),
    )
    .orderBy(
      asc(
        placementApplicationStatusHistory.createdAt,
      ),
    );

  return { ...row, history };
}

function resolveExistingApplication(
  existing: typeof placementApplications.$inferSelect,
  channel: "INTERNAL" | "EXTERNAL",
) {
  if (existing.status === "WITHDRAWN") {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_ALREADY_WITHDRAWN",
    );
  }
  if (existing.channel !== channel) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_CHANNEL_CONFLICT",
    );
  }
  return existing;
}

export async function applyToPlacementJob(
  context: RequestContext,
  jobIdInput: string,
  rawInput: CreatePlacementApplicationInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const input =
    createPlacementApplicationInputSchema.parse(
      rawInput,
    );
  const job = await loadJob(jobId);
  const membership = requireLearnerMembership(
    context,
    job.collegeId,
  );
  // Legacy V188: do not let per-job INCLUDE override the college switch or
  // student/class/batch placement participation decision.
  await requireLearnerPlacementAccess(context);

  if (job.status !== "PUBLISHED") {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_JOB_NOT_OPEN",
    );
  }

  const now = new Date();
  if (
    job.applicationDeadline &&
    now.getTime() >
      job.applicationDeadline.getTime()
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_DEADLINE_PASSED",
    );
  }

  const roleOption =
    await resolveApplicationRoleOption(
      job.id,
      input.roleOptionId,
    );
  const channel = resolveApplicationChannel(
    job.applicationMode,
    input,
  );
  if (
    channel === "EXTERNAL" &&
    !job.externalApplicationUrl
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_EXTERNAL_URL_UNAVAILABLE",
    );
  }

  const [existing] = await getDb()
    .select()
    .from(placementApplications)
    .where(
      and(
        eq(
          placementApplications.roleOptionId,
          roleOption.id,
        ),
        eq(
          placementApplications.membershipId,
          membership.id,
        ),
      ),
    )
    .limit(1);

  if (existing) {
    return resolveExistingApplication(
      existing,
      channel,
    );
  }

  const eligibility =
    await evaluatePlacementEligibility(
      context,
      job.id,
    );

  if (eligibility.status === "INELIGIBLE") {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_INELIGIBLE",
    );
  }
  if (eligibility.status === "NEEDS_DATA") {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_NEEDS_DATA",
    );
  }

  const created = await getDb().transaction(
    async (tx) => {
      const [application] = await tx
        .insert(placementApplications)
        .values({
          jobId: job.id,
          roleOptionId: roleOption.id,
          membershipId: membership.id,
          channel,
          eligibilityStatus: eligibility.status,
          eligibilitySnapshot: eligibility,
          submittedByUserId: context.user.id,
          submittedAt: now,
        })
        .onConflictDoNothing()
        .returning();

      if (!application) return null;

      await tx
        .insert(
          placementApplicationStatusHistory,
        )
        .values({
          applicationId: application.id,
          fromStatus: null,
          toStatus: "SUBMITTED",
          actorUserId: context.user.id,
        });

      await tx
        .insert(placementApplicationScreenings)
        .values({
          applicationId: application.id,
        });

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_SUBMITTED,
          collegeId: job.collegeId,
          subjectType:
            "placement_application",
          subjectId: application.id,
          subjectLabel: roleOption.title,
          summary:
            `Application submitted for ${roleOption.title}`,
          metadata: {
            jobId: job.id,
            roleOptionId: roleOption.id,
            membershipId: membership.id,
            channel,
          },
          groupKey:
            `placement-job:${job.id}:applications`,
          dedupeKey:
            `placement-application:${application.id}:submitted`,
        },
      );

      return application;
    },
  );

  if (created) return created;

  const [concurrent] = await getDb()
    .select()
    .from(placementApplications)
    .where(
      and(
        eq(
          placementApplications.roleOptionId,
          roleOption.id,
        ),
        eq(
          placementApplications.membershipId,
          membership.id,
        ),
      ),
    )
    .limit(1);

  if (!concurrent) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_CHANNEL_CONFLICT",
    );
  }
  return resolveExistingApplication(
    concurrent,
    channel,
  );
}

export async function listOwnPlacementApplications(
  context: RequestContext,
) {
  const membership = requireLearnerMembership(
    context,
  );
  await requireLearnerPlacementAccess(context);

  return getDb()
    .select({
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      job: placementJobs,
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
      },
    })
    .from(placementApplications)
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(
      eq(
        placementApplications.membershipId,
        membership.id,
      ),
    )
    .orderBy(desc(placementApplications.submittedAt));
}

export async function listPlacementJobApplications(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  return getDb()
    .select({
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      candidate: {
        membershipId: collegeMemberships.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        phoneE164: users.phoneE164,
      },
    })
    .from(placementApplications)
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementApplications.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      eq(placementApplications.jobId, job.id),
    )
    .orderBy(desc(placementApplications.submittedAt));
}

export async function getPlacementApplication(
  context: RequestContext,
  applicationIdInput: string,
) {
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const row =
    await loadApplicationDetails(applicationId);

  if (
    context.membership?.id ===
      row.application.membershipId &&
    hasMembershipRole(context, "LEARNER")
  ) {
    await requireLearnerPlacementAccess(context);
    return row;
  }

  await requirePlacementManageScope(
    context,
    row.job.collegeId,
  );
  return row;
}

export async function withdrawPlacementApplication(
  context: RequestContext,
  applicationIdInput: string,
) {
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const row =
    await loadApplicationDetails(applicationId);
  const membership = requireLearnerMembership(
    context,
    row.job.collegeId,
  );

  if (
    membership.id !==
    row.application.membershipId
  ) {
    throw new AuthorizationError("placements.read");
  }

  // Loss of placement access never deletes past applications, but self
  // withdrawal is no longer exposed while placement participation is denied.
  await requireLearnerPlacementAccess(context);
  if (row.application.status === "WITHDRAWN") {
    return row.application;
  }

  const now = new Date();
  const updated = await getDb().transaction(
    async (tx) => {
      const [application] = await tx
        .update(placementApplications)
        .set({
          status: "WITHDRAWN",
          withdrawnAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(
              placementApplications.id,
              applicationId,
            ),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
          ),
        )
        .returning();

      if (!application) return null;

      await tx
        .insert(
          placementApplicationStatusHistory,
        )
        .values({
          applicationId: application.id,
          fromStatus: "SUBMITTED",
          toStatus: "WITHDRAWN",
          actorUserId: context.user.id,
        });

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_WITHDRAWN,
          collegeId: row.job.collegeId,
          subjectType:
            "placement_application",
          subjectId: application.id,
          subjectLabel: row.roleOption.title,
          summary:
            `Application withdrawn from ${row.roleOption.title}`,
          metadata: {
            jobId: row.job.id,
            roleOptionId:
              row.roleOption.id,
            membershipId: membership.id,
          },
          groupKey:
            `placement-job:${row.job.id}:applications`,
          dedupeKey:
            `placement-application:${application.id}:withdrawn`,
        },
      );

      return application;
    },
  );

  if (updated) return updated;

  const latest =
    await loadApplicationDetails(applicationId);
  return latest.application;
}
