import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  placementCompanyRelationships,
  placementCompanies,
  placementApplications,
  placementOffers,
  placementOfferStatusHistory,
  placementDebarmentDriveEvents,
  placementDebarments,
  placementJobs,
  placementJobRoleOptions,
  placementSeasons,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { isDebarmentActive } from "./batch-registration-policy";
import {notifyEligiblePublishedDrive} from "./tpo-drive-publish-effects";
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
  if (!can(context, "placements.manage", { collegeId: input.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId: input.collegeId });
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
        legacyPostingDetails:input.legacyPostingDetails??null,
        employmentType:
          input.employmentType,
        workMode: input.workMode,
        locations: input.locations,
        openings: input.openings ?? null,
        minimumAnnualCtcInr:
          input.minimumAnnualCtcInr ?? null,
        maximumAnnualCtcInr:
          input.maximumAnnualCtcInr ?? null,
        isDream: input.isDream,
        fixedCtcLpa:input.fixedCtcLpa==null?null:input.fixedCtcLpa.toFixed(2),
        variableCtcLpa:input.variableCtcLpa==null?null:input.variableCtcLpa.toFixed(2),
        stipendPerMonthInr:input.stipendPerMonthInr??null,
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

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_JOB_DRAFT_CREATED,
      collegeId: input.collegeId,
      subjectType: "placement_job",
      subjectId: job.id,
      subjectLabel: job.title,
      summary: "Placement drive draft created",
      metadata: {
        seasonId: season.id,
        companyRelationshipId: input.companyRelationshipId,
        draftStatus: job.status,
      },
      groupKey: "placement-jobs:" + input.collegeId,
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

  const legacyAssessmentDeadline=input.legacyPostingDetails?.assessmentDeadline;
  if(legacyAssessmentDeadline){
    const applicationDeadline=input.applicationDeadline??current.applicationDeadline;
    if(!applicationDeadline||Date.parse(legacyAssessmentDeadline)<=applicationDeadline.getTime())
      throw new PlacementsServiceError("PLACEMENT_JOB_INVALID_DEADLINE");
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
        fixedCtcLpa:input.fixedCtcLpa===undefined?undefined:
          input.fixedCtcLpa===null?null:input.fixedCtcLpa.toFixed(2),
        variableCtcLpa:input.variableCtcLpa===undefined?undefined:
          input.variableCtcLpa===null?null:input.variableCtcLpa.toFixed(2),
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
      minCtc:placementJobRoleOptions.minimumAnnualCtcInr,
      maxCtc:placementJobRoleOptions.maximumAnnualCtcInr,
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
    throw new PlacementsServiceError("PLACEMENT_ROLE_OPTION_REQUIRED");
  }
  if(!current.applicationDeadline||current.applicationDeadline<=new Date()||
    (current.minimumAnnualCtcInr===null&&current.maximumAnnualCtcInr===null&&
      current.stipendPerMonthInr===null&&activeRole.minCtc===null&&activeRole.maxCtc===null)){
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE");
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

    // P-S1-08: A debarment measured in subsequent drives counts at
    // publication, whether or not the excluded learner ever applies.
    // The registered DB08 trigger increments drives_counted and appends
    // immutable history only for a newly inserted (debarment, job) pair.
    const publishedEvent = await recordActivityEventInTransaction(
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

    // TPO-drives-46: deliver to the eligible audience before a newly published
    // drive advances drive-count debarments. Use the immutable activity event ID.
    await notifyEligiblePublishedDrive(tx,context,published,publishedEvent.id);
    const localDateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const datePart = (type: string) =>
      localDateParts.find((part) => part.type === type)?.value ?? "";
    const collegeToday = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
    const countableDebarments = await tx.select().from(placementDebarments)
      .where(and(
        eq(placementDebarments.collegeId, published.collegeId),
        isNull(placementDebarments.liftedAt),
      ))
      .for("update");
    for (const debarment of countableDebarments) {
      // Date-based bans are governed by calendar date, not drive count.
      if (debarment.untilDate !== null || debarment.untilDrives === null ||
          !isDebarmentActive(debarment, collegeToday)) continue;
      await tx.insert(placementDebarmentDriveEvents).values({
        debarmentId: debarment.id,
        jobId: published.id,
        recordedByUserId: context.user.id,
      }).onConflictDoNothing();
    }

    return published;
  });
}

type PlacementTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** P-S2-12 / D11: closing a drive revokes only still-actionable letters. */
export function mustWithdrawPendingOfferOnDriveStop(status: string): boolean {
  return status === "ISSUED";
}

async function withdrawJobIssuedOffers(
  tx: PlacementTx, jobId: string, actorUserId: string, now: Date,
): Promise<number> {
  const offers = await tx.select({id:placementOffers.id,status:placementOffers.status})
    .from(placementOffers)
    .innerJoin(placementApplications,
      eq(placementApplications.id,placementOffers.applicationId))
    .where(and(eq(placementApplications.jobId,jobId),
      eq(placementOffers.status,"ISSUED"))).for("update");
  for (const offer of offers) {
    if (!mustWithdrawPendingOfferOnDriveStop(offer.status)) continue;
    await tx.update(placementOffers).set({
      status:"WITHDRAWN",withdrawnByUserId:actorUserId,
      withdrawnAt:now,updatedAt:now,
    }).where(and(eq(placementOffers.id,offer.id),
      eq(placementOffers.status,"ISSUED")));
    await tx.insert(placementOfferStatusHistory).values({
      offerId:offer.id,fromStatus:"ISSUED",toStatus:"WITHDRAWN",
      actorUserId,
    });
  }
  return offers.length;
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

    await withdrawJobIssuedOffers(tx, closed.id, context.user.id, now);
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

/** P-S2-12: cancelled drives cease accepting applications and pending offers. */
export function canCancelPublishedPlacementJob(status: string): boolean {
  return status === "PUBLISHED";
}

export async function cancelPlacementJob(context: RequestContext, jobIdInput: string) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const current = await loadJob(jobId);
  await requirePlacementManageScope(context, current.collegeId);
  if (!canCancelPublishedPlacementJob(current.status)) {
    throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  }
  return getDb().transaction(async tx => {
    const now = new Date();
    const [cancelled] = await tx.update(placementJobs).set({
      status:"CANCELLED",closedAt:now,updatedAt:now,
    }).where(and(eq(placementJobs.id,jobId),
      eq(placementJobs.status,"PUBLISHED"))).returning();
    if (!cancelled) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
    await withdrawJobIssuedOffers(tx,jobId,context.user.id,now);
    return cancelled;
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

  return getDb().transaction(async tx => {
    const [locked] = await tx.select({status:placementJobs.status})
      .from(placementJobs).where(eq(placementJobs.id,jobId)).for("update").limit(1);
    if (!locked || locked.status === "PUBLISHED") {
      throw new PlacementsServiceError("PLACEMENT_JOB_CLOSE_BEFORE_ARCHIVE");
    }
    if (locked.status === "ARCHIVED") return current;
    const now = new Date();
    await withdrawJobIssuedOffers(tx,jobId,context.user.id,now);
    const [archived] = await tx.update(placementJobs)
      .set({status:"ARCHIVED",archivedAt:now,updatedAt:now})
      .where(and(eq(placementJobs.id,jobId),eq(placementJobs.status,locked.status)))
      .returning();
    return archived;
  });
}
