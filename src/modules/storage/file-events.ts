import "server-only";

import { getDb } from "@/db/client";
import { storageFileEvents } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";

export type StorageEventSubject =
  | "ASSIGNMENT_SUBMISSION_FILE"
  | "PROJECT_RESOURCE_FILE"
  | "LESSON_VIDEO";

export type StorageEventType =
  | "UPLOAD_GRANTED"
  | "UPLOAD_COMPLETED"
  | "UPLOAD_FAILED"
  | "SCAN_ATTESTED"
  | "SCAN_REJECTED"
  | "DOWNLOAD_GRANTED"
  | "PLAYBACK_GRANTED"
  | "THUMBNAIL_GRANTED"
  | "THUMBNAIL_COMPLETED"
  | "SUBMITTED"
  | "UPDATED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "REPLACED"
  | "DELETED";

type Writer = Pick<ReturnType<typeof getDb>, "insert">;

const FORBIDDEN_DETAIL_KEY = /(url|token|secret|key|signature|authorization)/i;

/** Drops anything that could carry a URL, token or object key. */
export function safeEventDetail(detail: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(detail)) {
    if (FORBIDDEN_DETAIL_KEY.test(name)) continue;
    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value) || value.length > 200) continue;
      out[name] = value;
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[name] = value;
    }
  }
  return out;
}

/**
 * Appends an access/lifecycle event. Only identifiers and safe scalar facts
 * are stored; read URLs and upload tokens are never persisted.
 */
export async function recordStorageFileEvent(
  writer: Writer,
  context: RequestContext,
  input: {
    collegeId: string;
    subjectKind: StorageEventSubject;
    subjectId: string;
    eventType: StorageEventType;
    detail?: Record<string, unknown>;
  },
) {
  const membership =
    context.membership && context.membership.collegeId === input.collegeId
      ? context.membership.id
      : null;
  await writer.insert(storageFileEvents).values({
    collegeId: input.collegeId,
    subjectKind: input.subjectKind,
    subjectId: input.subjectId,
    eventType: input.eventType,
    actorUserId: context.user.id,
    actorMembershipId: membership,
    detail: safeEventDetail(input.detail ?? {}),
  });
}
