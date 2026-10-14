import {describe,it,expect} from "vitest";
import {tpoFollowupQueueQuerySchema} from "@/modules/placements/tpo-followup-queue-model";
describe("TPO follow-up ownership query",()=>{
 it("defaults to team and strictly validates the view",()=>{
  expect(tpoFollowupQueueQuerySchema.parse({})).toEqual({scope:"TEAM",window:"DUE"});
  expect(tpoFollowupQueueQuerySchema.parse({scope:"MINE"}).scope).toBe("MINE");
  expect(tpoFollowupQueueQuerySchema.safeParse({scope:"OTHER"}).success).toBe(false);
  expect(tpoFollowupQueueQuerySchema.parse({window:"NEXT_7_DAYS"}).window).toBe("NEXT_7_DAYS");
  expect(tpoFollowupQueueQuerySchema.safeParse({window:"NEXT_YEAR"}).success).toBe(false);
  expect(tpoFollowupQueueQuerySchema.safeParse({scope:"MINE",collegeId:"override"}).success).toBe(false);
 });
});
