import { describe, expect, it } from "vitest";
import { validateSuperAdminAuditRouteQuery } from "@/modules/activity/super-admin-audit-route-query-model";

describe("chat-12 verify2: scoped legacy Super Admin audit bookmarks", () => {
  it("gives a category precedence over legacy action/entity aliases, like searchByCategory", () => {
    const result = validateSuperAdminAuditRouteQuery({
      category: "important", actionKey: "PROJECT_DELETE",
      entityId: "old-123", entityType: "PROJECT_TASK",
    });
    expect(result).toMatchObject({ view: "important" });
    expect(result).not.toHaveProperty("eventType");
    expect(result).not.toHaveProperty("subjectId");
    expect(result).not.toHaveProperty("subjectType");
  });

  it("translates raw action/subject aliases when no category overrides them", () => {
    expect(validateSuperAdminAuditRouteQuery({
      actionKey: "PROJECT_DELETE", entityType: "PROJECT_TASK", entityId: "slug-3",
    })).toMatchObject({ eventType: "PROJECT_DELETE", subjectType: "PROJECT_TASK", subjectId: "slug-3" });
    expect(validateSuperAdminAuditRouteQuery({
      actionKey: "PROJECT_DELETE", eventType: "PROJECT_UPDATE",
    })).toBeNull();
  });

  it("interprets offset-free legacy date bookmarks in IST", () => {
    expect(validateSuperAdminAuditRouteQuery({
      since: "2026-10-22T09:30", until: "2026-10-22T10:30",
    })).toMatchObject({ from: "2026-10-22T09:30+05:30", to: "2026-10-22T10:30+05:30" });
  });

  it("does not accept unverified numeric IDs or arbitrary organization selectors", () => {
    const org = "4c499b6c-1417-4d98-a4bf-3c88a8e2e27e";
    const actor = "3e1ae940-8eab-4a7c-8ce1-496276e1b212";
    expect(validateSuperAdminAuditRouteQuery({ actorUserId: "51" })).toBeNull();
    expect(validateSuperAdminAuditRouteQuery({ organizationId: org })).toBeNull();
    expect(validateSuperAdminAuditRouteQuery({ organizationId: org }, org)).toEqual({});
    expect(validateSuperAdminAuditRouteQuery({ organizationId: org }, actor)).toBeNull();
    expect(validateSuperAdminAuditRouteQuery({ actorUserId: actor })).toMatchObject({ actorUserId: actor });
  });

  it("rejects unknown legacy categories rather than broadening the query", () => {
    expect(validateSuperAdminAuditRouteQuery({ category: "all" })).toBeNull();
    expect(validateSuperAdminAuditRouteQuery({ category: "secrets" })).toBeNull();
  });
});
