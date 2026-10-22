import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("Learner withdrawal UX and backend write contracts", () => {
  it("requires explicit reason-bearing confirmation in the existing Applications drawer", () => {
    const ui = read("src/components/placements/learner-applications-browse.tsx");
    expect(ui).toContain('title={withdrawTarget?(withdrawMode==="REQUEST"?"Ask to withdraw from ":"Withdraw from ")');
    expect(ui).toContain("You leave this role for good. You cannot undo withdrawing this application.");
    expect(ui).toContain("Keep application");
    expect(ui).toContain("Withdraw application");
    expect(ui).toContain("learnerApplicationWithdrawalSchema.safeParse");
    expect(ui).toContain("confirmed: true");
    expect(ui).toContain("/api/placements/applications/");
    expect(ui).toContain("withdrawPending");
    expect(ui).toContain("sm:grid-cols-3");
    expect(ui).toContain('role="alert"');
    expect(ui).toContain("router.refresh()");
    expect(ui).not.toContain("window.confirm(");
    expect(ui).not.toContain("window.prompt(");
  });

  it("rechecks same origin, Zod and persisted active role/college within audited transaction", () => {
    const route = read("src/app/api/placements/applications/[applicationId]/actions/route.ts");
    const service = read("src/modules/placements/application-service.ts");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain("learnerApplicationWithdrawalSchema.parse");
    expect(route).toContain("input.reason");
    expect(service).toContain('can(context, "placements.read"');
    expect(service).toContain("learnerWithdrawalReasonSchema.max(");
    expect(service).toContain(").optional().parse(reasonInput)");
    expect(service).toContain("recordActivityEventInTransaction");
    expect(service).toContain("placementApplicationStatusHistory");
    expect(service).toContain("reasonProvided");
    expect(service).toContain("eq(placementApplications.membershipId, membership.id)");
    expect(read("src/app/(authenticated)/learn/my-placements/applications/loading.tsx")).toContain("Loading");
    expect(read("src/app/(authenticated)/learn/my-placements/applications/error.tsx")).toContain("Retry");
  });
});
