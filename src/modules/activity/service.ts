import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  colleges,
  organizations,
  users,
} from "@/db/schema";
import {
  hasActiveMembership,
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import {
  requirePermission,
} from "@/modules/permissions/policy";
import { adminAuditTextFilterSchema, auditLiteralLikePattern } from "./admin-audit-search-model";
import { ActivityServiceError } from "./errors";
import { parseActivityDateBoundary, type ActivityDateBoundary } from "./date-boundary";
import { sanitizeActivityMetadata } from "./metadata-sanitizer";
import {
  ACTIVITY_EVENT_TYPES,
  ACTIVITY_IMPORTANCE,
  ACTIVITY_MODULES,
  defaultActivityImportance,
  type ActivityEventType,
  type ActivityImportance,
  type ActivityModule,
} from "./taxonomy";

type ActivityWriter = Pick<
  ReturnType<typeof getDb>,
  "select" | "insert"
>;

function activityDateSchema(boundary: ActivityDateBoundary) {
  return z.union([z.date(), z.string()]).transform((value, ctx) => {
    try {
      return parseActivityDateBoundary(value, boundary);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Activity date must be YYYY-MM-DD or an offset-aware ISO datetime",
      });
      return z.NEVER;
    }
  });
}

const activityFilterSchema = z
  .object({
    collegeId: z.string().uuid().optional(),
    organizationId:
      z.string().uuid().optional(),
    module: z
      .enum(ACTIVITY_MODULES)
      .optional(),
    importance: z
      .enum(ACTIVITY_IMPORTANCE)
      .optional(),
    importantOnly: z.boolean().optional(),
    legacyCategory: z.enum(["important","setup","people","teaching","projects"]).optional(),
    actorUserId:
      z.string().uuid().optional(),
    eventType: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional(),
    subjectType: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .optional(),
    subjectId: z.string().trim().min(1).max(500).optional(),
    metadataModule:z.enum(["projects","electives"]).optional(),
    ...adminAuditTextFilterSchema.shape,
    from: activityDateSchema("from").optional(),
    to: activityDateSchema("to").optional(),
    beforeOccurredAt:
      z.coerce.date().optional(),
    beforeId: z.string().uuid().optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      // Project audit's 30-day view intentionally reads 200 events;
      // still cap every caller to a fixed bounded page.
      .max(200)
      .default(40),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      Boolean(value.beforeOccurredAt) !==
      Boolean(value.beforeId)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["beforeId"],
        message:
          "Pagination cursor requires both beforeOccurredAt and beforeId",
      });
    }
    if (
      value.from &&
      value.to &&
      value.from.getTime() >
        value.to.getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message:
          "Activity date range is invalid",
      });
    }
  });

export type ActivityFilterInput =
  z.input<typeof activityFilterSchema>;

export type RecordActivityEventInput = {
  eventType: ActivityEventType;
  collegeId?: string | null;
  organizationId?: string | null;
  importance?: ActivityImportance;
  subjectType: string;
  subjectId: string;
  subjectLabel?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  groupKey?: string | null;
  dedupeKey?: string | null;
  occurredAt?: Date;
};

function moduleForEventType(
  eventType: ActivityEventType,
): ActivityModule {
  const prefix =
    eventType.split(".")[0]?.toUpperCase();
  if (
    prefix &&
    ACTIVITY_MODULES.includes(
      prefix as ActivityModule,
    )
  ) {
    return prefix as ActivityModule;
  }
  return "PLATFORM";
}

async function resolveEventScope(
  db: ActivityWriter,
  input: Pick<
    RecordActivityEventInput,
    "collegeId" | "organizationId"
  >,
) {
  if (input.collegeId) {
    const [college] = await db
      .select({
        id: colleges.id,
        organizationId:
          colleges.organizationId,
      })
      .from(colleges)
      .where(
        eq(colleges.id, input.collegeId),
      )
      .limit(1);

    if (!college) {
      throw new ActivityServiceError(
        "ACTIVITY_SCOPE_NOT_FOUND",
      );
    }
    if (
      input.organizationId &&
      input.organizationId !==
        college.organizationId
    ) {
      throw new ActivityServiceError(
        "ACTIVITY_SCOPE_MISMATCH",
      );
    }

    return {
      collegeId: college.id,
      organizationId:
        college.organizationId,
    };
  }

  if (input.organizationId) {
    const [organization] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        eq(
          organizations.id,
          input.organizationId,
        ),
      )
      .limit(1);
    if (!organization) {
      throw new ActivityServiceError(
        "ACTIVITY_SCOPE_NOT_FOUND",
      );
    }
    return {
      collegeId: null,
      organizationId:
        organization.id,
    };
  }

  return {
    collegeId: null,
    organizationId: null,
  };
}

