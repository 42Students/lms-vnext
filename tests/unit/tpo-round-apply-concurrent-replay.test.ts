import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {isVersionedRoundResultReplay,roundApplyFailureReason} from "@/modules/placements/tpo-round-apply-model";
import {PlacementsServiceError} from "@/modules/placements/errors";

describe("whole-round apply concurrency and revision replay",()=>{
 it("does not count an already applied result as a second successful versioned write",()=>{
  expect(isVersionedRoundResultReplay("STAGED",4)).toBe(false);
  expect(isVersionedRoundResultReplay("APPLIED",4)).toBe(true);
  expect(isVersionedRoundResultReplay("APPLIED",undefined)).toBe(false);
  expect(isVersionedRoundResultReplay("SUPERSEDED",4)).toBe(false);
  expect(roundApplyFailureReason(new PlacementsServiceError("PLACEMENT_RESULT_ALREADY_APPLIED")))
   .toContain("already applied");
 });
 it("checks replay both before and after the database row lock",()=>{
  const source=readFileSync("src/modules/placements/result-service.ts","utf8");
  expect(source.match(/isVersionedRoundResultReplay\(/g)).toHaveLength(2);
  expect(source).toContain("isVersionedRoundResultReplay(lockedResult.status,expectedVersion)");
  expect(source).toContain("throw new PlacementsServiceError(\"PLACEMENT_RESULT_ALREADY_APPLIED\")");
  expect(source).toContain('.for("update")');
 });
});
