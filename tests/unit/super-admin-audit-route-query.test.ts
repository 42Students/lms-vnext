import { describe, expect, it } from "vitest";
import { validateSuperAdminAuditRouteQuery as parse } from "@/modules/activity/super-admin-audit-route-query-model";
describe("Super Admin audit URL filters", () => {
  it("normalizes blank controls but keeps strict typed fields", () => {
    expect(parse({ module: "", eventType: " events.created ", q: "" })).toMatchObject({eventType: "events.created"});
    expect(parse({ module: "NOT_A_MODULE" })).toBeNull();
    expect(parse({ actorUserId: "forged" })).toBeNull();
    expect(parse({ actorName: ["a", "b"] })).toBeNull();
    expect(parse({ unknown: "1" })).toBeNull();
  });
  it("enforces IST date boundaries and both cursor fields", () => {
    expect(parse({from:"2026-10-15",to:"2026-10-14"})).toBeNull();
    expect(parse({from:"2026-10-15",to:"2026-10-15"})).not.toBeNull();
    expect(parse({from:"2026-10-15T00:00:00"})).toMatchObject({
      from:"2026-10-15T00:00:00+05:30",
    });
    expect(parse({from:"2026-10-15T00:00:00.123"})).toMatchObject({
      from:"2026-10-15T00:00:00.123+05:30",
    });
    const organizationId="11111111-1111-4111-8111-111111111111";
    expect(parse({organizationId},organizationId)).toMatchObject({});
    expect(parse({organizationId},null)).toBeNull();
    expect(parse({organizationId},"22222222-2222-4222-8222-222222222222")).toBeNull();
    expect(parse({beforeId:"00000000-0000-4000-8000-000000000001"})).toBeNull();
  });
});
