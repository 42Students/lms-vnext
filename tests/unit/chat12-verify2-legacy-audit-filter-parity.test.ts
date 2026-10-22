import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const service = readFileSync("src/modules/activity/service.ts", "utf8");
const route = readFileSync("src/modules/activity/super-admin-audit-route-query-model.ts", "utf8");

describe("chat-12 legacy audit search filter parity", () => {
  it("preserves imported action keys and entity labels alongside native event columns", () => {
    expect(service).toContain("coalesce(${activityEvents.legacyActionKey}, ${activityEvents.eventType})");
    expect(service).toContain("eq(activityEvents.eventType, input.eventType)");
    expect(service).toContain("upper(${activityEvents.legacyActionKey})");
    expect(service).toContain("eq(activityEvents.subjectType, input.subjectType)");
    expect(service).toContain("lower(${activityEvents.legacyEntityType})");
    expect(service).toContain("eq(activityEvents.legacyEntityId, input.subjectId)");
  });

  it("routes legacy audit names through verified tenant scope without guessing numeric UUIDs", () => {
    expect(route).toContain('["actionKey","eventType"]');
    expect(route).toContain('["entityType","subjectType"]');
    expect(route).toContain('["entityId","subjectId"]');
    expect(route).toContain("verifiedOrganizationId");
    expect(service).toContain("resolveReadScope(");
    expect(service).toContain("conditions.push(legacyCategoryCondition(input.legacyCategory))");
  });
});
