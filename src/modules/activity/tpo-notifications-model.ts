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

export function tpoInboxEmptyNavigation(view:"all"|"unread",itemCount:number){
 if(itemCount!==0||view!=="unread")return null;
 return {label:"View all notifications",href:tpoInboxPageHref("all")};
}

/** TPO-inbox-team-67: 30-day attention window. Older history remains visible
 * in All, but cannot keep a new teammate's unread badge permanently elevated. */
export const TPO_UNREAD_WINDOW_DAYS=30;
export function tpoUnreadCutoff(now:Date){
 return new Date(now.getTime()-TPO_UNREAD_WINDOW_DAYS*86_400_000);
}
export function tpoEffectiveReadAt(readAt:Date|null,createdAt:Date,cutoff:Date):Date|null{
 return readAt??(createdAt.getTime()<cutoff.getTime()?createdAt:null);
}
