import { z } from "zod";

export const ANNOUNCEMENT_RECEIVER_TYPES = [
  "COLLEGE","PROGRAM","DEPARTMENT","LEARNER","FACULTY","CLASS",
] as const;

const instant = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

export const announcementCreateSchema = z.object({
  receiverType: z.enum(ANNOUNCEMENT_RECEIVER_TYPES),
  receiverId: z.string().uuid(),
  title: z.string().trim().min(1).max(255),
  message: z.string().trim().min(1).max(10000),
  scheduledAt: instant.nullable().optional(),
  expiresAt: instant.nullable().optional(),
  isPinned: z.boolean().default(false),
}).strict().superRefine((v, ctx) => {
  if (v.scheduledAt && v.expiresAt && v.expiresAt <= v.scheduledAt) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be after schedule" });
  }
});

export const announcementUpdateSchema = z.object({
  expectedVersion: z.number().int().min(0),
  receiverType: z.enum(ANNOUNCEMENT_RECEIVER_TYPES).optional(),
  receiverId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(255).optional(),
  message: z.string().trim().min(1).max(10000).optional(),
  scheduledAt: instant.nullable().optional(),
  expiresAt: instant.nullable().optional(),
  isPinned: z.boolean().optional(),
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
  includeDeleted: booleanQuery.default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  beforeCreatedAt: instant.optional(),
  beforeId: z.string().uuid().optional(),
}).strict().superRefine((v, ctx) => {
  if (Boolean(v.beforeCreatedAt) !== Boolean(v.beforeId)) {
    ctx.addIssue({ code: "custom", path: ["beforeId"], message: "Cursor requires timestamp and ID" });
  }
});
