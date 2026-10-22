import { z } from "zod";
import { parseNotificationCursor } from "./notification-cursor";

export const mentorInboxQuerySchema = z.object({
  view: z.enum(["all", "unread"]).default("all"),
  beforeCreatedAt: z.string().max(64).optional(),
  beforeId: z.string().max(64).optional(),
}).strict();

export type MentorInboxQuery = z.infer<typeof mentorInboxQuerySchema>;

export function resolveMentorInboxQuery(rawQuery: unknown) {
  const query = mentorInboxQuerySchema.parse(rawQuery);
  const cursor = parseNotificationCursor({
    ...(query.beforeCreatedAt !== undefined ? { beforeCreatedAt: query.beforeCreatedAt } : {}),
    ...(query.beforeId !== undefined ? { beforeId: query.beforeId } : {}),
  });
  return { query, cursor };
}

export function mentorInboxPageHref(
  view: "all" | "unread",
  cursor?: { beforeCreatedAt: Date; beforeId: string },
) {
  const params = new URLSearchParams({ view });
  if (cursor) {
    params.set("beforeCreatedAt", cursor.beforeCreatedAt.toISOString());
    params.set("beforeId", cursor.beforeId);
  }
  return "/mentor/notifications?" + params.toString();
}
