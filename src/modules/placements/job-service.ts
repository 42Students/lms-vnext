import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  placementCompanyRelationships,
  placementCompanies,
  placementJobs,
  placementJobRoleOptions,
  placementSeasons,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import {
  requirePlacementJobSeasonActive,
} from "./season-service";
import { requirePlacementManageScope } from "./scope";
import {
  createPlacementJobInputSchema,
  placementJobIdSchema,
  updatePlacementJobInputSchema,
  type CreatePlacementJobInput,
  type UpdatePlacementJobInput,
} from "./validation";

async function loadActiveRelationship(
  collegeId: string,
  relationshipId: string,
) {
  const [row] = await getDb()
    .select({
      relationship: placementCompanyRelationships,
      company: placementCompanies,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(
      and(
        eq(placementCompanyRelationships.id, relationshipId),
        eq(placementCompanyRelationships.collegeId, collegeId),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        isNull(placementCompanyRelationships.archivedAt),
        eq(placementCompanies.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND",
    );
  }
  return row;
}

async function loadJob(jobId: string) {
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  }
  return job;
}

export async function listPlacementJobs(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId = createPlacementJobInputSchema.shape.collegeId.parse(
    collegeIdInput,
  );
  await requirePlacementManageScope(context, collegeId);

  return getDb()
    .select({
      job: placementJobs,
      company: placementCompanies,
      season: {
        id: placementSeasons.id,
        name: placementSeasons.name,
        code: placementSeasons.code,
        status: placementSeasons.status,
        startDate: placementSeasons.startDate,
        endDate: placementSeasons.endDate,
      },
    })
    .from(placementJobs)
    .innerJoin(
      placementSeasons,
      eq(
        placementSeasons.id,
        placementJobs.seasonId,
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
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(
      and(
        eq(placementJobs.collegeId, collegeId),
        isNull(placementJobs.archivedAt),
      ),
    )
    .orderBy(asc(placementJobs.title));
}

export async function getPlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );
  return job;
}

export async function createPlacementJob(
  context: RequestContext,
  rawInput: CreatePlacementJobInput,
) {
  const input = createPlacementJobInputSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);
  await loadActiveRelationship(
    input.collegeId,
    input.companyRelationshipId,
  );
  const db = getDb();
  return db.transaction(async (tx) => {
    const seasonConditions = [
      eq(
        placementSeasons.collegeId,
        input.collegeId,
      ),
      eq(
        placementSeasons.status,
        "ACTIVE",
      ),
    ];
    if (input.seasonId) {
      seasonConditions.push(
        eq(
          placementSeasons.id,
          input.seasonId,
        ),
      );
    }

    const [season] = await tx
      .select({
        id: placementSeasons.id,
      })
      .from(placementSeasons)
      .where(and(...seasonConditions))
      .for("update")
      .limit(1);

    if (!season) {
      throw new PlacementsServiceError(
        input.seasonId
          ? "PLACEMENT_SEASON_NOT_ACTIVE"
          : "PLACEMENT_SEASON_REQUIRED",
      );
    }

    const [job] = await tx
      .insert(placementJobs)
      .values({
        collegeId: input.collegeId,
        seasonId: season.id,
        companyRelationshipId:
          input.companyRelationshipId,
        title: input.title,
        description: input.description,
        employmentType:
          input.employmentType,
        workMode: input.workMode,
        locations: input.locations,
        openings: input.openings ?? null,
        minimumAnnualCtcInr:
          input.minimumAnnualCtcInr ?? null,
        maximumAnnualCtcInr:
          input.maximumAnnualCtcInr ?? null,
        applicationMode:
          input.applicationMode,
        externalApplicationUrl:
          input.externalApplicationUrl ?? null,
        applicationDeadline:
          input.applicationDeadline ?? null,
        createdByUserId:
          context.user.id,
      })
      .returning();

    await tx
      .insert(placementJobRoleOptions)
      .values({
        jobId: job.id,
        title: job.title,
        employmentType:
          job.employmentType,
        workMode: job.workMode,
        locations: job.locations,
        openings: job.openings,
        minimumAnnualCtcInr:
          job.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          job.maximumAnnualCtcInr,
        isPrimary: true,
      });

    return job;
  });
}

export async function updatePlacementJob(
  context: RequestContext,
  jobIdInput: string,
  rawInput: UpdatePlacementJobInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const input = updatePlacementJobInputSchema.parse(rawInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  await requirePlacementJobSeasonActive(
    current,
  );

  if (current.status !== "DRAFT") {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  }

  const nextMinimum =
    input.minimumAnnualCtcInr === undefined
      ? current.minimumAnnualCtcInr
      : input.minimumAnnualCtcInr;
  const nextMaximum =
    input.maximumAnnualCtcInr === undefined
      ? current.maximumAnnualCtcInr
      : input.maximumAnnualCtcInr;
  if (
    nextMinimum != null &&
    nextMaximum != null &&
    nextMaximum < nextMinimum
  ) {
    throw new PlacementsServiceError("PLACEMENT_JOB_INVALID_CTC_RANGE");
  }

  const nextMode = input.applicationMode ?? current.applicationMode;
  const nextExternalUrl =
    input.externalApplicationUrl === undefined
      ? current.externalApplicationUrl
      : input.externalApplicationUrl;
  if (nextMode !== "INTERNAL" && !nextExternalUrl) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_EXTERNAL_URL_REQUIRED",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const nextTitle =
      input.title ?? current.title;
    const [duplicateRole] = await tx
      .select({
        id: placementJobRoleOptions.id,
      })
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
          eq(
            placementJobRoleOptions.title,
            nextTitle,
          ),
          eq(
            placementJobRoleOptions.isPrimary,
            false,
          ),
        ),
      )
      .limit(1);

    if (duplicateRole) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROLE_OPTION_DUPLICATE",
      );
    }

    const [updated] = await tx
      .update(placementJobs)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(placementJobs.id, jobId))
      .returning();

    const [primaryRole] = await tx
      .update(placementJobRoleOptions)
      .set({
        title: updated.title,
        employmentType:
          updated.employmentType,
        workMode: updated.workMode,
        locations: updated.locations,
        openings: updated.openings,
        minimumAnnualCtcInr:
          updated.minimumAnnualCtcInr,
        maximumAnnualCtcInr:
          updated.maximumAnnualCtcInr,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            placementJobRoleOptions.jobId,
            jobId,
          ),
          eq(
            placementJobRoleOptions.isPrimary,
            true,
          ),
          eq(
            placementJobRoleOptions.status,
            "ACTIVE",
          ),
        ),
      )
      .returning();

    if (!primaryRole) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED",
      );
    }

    return updated;
  });
}