async function writeActivityEvent(
  db: ActivityWriter,
  context: RequestContext,
  rawInput: RecordActivityEventInput,
) {
  const eventType = z
    .enum(
      Object.values(
        ACTIVITY_EVENT_TYPES,
      ) as [
        ActivityEventType,
        ...ActivityEventType[],
      ],
    )
    .parse(rawInput.eventType);
  const subjectType = z
    .string()
    .trim()
    .min(1)
    .max(80)
    .parse(rawInput.subjectType);
  const subjectId = z
    .string()
    .trim()
    .min(1)
    .max(500)
    .parse(rawInput.subjectId);
  const summary = z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .parse(rawInput.summary);
  const scope =
    await resolveEventScope(db, rawInput);

  const actorMembershipId =
    hasActiveMembership(context) &&
    scope.collegeId &&
    context.membership?.collegeId ===
      scope.collegeId
      ? context.membership.id
      : null;

  const values = {
    ...scope,
    actorUserId: context.user.id,
    actorMembershipId,
    module:
      moduleForEventType(eventType),
    eventType,
    importance:
      rawInput.importance ??
      defaultActivityImportance(
        eventType,
      ),
    subjectType,
    subjectId,
    subjectLabel:
      rawInput.subjectLabel?.trim() ||
      null,
    summary,
    metadata:
      rawInput.metadata ?? {},
    groupKey:
      rawInput.groupKey?.trim() ||
      null,
    dedupeKey:
      rawInput.dedupeKey?.trim() ||
      null,
    occurredAt:
      rawInput.occurredAt ??
      new Date(),
  };

  const [created] = await db
    .insert(activityEvents)
    .values(values)
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  if (values.dedupeKey) {
    const [existing] = await db
      .select()
      .from(activityEvents)
      .where(
        eq(
          activityEvents.dedupeKey,
          values.dedupeKey,
        ),
      )
      .limit(1);
    if (existing) return existing;
  }

  throw new ActivityServiceError(
    "ACTIVITY_EVENT_NOT_FOUND",
  );
}

export async function recordActivityEvent(
  context: RequestContext,
  rawInput: RecordActivityEventInput,
) {
  return writeActivityEvent(
    getDb(),
    context,
    rawInput,
  );
}

export async function recordActivityEventInTransaction(
  tx: ActivityWriter,
  context: RequestContext,
  rawInput: RecordActivityEventInput,
) {
  return writeActivityEvent(
    tx,
    context,
    rawInput,
  );
}

async function resolveReadScope(
  context: RequestContext,
  collegeId?: string,
  organizationId?: string,
) {
  if (hasActiveMembership(context)) {
    const ownCollege =
      context.membership!.collegeId;
    const ownOrganization =
      context.membership!.organizationId;

    requirePermission(
      context,
      "activity.read",
      {
        collegeId:
          collegeId ?? ownCollege,
        organizationId:
          organizationId ??
          ownOrganization,
      },
    );

    if (
      collegeId &&
      collegeId !== ownCollege
    ) {
      requirePermission(
        context,
        "activity.read",
        { collegeId },
      );
    }
    if (
      organizationId &&
      organizationId !==
        ownOrganization
    ) {
      requirePermission(
        context,
        "activity.read",
        { organizationId },
      );
    }

    return {
      collegeId: ownCollege,
      organizationId:
        ownOrganization,
    };
  }

  if (!isSuperAdmin(context)) {
    requirePermission(
      context,
      "activity.read",
    );
  }

  const selectedCollege =
    collegeId ??
    context.adminScope?.collegeId ??
    null;
  let resolvedOrganization =
    organizationId ??
    context.adminScope
      ?.organizationId ??
    null;

  if (selectedCollege) {
    const [college] = await getDb()
      .select({
        id: colleges.id,
        organizationId:
          colleges.organizationId,
      })
      .from(colleges)
      .where(
        eq(
          colleges.id,
          selectedCollege,
        ),
      )
      .limit(1);
    if (!college) {
      throw new ActivityServiceError(
        "ACTIVITY_SCOPE_NOT_FOUND",
      );
    }
    if (
      resolvedOrganization &&
      resolvedOrganization !==
        college.organizationId
    ) {
      throw new ActivityServiceError(
        "ACTIVITY_SCOPE_MISMATCH",
      );
    }
    resolvedOrganization =
      college.organizationId;

    requirePermission(
      context,
      "activity.read",
      {
        collegeId: college.id,
        organizationId:
          college.organizationId,
      },
    );

    return {
      collegeId: college.id,
      organizationId:
        college.organizationId,
    };
  }

  if (resolvedOrganization) {
    requirePermission(
      context,
      "activity.read",
      {
        organizationId:
          resolvedOrganization,
      },
    );
  } else {
    requirePermission(
      context,
      "activity.read",
    );
  }

  return {
    collegeId: null,
    organizationId:
      resolvedOrganization,
  };
}

