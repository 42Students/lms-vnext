import { z } from "zod";
import { parseNotificationCursor } from "@/modules/activity/notification-cursor";

const querySchema = z.object({
  view: z.enum(["all", "unread"]).optional(),
  beforeCreatedAt: z.string().optional(),
  beforeId: z.string().optional(),
  beforeNoticeCreatedAt: z.string().optional(),
  beforeNoticeId: z.string().optional(),
  beforeNoticePinned: z.enum(["0","1"]).optional(),
}).strict();

/** Reject duplicate, malformed and unexpected query selectors instead of
 * silently widening the inbox to all messages. */
export function parseFacultyInboxQuery(raw: unknown) {
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return { view: "all" as const, cursor: null, noticeCursor: null, invalid: true };
  }
  const cursor = parseNotificationCursor({
    ...(parsed.data.beforeCreatedAt !== undefined ? { beforeCreatedAt: parsed.data.beforeCreatedAt } : {}),
    ...(parsed.data.beforeId !== undefined ? { beforeId: parsed.data.beforeId } : {}),
  });
  const noticeValues = [
    parsed.data.beforeNoticeCreatedAt, parsed.data.beforeNoticeId,
    parsed.data.beforeNoticePinned,
  ];
  const hasNoticeCursor = noticeValues.some(value => value !== undefined);
  const completeNoticeCursor = noticeValues.every(value => value !== undefined);
  const noticeTimestamp = completeNoticeCursor
    ? z.iso.datetime({ offset: true }).safeParse(parsed.data.beforeNoticeCreatedAt)
    : null;
  const noticeId = completeNoticeCursor
    ? z.string().uuid().safeParse(parsed.data.beforeNoticeId) : null;
  const noticeDate = noticeTimestamp?.success
    ? new Date(noticeTimestamp.data) : null;
  const noticeInvalid = hasNoticeCursor && (
    !completeNoticeCursor || !noticeTimestamp?.success ||
    !noticeId?.success || !noticeDate ||
    !Number.isFinite(noticeDate.getTime())
  );
  const noticeCursor = hasNoticeCursor && !noticeInvalid && noticeDate && noticeId?.success
    ? { createdAt: noticeDate, id: noticeId.data,
        isPinned: parsed.data.beforeNoticePinned === "1" }
    : null;
  return {
    view: parsed.data.view ?? "all",
    cursor: cursor.cursor,
    noticeCursor,
    invalid: cursor.invalid || Boolean(noticeInvalid),
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