export async function publishPlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  await requirePlacementJobSeasonActive(
    current,
  );

  if (current.status !== "DRAFT") {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE");
  }
  await loadActiveRelationship(
    current.collegeId,
    current.companyRelationshipId,
  );
  if (
    current.applicationMode !== "INTERNAL" &&
    !current.externalApplicationUrl
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_EXTERNAL_URL_REQUIRED",
    );
  }

  const [activeRole] = await getDb()
    .select({
      id: placementJobRoleOptions.id,
    })
    .from(placementJobRoleOptions)
    .where(
      and(
        eq(
          placementJobRoleOptions.jobId,
          current.id,
        ),
        eq(
          placementJobRoleOptions.status,
          "ACTIVE",
        ),
      ),
    )
    .limit(1);

  if (!activeRole) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROLE_OPTION_REQUIRED",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const now = new Date();
    const [published] = await tx
      .update(placementJobs)
      .set({
        status: "PUBLISHED",
        publishedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(placementJobs.id, jobId),
          eq(
            placementJobs.status,
            "DRAFT",
          ),
        ),
      )
      .returning();

    if (!published) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOB_NOT_PUBLISHABLE",
      );
    }

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_PUBLISHED,
        collegeId: published.collegeId,
        subjectType: "placement_job",
        subjectId: published.id,
        subjectLabel: published.title,
        summary:
          `${published.title} published`,
        metadata: {
          seasonId: published.seasonId,
          companyRelationshipId:
            published.companyRelationshipId,
        },
        groupKey:
          `placement-job:${published.id}`,
        dedupeKey:
          `placement-job:${published.id}:published`,
      },
    );

    return published;
  });
}

export async function closePlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  await requirePlacementJobSeasonActive(
    current,
  );

  if (current.status !== "PUBLISHED") {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const now = new Date();
    const [closed] = await tx
      .update(placementJobs)
      .set({
        status: "CLOSED",
        closedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(placementJobs.id, jobId),
          eq(
            placementJobs.status,
            "PUBLISHED",
          ),
        ),
      )
      .returning();

    if (!closed) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOB_NOT_CLOSABLE",
      );
    }

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_CLOSED,
        collegeId: closed.collegeId,
        subjectType: "placement_job",
        subjectId: closed.id,
        subjectLabel: closed.title,
        summary: `${closed.title} closed`,
        metadata: {
          seasonId: closed.seasonId,
        },
        groupKey:
          `placement-job:${closed.id}`,
        dedupeKey:
          `placement-job:${closed.id}:closed`,
      },
    );

    return closed;
  });
}

export async function archivePlacementJob(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);

  if (current.status === "PUBLISHED") {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_CLOSE_BEFORE_ARCHIVE",
    );
  }
  if (current.status === "ARCHIVED") return current;

  const now = new Date();
  const [archived] = await getDb()
    .update(placementJobs)
    .set({ status: "ARCHIVED", archivedAt: now, updatedAt: now })
    .where(eq(placementJobs.id, jobId))
    .returning();
  return archived;
}
