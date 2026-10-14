import { z } from "zod";

export const tpoOwnNotificationQuerySchema = z.object({
  status: z.enum(["ALL", "UNREAD", "READ"]).default("ALL"),
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export const tpoMarkOwnNotificationSchema = z.object({
  confirmed: z.literal(true),
  notificationId: z.string().uuid(),
  expectedUnread: z.literal(true),
}).strict();

export function filterTpoOwnNotificationStatus(
  status: "ALL" | "UNREAD" | "READ",
  readAt: Date | null,
): boolean {
  return status === "ALL" || (status === "READ" ? readAt !== null : readAt === null);
}
