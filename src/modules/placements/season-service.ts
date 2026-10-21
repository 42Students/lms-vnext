import {
  and,
  asc,
  eq,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  colleges,
  placementJobs,
  placementSeasons,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {
  createPlacementJobInputSchema,
  createPlacementSeasonInputSchema,
  placementSeasonIdSchema,
  type CreatePlacementSeasonInput,
} from "./validation";

/** Legacy season endpoints: GET /season → listPlacementSeasons,
 * GET /current → current ACTIVE season in selected college,
 * POST /season → createPlacementSeason. Open-registration is NOT the same as
 * opening a season: it must use the registered batch-invitation lifecycle
 * with its separate authorization/preview and cannot be inferred by status.
 */
export async function currentPlacementSeason(context:RequestContext,collegeId:string){
 const seasons=await listPlacementSeasons(context,collegeId);
 return seasons.find(season=>season.status==="ACTIVE")??null;
}
export async function listPlacementSeasons(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId =
    createPlacementJobInputSchema.shape.collegeId.parse(
      collegeIdInput,
    );
  await requirePlacementManageScope(
    context,
    collegeId,
  );

  return getDb()
    .select()
    .from(placementSeasons)
    .where(
      eq(
        placementSeasons.collegeId,
        collegeId,
      ),
    )
    .orderBy(
      asc(placementSeasons.startDate),
      asc(placementSeasons.createdAt),
    );
}

export async function createPlacementSeason(
  context: RequestContext,
  rawInput: CreatePlacementSeasonInput,
) {
  const input =
    createPlacementSeasonInputSchema.parse(
      rawInput,
    );
  await requirePlacementManageScope(
    context,
    input.collegeId,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    const [college] = await tx
      .select({ id: colleges.id })
      .from(colleges)
      .where(
        eq(colleges.id, input.collegeId),
      )
      .for("update")
      .limit(1);

    if (!college) {
      throw new PlacementsServiceError(
        "COLLEGE_NOT_FOUND",
      );
    }

    const [active] = await tx
      .select({ id: placementSeasons.id })
      .from(placementSeasons)
      .where(
        and(
          eq(
            placementSeasons.collegeId,
            input.collegeId,
          ),
          eq(
            placementSeasons.status,
            "ACTIVE",
          ),
        ),
      )
      .limit(1);

    if (active) {
      throw new PlacementsServiceError(
        "PLACEMENT_SEASON_ACTIVE_EXISTS",
      );
    }

    const normalizedCode =
      input.code.toLocaleLowerCase("en");
    const existing = await tx
      .select({
        id: placementSeasons.id,
        code: placementSeasons.code,
      })
      .from(placementSeasons)
      .where(
        eq(
          placementSeasons.collegeId,
          input.collegeId,
        ),
      );

    if (
      existing.some(
        (season) =>
          season.code.toLocaleLowerCase(
            "en",
          ) === normalizedCode,
      )
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_SEASON_CODE_CONFLICT",
      );
    }

    const [season] = await tx
      .insert(placementSeasons)
      .values({
        collegeId: input.collegeId,
        name: input.name,
        code: input.code,
        startDate: input.startDate,
        endDate: input.endDate,
        createdByUserId:
          context.user.id,
      })
      .returning();

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_SEASON_STARTED,
        collegeId: season.collegeId,
        subjectType: "placement_season",
        subjectId: season.id,
        subjectLabel: season.name,
        summary:
          `Placement season ${season.name} started`,
        metadata: {
          code: season.code,
          startDate: season.startDate,
          endDate: season.endDate,
        },
        groupKey:
          `placement-season:${season.id}`,
        dedupeKey:
          `placement-season:${season.id}:started`,
      },
    );

    return season;
  });
}