/** Historical audit categories, scoped before LIMIT/cursor to preserve counts. */
function legacyCategoryCondition(category:"important"|"setup"|"people"|"teaching"|"projects"):SQL{
 const subject=sql`lower(${activityEvents.subjectType})`;
 const event=sql`upper(${activityEvents.eventType})`;
 if(category==="important")return or(
  inArray(activityEvents.importance,["HIGH","CRITICAL"]),
  sql`${event} ~ '(DELETE|RESTORE|PROMOTE|BATCH[._]SEMESTER[._]UPDATE|SUSPEND|REACTIVAT|IMPERSONAT|MODULE[._]ACCESS|FEATURE[._]TOGGLE|IDENTITY[._]READ|BULK[._]STATUS)'`,
 )!;
 if(category==="setup")return or(
  sql`${subject} in ('department','program','semester','batch','class','course','lesson','lecture_hall','academic_year')`,
  inArray(activityEvents.module,["ACADEMICS","COURSES"]),
 )!;
 if(category==="people")return or(
  sql`${subject} in ('faculty','learner','learner_profile','user','college_membership')`,
  sql`${event} like '%MODULE_ACCESS%'`,
  eq(activityEvents.module,"IDENTITY"),
 )!;
 if(category==="teaching")return or(
  sql`${subject} in ('class_schedule','announcement','quiz','lesson_content','attendance')`,
  eq(activityEvents.module,"COURSES"),
 )!;
 return or(
  sql`${subject} in ('project','project_task','project_template','project_instance','project_task_comment')`,
  eq(activityEvents.module,"PROJECTS"),
 )!;
}

export async function listActivityEvents(
  context: RequestContext,
  rawInput: ActivityFilterInput = {},
) {
  const input =
    activityFilterSchema.parse(
      rawInput,
    );
  const scope = await resolveReadScope(
    context,
    input.collegeId,
    input.organizationId,
  );
  const conditions: SQL[] = [];

  if (scope.collegeId) {
    conditions.push(
      eq(
        activityEvents.collegeId,
        scope.collegeId,
      ),
    );
  } else if (scope.organizationId) {
    conditions.push(
      eq(
        activityEvents.organizationId,
        scope.organizationId,
      ),
    );
  }

  if (input.module) {
    conditions.push(
      eq(
        activityEvents.module,
        input.module,
      ),
    );
  }
  if (input.importance) {
    conditions.push(
      eq(
        activityEvents.importance,
        input.importance,
      ),
    );
  }
  if (input.importantOnly && !input.importance) {
    // Historical important actions count even when emitted as LOW importance.
    conditions.push(legacyCategoryCondition("important"));
  }
  if (input.legacyCategory && !(input.legacyCategory==="important"&&input.importantOnly)) {
    conditions.push(legacyCategoryCondition(input.legacyCategory));
  }
  if (input.actorUserId) {
    conditions.push(
      eq(
        activityEvents.actorUserId,
        input.actorUserId,
      ),
    );
  }
  if (input.eventType) {
    conditions.push(
      eq(
        activityEvents.eventType,
        input.eventType,
      ),
    );
  }
  if (input.subjectType) {
    conditions.push(
      eq(
        activityEvents.subjectType,
        input.subjectType,
      ),
    );
  }
  if (input.subjectId) {
    conditions.push(eq(activityEvents.subjectId, input.subjectId));
  }
  if (input.metadataModule) {
    conditions.push(sql`${activityEvents.metadata} ->> 'module' = ${input.metadataModule}`);
  }
  if (input.actorName) conditions.push(ilike(users.displayName, auditLiteralLikePattern(input.actorName)));
  if (input.q) {
    const pattern = auditLiteralLikePattern(input.q);
    conditions.push(or(ilike(activityEvents.summary, pattern), ilike(activityEvents.subjectLabel, pattern),
      ilike(activityEvents.subjectId, pattern), ilike(activityEvents.eventType, pattern),
      ilike(activityEvents.subjectType, pattern))!);
  }
  if (input.from) {
    conditions.push(
      gte(
        activityEvents.occurredAt,
        input.from,
      ),
    );
  }
  if (input.to) {
    conditions.push(
      lte(
        activityEvents.occurredAt,
        input.to,
      ),
    );
  }
  if (
    input.beforeOccurredAt &&
    input.beforeId
  ) {
    conditions.push(
      or(
        lt(
          activityEvents.occurredAt,
          input.beforeOccurredAt,
        ),
        and(
          eq(
            activityEvents.occurredAt,
            input.beforeOccurredAt,
          ),
          lt(
            activityEvents.id,
            input.beforeId,
          ),
        ),
      )!,
    );
  }

  const rows = await getDb()
    .select({
      event: activityEvents,
      actor: {
        id: users.id,
        displayName:
          users.displayName,
        email: users.email,
      },
    })
    .from(activityEvents)
    .leftJoin(
      users,
      eq(
        users.id,
        activityEvents.actorUserId,
      ),
    )
    .where(
      conditions.length > 0
        ? and(...conditions)
        : undefined,
    )
    .orderBy(
      desc(activityEvents.occurredAt),
      desc(activityEvents.id),
    )
    .limit(input.limit + 1);

  const hasMore =
    rows.length > input.limit;
  const items = hasMore
    ? rows.slice(0, input.limit)
    : rows;
  const last =
    items[items.length - 1];

  const [remainingRow]=hasMore?await getDb().select({n:count()})
    .from(activityEvents).leftJoin(users,eq(users.id,activityEvents.actorUserId))
    .where(conditions.length?and(...conditions):undefined):[{n:items.length}];
  return {
    remainingCount:hasMore?Math.max(0,(remainingRow?.n??0)-items.length):0,
    items,
    groups:
      groupActivityEvents(items),
    nextCursor:
      hasMore && last
        ? {
            beforeOccurredAt:
              last.event.occurredAt,
            beforeId:
              last.event.id,
          }
        : null,
  };
}

