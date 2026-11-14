import { activityEvents } from "@/db/schema";
import { sanitizeActivityMetadata } from "@/modules/activity/metadata-sanitizer";

/**
 * The one way to write an audit/activity event. Producers say WHAT happened and WHO did it; this function owns the row shape:
 * metadata is stripped of credential-like keys before it is stored, a repeated `dedupeKey` records once (a retry or a double
 * submit adds nothing), and every event carries the same required fields. Pass the transaction the change itself runs in so
 * the event commits or rolls back with it.
 */
/** The modules the database accepts (check constraint activity_events_module_ck). */
export const ACTIVITY_MODULES = ["PLATFORM", "IDENTITY", "ACADEMICS", "COURSES", "PROJECTS", "PLACEMENTS"] as const;
export type ActivityModule = (typeof ACTIVITY_MODULES)[number];

export type ActivityInput = {
  module: ActivityModule;
  eventType: string;
  subjectType: string;
  subjectId: string;
  summary: string;
  organizationId?: string | null;
  collegeId?: string | null;
  actorUserId?: string | null;
  actorMembershipId?: string | null;
  importance?: "LOW" | "NORMAL" | "HIGH";
  subjectLabel?: string | null;
  metadata?: Record<string, unknown>;
  /** A second event with the same key is ignored. */
  dedupeKey?: string;
  groupKey?: string;
  occurredAt?: Date;
};

/** The slice of a Drizzle database/transaction this function needs, so tests can pass a fake. */
export type ActivityWriter = {
  insert: (table: typeof activityEvents) => {
    values: (row: Record<string, unknown>) => {
      onConflictDoNothing: () => { returning: (shape: Record<string, unknown>) => PromiseLike<unknown[]> };
    };
  };
};

export function buildActivityRow(input: ActivityInput): Record<string, unknown> {
  if (!(ACTIVITY_MODULES as readonly string[]).includes(input.module) || !input.eventType.trim() || !input.subjectType.trim() || !input.subjectId.trim() || !input.summary.trim()) {
    throw new Error("ACTIVITY_EVENT_INCOMPLETE");
  }
  return {
    module: input.module,
    eventType: input.eventType,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    summary: input.summary,
    importance: input.importance ?? "NORMAL",
    subjectLabel: input.subjectLabel ?? null,
    metadata: sanitizeActivityMetadata(input.metadata),
    organizationId: input.organizationId ?? null,
    collegeId: input.collegeId ?? null,
    actorUserId: input.actorUserId ?? null,
    actorMembershipId: input.actorMembershipId ?? null,
    dedupeKey: input.dedupeKey ?? null,
    groupKey: input.groupKey ?? null,
    ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
  };
}

/** Writes one event. Resolves `{ recorded: false }` when the dedupe key was already used. */
export async function recordActivity(writer: ActivityWriter, input: ActivityInput): Promise<{ recorded: boolean }> {
  const inserted = await writer
    .insert(activityEvents)
    .values(buildActivityRow(input))
    .onConflictDoNothing()
    .returning({ id: activityEvents.id });
  return { recorded: inserted.length > 0 };
}
