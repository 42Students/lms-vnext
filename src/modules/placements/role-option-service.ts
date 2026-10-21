import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementJobRoleOptions,
  placementJobs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementJobSeasonActive } from "./season-service";
import { requirePlacementManageScope } from "./scope";
import {
  createPlacementRoleOptionInputSchema,
  placementJobIdSchema,
  placementRoleOptionIdSchema,
  updatePlacementRoleOptionInputSchema,
  type CreatePlacementRoleOptionInput,
  type UpdatePlacementRoleOptionInput,
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

async function loadRoleOption(
  jobId: string,
  roleOptionId: string,
) {
  const [roleOption] = await getDb()
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
      ),
    )
    .limit(1);

  if (!roleOption) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROLE_OPTION_NOT_FOUND",
    );
  }
  return roleOption;
}

async function requireDraftJob(
  context: RequestContext,
  jobId: string,
) {
  const job = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );
  if (job.status !== "DRAFT") {
    throw new PlacementsServiceError(
      "PLACEMENT_ROLE_OPTION_NOT_EDITABLE",
    );
  }
  await requirePlacementJobSeasonActive(job);
  return job;
}

export async function listPlacementRoleOptions(
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

  return getDb()
    .select()
    .from(placementJobRoleOptions)
    .where(
      eq(
        placementJobRoleOptions.jobId,
        jobId,
      ),
    )
    .orderBy(
      desc(
        placementJobRoleOptions.isPrimary,
      ),
      asc(placementJobRoleOptions.createdAt),
    );
}

export async function createPlacementRoleOption(
  context: RequestContext,
  jobIdInput: string,
  rawInput: CreatePlacementRoleOptionInput,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const input =
    createPlacementRoleOptionInputSchema.parse(
      rawInput,
    );
  await requireDraftJob(context, jobId);

  const [created] = await getDb()
    .insert(placementJobRoleOptions)
    .values({
      jobId,
      title: input.title,
      employmentType:
        input.employmentType,
      workMode: input.workMode,
      locations: input.locations,
      openings: input.openings ?? null,
      minimumAnnualCtcInr:
        input.minimumAnnualCtcInr ?? null,
      maximumAnnualCtcInr:
        input.maximumAnnualCtcInr ?? null,
      ctcLpa: input.ctcLpa == null ? null : input.ctcLpa.toFixed(4),
      fixedLpa: input.fixedLpa == null ? null : input.fixedLpa.toFixed(2),
      variableLpa: input.variableLpa == null ? null : input.variableLpa.toFixed(2),
      joiningBonusLpa: input.joiningBonusLpa == null ? null : input.joiningBonusLpa.toFixed(2),
      stipendPerMonthInr: input.stipendPerMonthInr == null ? null : input.stipendPerMonthInr.toFixed(2),
      stipendMonths: input.stipendMonths ?? null,
      isPrimary: false,
    })
    .onConflictDoNothing()
    .returning();

  if (!created) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROLE_OPTION_DUPLICATE",
    );
  }
  return created;
}

export async function updatePlacementRoleOption(
  context: RequestContext,
  jobIdInput: string,
  roleOptionIdInput: string,
  rawInput: UpdatePlacementRoleOptionInput,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const roleOptionId =
    placementRoleOptionIdSchema.parse(
      roleOptionIdInput,
    );
  const input =
    updatePlacementRoleOptionInputSchema.parse(
      rawInput,
    );
  await requireDraftJob(context, jobId);
  const current = await loadRoleOption(
    jobId,
    roleOptionId,
  );

  if (current.status !== "ACTIVE") {
    throw new PlacementsServiceError(
      "PLACEMENT_ROLE_OPTION_NOT_EDITABLE",
    );
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
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_INVALID_CTC_RANGE",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const nextTitle =
      input.title ?? current.title;
    const [duplicate] = await tx
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
        ),
      )
      .limit(1);

    if (
      duplicate &&
      duplicate.id !== roleOptionId
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_ROLE_OPTION_DUPLICATE",
      );
    }

    const [updated] = await tx
      .update(placementJobRoleOptions)
      .set({
        ...input,
        ctcLpa: input.ctcLpa === undefined ? undefined : input.ctcLpa === null ? null : input.ctcLpa.toFixed(4),
        fixedLpa: input.fixedLpa === undefined ? undefined : input.fixedLpa === null ? null : input.fixedLpa.toFixed(2),
        variableLpa: input.variableLpa === undefined ? undefined : input.variableLpa === null ? null : input.variableLpa.toFixed(2),
        joiningBonusLpa: input.joiningBonusLpa === undefined ? undefined : input.joiningBonusLpa === null ? null : input.joiningBonusLpa.toFixed(2),
        stipendPerMonthInr: input.stipendPerMonthInr === undefined ? undefined : input.stipendPerMonthInr === null ? null : input.stipendPerMonthInr.toFixed(2),
        updatedAt: new Date(),
      })
      .where(
        eq(
          placementJobRoleOptions.id,
          roleOptionId,
        ),
      )
      .returning();

    if (updated.isPrimary) {
      await tx
        .update(placementJobs)
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
        .where(eq(placementJobs.id, jobId));
    }

    return updated;
  });
}

export async function archivePlacementRoleOption(
  context: RequestContext,
  jobIdInput: string,
  roleOptionIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const roleOptionId =
    placementRoleOptionIdSchema.parse(
      roleOptionIdInput,
    );
  await requireDraftJob(context, jobId);
  const current = await loadRoleOption(
    jobId,
    roleOptionId,
  );

  if (current.status === "ARCHIVED") {
    return current;
  }
  if (current.isPrimary) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED",
    );
  }

  const now = new Date();
  const [archived] = await getDb()
    .update(placementJobRoleOptions)
    .set({
      status: "ARCHIVED",
      archivedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          placementJobRoleOptions.id,
          roleOptionId,
        ),
        eq(
          placementJobRoleOptions.status,
          "ACTIVE",
        ),
      ),
    )
    .returning();

  return archived ?? current;
}
