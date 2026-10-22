import { describe, expect, it } from "vitest";
import { learnerApplicationWithdrawalSchema, learnerWithdrawalReasonSchema } from "@/modules/placements/learner-withdrawal-model";

describe("Learner application withdrawal validation", () => {
  const valid = { action: "WITHDRAW" as const, confirmed: true as const, reason: "Pursuing another opportunity" };
  it("requires explicit confirmation and validates any supplied reason", () => {
    expect(learnerApplicationWithdrawalSchema.parse(valid)).toEqual(valid);
    for (const data of [
      { ...valid, confirmed: false },
      { ...valid, action: "ACCEPT" },
      { ...valid, reason: "ab" },
      { ...valid, userId: "other-user" },
      { ...valid, membershipId: "other-membership" },
    ]) {
      expect(learnerApplicationWithdrawalSchema.safeParse(data).success).toBe(false);
    }
    expect(learnerApplicationWithdrawalSchema.parse({action:"WITHDRAW",confirmed:true}))
      .toEqual({action:"WITHDRAW",confirmed:true});
    expect(learnerApplicationWithdrawalSchema.parse({...valid,reason:"   "}))
      .toEqual({action:"WITHDRAW",confirmed:true});
  });

  it("trims reason length and rejects oversized text", () => {
    expect(learnerWithdrawalReasonSchema.parse("  Moving to another opportunity  "))
      .toBe("Moving to another opportunity");
    expect(learnerWithdrawalReasonSchema.parse("x".repeat(900))).toHaveLength(900);
    expect(learnerApplicationWithdrawalSchema.safeParse({
      ...valid, reason: "x".repeat(901),
    }).success).toBe(false);
  });
});