export type ActivityEventRow = {
  event:
    typeof activityEvents.$inferSelect;
  actor: {
    id: string | null;
    displayName: string | null;
    email: string | null;
  } | null;
};

export function groupActivityEvents<
  T extends ActivityEventRow,
>(
  items: readonly T[],
) {
  const groups: Array<{
    key: string;
    count: number;
    latest: T;
    earliest: T;
  }> = [];

  for (const item of items) {
    const key =
      item.event.groupKey ??
      item.event.id;
    const previous =
      groups[groups.length - 1];
    const canGroup =
      Boolean(
        item.event.groupKey,
      ) &&
      previous?.key === key &&
      previous.latest.event
        .eventType ===
        item.event.eventType &&
      previous.latest.event
        .actorUserId ===
        item.event.actorUserId &&
      Math.abs(
        previous.earliest.event
          .occurredAt.getTime() -
          item.event.occurredAt.getTime(),
      ) <=
        30 * 60 * 1000;

    if (canGroup && previous) {
      previous.count += 1;
      previous.earliest = item;
      continue;
    }

    groups.push({
      key,
      count: 1,
      latest: item,
      earliest: item,
    });
  }

  return groups;
}


/**
 * Load one activity event through the same tenant boundary as the feed.
 * Out-of-scope IDs are deliberately indistinguishable from nonexistent IDs.
 */
export async function getActivityEventDetail(
  context: RequestContext,
  eventIdInput: string,
) {
  const eventId = z.string().uuid().parse(eventIdInput);
  const [row] = await getDb()
    .select({
      event: activityEvents,
      actor: {
        id: users.id,
        displayName: users.displayName,
        email: users.email,
      },
    })
    .from(activityEvents)
    .leftJoin(users, eq(users.id, activityEvents.actorUserId))
    .where(eq(activityEvents.id, eventId))
    .limit(1);

  if (!row) {
    throw new ActivityServiceError("ACTIVITY_EVENT_NOT_FOUND");
  }

  if (isSuperAdmin(context)) {
    const selectedCollege = context.adminScope?.collegeId ?? null;
    const selectedOrganization = context.adminScope?.organizationId ?? null;
    if (
      (selectedCollege && row.event.collegeId !== selectedCollege) ||
      (!selectedCollege &&
        selectedOrganization &&
        row.event.organizationId !== selectedOrganization)
    ) {
      throw new ActivityServiceError("ACTIVITY_EVENT_NOT_FOUND");
    }
    requirePermission(context, "activity.read", {
      collegeId: row.event.collegeId,
      organizationId: row.event.organizationId,
    });
  } else if (hasActiveMembership(context)) {
    requirePermission(context, "activity.read", {
      collegeId: context.membership!.collegeId,
      organizationId: context.membership!.organizationId,
    });
    if (row.event.collegeId !== context.membership!.collegeId) {
      throw new ActivityServiceError("ACTIVITY_EVENT_NOT_FOUND");
    }
  } else {
    requirePermission(context, "activity.read");
  }

  return {
    event: {
      ...row.event,
      metadata: sanitizeActivityMetadata(row.event.metadata),
    },
    actor: row.actor?.id ? row.actor : null,
  };
}