export async function closePlacementSeason(
  context: RequestContext,
  seasonIdInput: string,
) {
  const seasonId =
    placementSeasonIdSchema.parse(
      seasonIdInput,
    );

  const [current] = await getDb()
    .select()
    .from(placementSeasons)
    .where(
      eq(
        placementSeasons.id,
        seasonId,
      ),
    )
    .limit(1);

  if (!current) {
    throw new PlacementsServiceError(
      "PLACEMENT_SEASON_NOT_FOUND",
    );
  }

  await requirePlacementManageScope(
    context,
    current.collegeId,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    const [season] = await tx
      .select()
      .from(placementSeasons)
      .where(
        eq(
          placementSeasons.id,
          current.id,
        ),
      )
      .for("update")
      .limit(1);

    if (!season) {
      throw new PlacementsServiceError(
        "PLACEMENT_SEASON_NOT_FOUND",
      );
    }
    if (season.status === "CLOSED") {
      return season;
    }

    const activeJobs = await tx
      .select({
        id: placementJobs.id,
      })
      .from(placementJobs)
      .where(
        and(
          eq(
            placementJobs.seasonId,
            season.id,
          ),
          inArray(
            placementJobs.status,
            ["DRAFT", "PUBLISHED"],
          ),
        ),
      )
      .limit(1);

    if (activeJobs.length > 0) {
      throw new PlacementsServiceError(
        "PLACEMENT_SEASON_HAS_ACTIVE_JOBS",
      );
    }

    const now = new Date();
    const [closed] = await tx
      .update(placementSeasons)
      .set({
        status: "CLOSED",
        closedByUserId:
          context.user.id,
        closedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            placementSeasons.id,
            season.id,
          ),
          eq(
            placementSeasons.status,
            "ACTIVE",
          ),
        ),
      )
      .returning();

    if (!closed) {
      const [latest] = await tx
        .select()
        .from(placementSeasons)
        .where(
          eq(
            placementSeasons.id,
            season.id,
          ),
        )
        .limit(1);
      if (
        latest?.status === "CLOSED"
      ) {
        return latest;
      }
      throw new PlacementsServiceError(
        "PLACEMENT_SEASON_NOT_ACTIVE",
      );
    }

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_SEASON_CLOSED,
        collegeId: closed.collegeId,
        subjectType: "placement_season",
        subjectId: closed.id,
        subjectLabel: closed.name,
        summary:
          `Placement season ${closed.name} closed`,
        metadata: {
          code: closed.code,
          closedAt:
            closed.closedAt?.toISOString() ??
            null,
        },
        groupKey:
          `placement-season:${closed.id}`,
        dedupeKey:
          `placement-season:${closed.id}:closed`,
      },
    );

    return closed;
  });
}

export async function resolvePlacementSeasonForJobCreation(
  collegeId: string,
  requestedSeasonId?: string,
) {
  const conditions = [
    eq(
      placementSeasons.collegeId,
      collegeId,
    ),
    eq(
      placementSeasons.status,
      "ACTIVE",
    ),
  ];

  if (requestedSeasonId) {
    conditions.push(
      eq(
        placementSeasons.id,
        requestedSeasonId,
      ),
    );
  }

  const [season] = await getDb()
    .select()
    .from(placementSeasons)
    .where(and(...conditions))
    .limit(1);

  if (!season) {
    throw new PlacementsServiceError(
      requestedSeasonId
        ? "PLACEMENT_SEASON_NOT_ACTIVE"
        : "PLACEMENT_SEASON_REQUIRED",
    );
  }

  return season;
}

export async function requirePlacementJobSeasonActive(
  job: {
    collegeId: string;
    seasonId: string;
  },
) {
  const [season] = await getDb()
    .select({
      id: placementSeasons.id,
    })
    .from(placementSeasons)
    .where(
      and(
        eq(
          placementSeasons.id,
          job.seasonId,
        ),
        eq(
          placementSeasons.collegeId,
          job.collegeId,
        ),
        eq(
          placementSeasons.status,
          "ACTIVE",
        ),
      ),
    )
    .limit(1);

  if (!season) {
    throw new PlacementsServiceError(
      "PLACEMENT_SEASON_NOT_ACTIVE",
    );
  }
}
