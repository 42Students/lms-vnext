import { z } from "zod";
import { parseNotificationCursor } from "./notification-cursor";

export const TPO_NOTIFICATIONS_PATH = "/tpo/notifications";

export const tpoInboxQuerySchema = z
  .object({
    view: z.enum(["all", "unread"]).default("all"),
    beforeCreatedAt: z.string().max(64).optional(),
    beforeId: z.string().max(64).optional(),
  })
  .strict();

export type TpoInboxQuery = z.infer<typeof tpoInboxQuerySchema>;

export function resolveTpoInboxQuery(rawQuery: unknown) {
  const query = tpoInboxQuerySchema.parse(rawQuery);
  const cursor = parseNotificationCursor({
    beforeCreatedAt: query.beforeCreatedAt,
    beforeId: query.beforeId,
  });
  return { query, cursor };
}

export function tpoInboxPageHref(
  view: "all" | "unread",
  cursor?: { beforeCreatedAt: Date; beforeId: string },
) {
  const params = new URLSearchParams({ view });
  if (cursor) {
    params.set("beforeCreatedAt", cursor.beforeCreatedAt.toISOString());
    params.set("beforeId", cursor.beforeId);
  }
  return TPO_NOTIFICATIONS_PATH + "?" + params.toString();
}

/** Acknowledgement routes accept route identity only, never a JSON scope. */
export const tpoNotificationReadBodySchema = z.object({}).strict();

export function parseTpoNotificationReadBody(body: string) {
  let value: unknown = {};
  if (body.trim()) {
    try {
      value = JSON.parse(body);
    } catch {
      value = body;
    }
  }
  return tpoNotificationReadBodySchema.parse(value);
}
