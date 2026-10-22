import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { roundApplyInputSchema } from "@/modules/placements/tpo-round-apply-model";

const code = (path: string) => readFileSync(path, "utf8");
const token = "a".repeat(64);

describe("round result apply notification compatibility", () => {
  it("requires a confirmed preview before any apply, regardless of notification preference", () => {
    expect(roundApplyInputSchema.safeParse({
      confirmed: true, expectedPreviewToken: token,
    }).success).toBe(true);
    expect(roundApplyInputSchema.safeParse({
      confirmed: false, expectedPreviewToken: token,
    }).success).toBe(false);
    expect(roundApplyInputSchema.safeParse({
      confirmed: true, expectedPreviewToken: "stale",
    }).success).toBe(false);
  });

  it("rejects invalid notify flags while supporting explicit suppression", () => {
    const route = code("src/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/apply-all/route.ts");
    expect(route).toContain('notify!=="true"&&notify!=="false"');
    expect(route).toContain('notify!=="false"');
    expect(route).not.toContain("NOTIFICATION_SUPPRESSION_UNAVAILABLE");
    expect(route).toContain('notificationChannel:notify==="false"?"SUPPRESSED":"IN_APP"');
  });

  it("propagates the choice through the application transaction, without suppressing stage or audit writes", () => {
    const wholeRound = code("src/modules/placements/tpo-round-apply-service.ts");
    const resultService = code("src/modules/placements/result-service.ts");
    expect(wholeRound).toContain("notifyLearners=true");
    expect(wholeRound).toContain("applyPlacementRoundResult(context,row.resultId,row.version,notifyLearners)");
    expect(wholeRound).toContain("notifyLearners},");
    expect(resultService).toContain("notifyLearner = true,");
    expect(resultService).toContain("learnerNoticeSuppressed:!notifyLearner,");
    expect(resultService).toContain("if(notifyLearner && beforeStage?.stage!==nextLearnerStage)");
    expect(resultService).toContain("await deliverRecordedLearnerPlacementEvent(tx,{");
    expect(resultService).toContain("await tx.insert(placementCollegeApplicationStageHistory)");
  });

  it("makes the default-on notification decision visible before confirmation", () => {
    const ui = code("src/components/placements/tpo-round-apply-control.tsx");
    expect(ui).toContain("useState(true)");
    expect(ui).toContain("Notify students when results are applied");
    expect(ui).toContain("Their application stages will still change.");
    expect(ui).toContain('url+"?notify="+String(notifyLearners)');
  });
});
