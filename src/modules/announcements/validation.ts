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
  defaultPageSize: 50,
  maximumPageSize: 100,
} as const;

const instant = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

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
  title: z.string().trim().min(1).max(ANNOUNCEMENT_LIMITS.titleCharacters).optional(),
  message: z.string().trim().min(1).max(ANNOUNCEMENT_LIMITS.messageCharacters).optional(),
  scheduledAt: instant.nullable().optional(),
  expiresAt: instant.nullable().optional(),
  isPinned: z.boolean().optional(),
  publishConsent:z.literal(true).optional(),
}).strict().superRefine((v, ctx) => {
  if (Boolean(v.receiverType) !== Boolean(v.receiverId)) {
    ctx.addIssue({ code: "custom", path: ["receiverId"], message: "Receiver type and ID must change together" });
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
