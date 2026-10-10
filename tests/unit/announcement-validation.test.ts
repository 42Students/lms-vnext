import { describe, expect, it } from "vitest";
import {
  announcementAdminListSchema,
  announcementCreateSchema,
  announcementUpdateSchema,
} from "@/modules/announcements/validation";

describe("W06 announcement validation", () => {
  it("accepts all legacy receiver types and strict schedule fields", () => {
    for (const receiverType of [
      "COLLEGE","PROGRAM","DEPARTMENT","LEARNER","FACULTY","CLASS",
    ]) {
      expect(announcementCreateSchema.safeParse({
        receiverType,
        receiverId: "20000000-0000-4000-8000-000000000001",
        title: " Notice ",
        message: " Message ",
        scheduledAt: "2026-10-10T10:00:00+05:30",
        expiresAt: "2026-10-11T10:00:00+05:30",
        isPinned: true,
      }).success).toBe(true);
    }
  });

  it("rejects impossible schedule order, HTML-sized abuse and spoofed fields", () => {
    expect(announcementCreateSchema.safeParse({
      receiverType: "COLLEGE",
      receiverId: "20000000-0000-4000-8000-000000000001",
      title: "x",
      message: "x",
      scheduledAt: "2026-10-11T10:00:00Z",
      expiresAt: "2026-10-10T10:00:00Z",
    }).success).toBe(false);
    expect(announcementCreateSchema.safeParse({
      receiverType: "COLLEGE",
      receiverId: "20000000-0000-4000-8000-000000000001",
      title: "x",
      message: "x".repeat(10001),
      senderUserId: "30000000-0000-4000-8000-000000000001",
    }).success).toBe(false);
  });

  it("requires receiver type and ID to retarget together", () => {
    expect(announcementUpdateSchema.safeParse({
      expectedVersion: 0,
      receiverType: "PROGRAM",
    }).success).toBe(false);
    expect(announcementUpdateSchema.safeParse({
      expectedVersion: 0,
      receiverType: "PROGRAM",
      receiverId: "20000000-0000-4000-8000-000000000001",
    }).success).toBe(true);
  });

  it("parses includeDeleted query strings without Boolean('false') bugs", () => {
    expect(announcementAdminListSchema.parse({ includeDeleted: "false" }).includeDeleted).toBe(false);
    expect(announcementAdminListSchema.parse({ includeDeleted: "true" }).includeDeleted).toBe(true);
  });
});
