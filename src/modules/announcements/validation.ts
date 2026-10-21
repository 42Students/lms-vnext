import { z } from "zod";

export const ANNOUNCEMENT_SENDER_TYPES = [
  "SUPER_ADMIN","COLLEGE_ADMIN","FACULTY","LEARNER","TPO","SYSTEM",
] as const;

export const ANNOUNCEMENT_RECEIVER_TYPES = [
  "COLLEGE","PROGRAM","DEPARTMENT","LEARNER","FACULTY","CLASS",
] as const;

/**
 * Non-secret operational bounds shared by announcement
 * validation and the read-only platform inventory.
 */
export const ANNOUNCEMENT_LIMITS = {
  titleCharacters: 255,
  messageCharacters: 10000,
  // Legacy admin lists show 20 rows, recipient feeds 10, compact search 15.
  defaultPageSize: 20,
  recipientPageSize: 10,
  compactSearchPageSize: 15,
  maximumPageSize: 100,
} as const;

// The old API accepted Java LocalDateTime values in India wall-clock time.
// Never rely on the server's host timezone when resolving imported schedules.
const instant = z.union([
  z.iso.datetime({ offset: true }),
  z.iso.datetime({ local: true }),
]).transform((value) => new Date(
  /(?:Z|[+-]\\d{2}:\\d{2})$/i.test(value) ? value : value + "+05:30",
));

// Announcement text is persisted as plain text and rendered escaped, not as
// trusted HTML. The legacy Jsoup rich-message markup must be converted at the
// import boundary rather than injected into live notification HTML.
export function announcementDisplayTitle(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export const announcementCreateSchema = z.object({
  receiverType: z.enum(ANNOUNCEMENT_RECEIVER_TYPES,{error:"Receiver type is required"}),
  receiverId: z.string({error:"Receiver value is required"}).uuid({message:"Receiver value is required"}),
  title: z.string({error:"Title is required"}).trim().min(1,{message:"Title is required"}).max(ANNOUNCEMENT_LIMITS.titleCharacters,{message:"Title must not exceed 255 characters"}),
  message: z.string({error:"Message is required"}).trim().min(1,{message:"Message is required"}).max(ANNOUNCEMENT_LIMITS.messageCharacters,{message:"Message must not exceed 10000 characters"}),
  scheduledAt: instant.nullable().optional(),
  expiresAt: instant.nullable().optional(),
  isPinned: z.boolean().default(false),
  publishConsent: z.literal(true).optional(),
}).strict().superRefine((v, ctx) => {
  if (v.scheduledAt && v.expiresAt && v.expiresAt <= v.scheduledAt) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be after schedule" });
  }
});

export const announcementUpdateSchema = z.object({
  expectedVersion: z.number().int().min(0),
  receiverType: z.enum(ANNOUNCEMENT_RECEIVER_TYPES).optional(),
  receiverId: z.string().uuid().optional(),
  title: z.string({error:"Title is required"}).trim().min(1,{message:"Title is required"}).max(ANNOUNCEMENT_LIMITS.titleCharacters,{message:"Title must not exceed 255 characters"}).optional(),
  message: z.string({error:"Message is required"}).trim().min(1,{message:"Message is required"}).max(ANNOUNCEMENT_LIMITS.messageCharacters,{message:"Message must not exceed 10000 characters"}).optional(),
  scheduledAt: instant.nullable().optional(),
  expiresAt: instant.nullable().optional(),
  isPinned: z.boolean().optional(),
  publishConsent:z.literal(true).optional(),
}).strict().superRefine((v, ctx) => {
  if (Boolean(v.receiverType) !== Boolean(v.receiverId)) {
    ctx.addIssue({ code: "custom", path: ["receiverId"], message: "Receiver type and ID must change together" });
  }
  if (v.scheduledAt && v.expiresAt && v.expiresAt <= v.scheduledAt) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be after schedule" });
  }
});

export const announcementIdSchema = z.string().uuid();
export const announcementVersionSchema = z.object({
  expectedVersion: z.number().int().min(0),
}).strict();

const booleanQuery = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform((value) => value === "true"),
]);

export const announcementAdminListSchema = z.object({
  q: z.string().trim().max(120).transform(v=>v||undefined).optional(),
  receiverType: z.enum(ANNOUNCEMENT_RECEIVER_TYPES).optional(),
  visibility: z.enum(["LIVE","SCHEDULED","EXPIRED","DELETED"]).optional(),
  pinned: z.enum(["PINNED","UNPINNED"]).optional(),
  senderType: z.enum(ANNOUNCEMENT_SENDER_TYPES).optional(),
  includeDeleted: booleanQuery.default(false),
  limit: z.coerce.number().int().min(1).max(ANNOUNCEMENT_LIMITS.maximumPageSize).default(ANNOUNCEMENT_LIMITS.defaultPageSize),
  beforeCreatedAt: instant.optional(),
  beforeId: z.string().uuid().optional(),
}).strict().superRefine((v, ctx) => {
  if (Boolean(v.beforeCreatedAt) !== Boolean(v.beforeId)) {
    ctx.addIssue({ code: "custom", path: ["beforeId"], message: "Cursor requires timestamp and ID" });
  }
});

// Legacy autocomplete is a separate, compact search; do not use the admin
// list's cursor/page size for the global command-palette response.
export const announcementCompactSearchSchema = z.object({
  q: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(ANNOUNCEMENT_LIMITS.maximumPageSize)
    .default(ANNOUNCEMENT_LIMITS.compactSearchPageSize),
}).strict();

// Recipient feeds show ten rows per page, unlike the twenty-row admin table.
// Calling services retain their own authorization and college membership scope.
export const announcementRecipientFeedSchema = z.object({
  limit: z.coerce.number().int().min(1).max(ANNOUNCEMENT_LIMITS.maximumPageSize)
    .default(ANNOUNCEMENT_LIMITS.recipientPageSize),
  beforeCreatedAt: instant.optional(),
  beforeId: z.string().uuid().optional(),
}).strict().superRefine((value, context) => {
  if (Boolean(value.beforeCreatedAt) !== Boolean(value.beforeId)) {
    context.addIssue({ code: "custom", path: ["beforeId"], message: "Cursor requires timestamp and ID" });
  }
});
