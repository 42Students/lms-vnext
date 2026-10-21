import { z } from "zod";
import { parseNotificationCursor } from "@/modules/activity/notification-cursor";

const querySchema = z.object({
  view: z.enum(["all", "unread"]).optional(),
  beforeCreatedAt: z.string().optional(),
  beforeId: z.string().optional(),
}).strict();

/** Reject duplicate, malformed and unexpected query selectors instead of
 * silently widening the inbox to all messages. */
export function parseFacultyInboxQuery(raw: unknown) {
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return { view: "all" as const, cursor: null, invalid: true };
  }
  const cursor = parseNotificationCursor({
    beforeCreatedAt: parsed.data.beforeCreatedAt,
    beforeId: parsed.data.beforeId,
  });
  return {
    view: parsed.data.view ?? "all",
    cursor: cursor.cursor,
    invalid: cursor.invalid,
  };
}

export const facultyLegacyInboxTabs=["all","personal","college","department","faculty"] as const;
export type FacultyLegacyInboxTab=(typeof facultyLegacyInboxTabs)[number];
export function normalizeFacultyLegacyInboxTab(raw:unknown):{
 tab:FacultyLegacyInboxTab;needsCanonicalRedirect:boolean;
}{
 if(raw===undefined)return {tab:"all",needsCanonicalRedirect:false};
 if(typeof raw==="string"&&facultyLegacyInboxTabs.some(tab=>tab===raw))
  return {tab:raw as FacultyLegacyInboxTab,needsCanonicalRedirect:false};
 return {tab:"all",needsCanonicalRedirect:true};
}
