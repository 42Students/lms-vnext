import { describe, expect, it } from "vitest";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { parseProjectAdminAuditQuery } from "@/modules/projects/admin-audit-query-model";

const cursorId = "11111111-1111-4111-8111-111111111111";
const eventType = ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_CREATED;

describe("IIT Dharwad Projects: Super Admin audit URL resilience", () => {
  it("PROJ-BREAK-ux-22 accepts exact action, calendar window and cursor without altering scoped filters", () => {
    expect(parseProjectAdminAuditQuery({
      action: eventType,
      importance: "HIGH",
      subjectType: "project_instance",
      subjectId: cursorId,
      from: "2026-10-01",
      to: "2026-10-18",
      beforeOccurredAt: "2026-10-18T10:10:10.000Z",
      beforeId: cursorId,
    })).toEqual({
      eventType,
      importance: "HIGH",
      subjectType: "project_instance",
      subjectId: cursorId,
      from: "2026-10-01",
      to: "2026-10-18",
      beforeOccurredAt: "2026-10-18T10:10:10.000Z",
      beforeId: cursorId,
      ignoredInvalidFilters: false,
    });
  });

  it("PROJ-BREAK-ux-23 malformed actions, importance, ranges or huge IDs cannot trigger an activity validator crash", () => {
    const parsed = parseProjectAdminAuditQuery({
      action: "project.unknown",
      importance: ["CRITICAL_BUT_FAKE", "HIGH"],
      subjectType: "x".repeat(81),
      subjectId: "i".repeat(501),
      from: "2026-02-30",
      to: "2026-10-18",
    });
    expect(parsed).toMatchObject({
      eventType: undefined,
      importance: undefined,
      subjectType: undefined,
      subjectId: undefined,
      from: undefined,
      to: "2026-10-18",
      ignoredInvalidFilters: true,
    });
    const reverse = parseProjectAdminAuditQuery({
      from: "2026-10-18", to: "2026-10-17",
    });
    expect(reverse).toMatchObject({
      from: "2026-10-18",
      to: undefined,
      ignoredInvalidFilters: true,
    });
  });

  it("PROJ-BREAK-ux-24 half-supplied, non-UUID or impossible page cursors never reach the DB", () => {
    for (const input of [
      { beforeOccurredAt: "2026-10-18T10:10:10.000Z" },
      { beforeId: cursorId },
      { beforeId: "not-a-uuid", beforeOccurredAt: "2026-10-18T10:10:10.000Z" },
      { beforeId: cursorId, beforeOccurredAt: "2026-02-30T10:10:10.000Z" },
      { beforeId: cursorId, beforeOccurredAt: "2026-10-18T10:10:10+05:30" },
      { beforeId: cursorId, beforeOccurredAt: "yesterday" },
    ]) {
      const parsed = parseProjectAdminAuditQuery(input);
      expect(parsed.beforeId).toBeUndefined();
      expect(parsed.beforeOccurredAt).toBeUndefined();
      expect(parsed.ignoredInvalidFilters).toBe(true);
    }
    expect(parseProjectAdminAuditQuery({}).ignoredInvalidFilters).toBe(false);
    expect(parseProjectAdminAuditQuery({ status: eventType }).eventType).toBe(eventType);
  });
});
