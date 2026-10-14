import {describe,it,expect} from "vitest";
import {tpoFollowupQueueQuerySchema,tpoFollowupQueueHref} from "@/modules/placements/tpo-followup-queue-model";
describe("TPO follow-up ownership query",()=>{
 it("defaults to team and strictly validates the view",()=>{
  expect(tpoFollowupQueueQuerySchema.parse({})).toEqual({scope:"TEAM",window:"DUE",q:"",page:1});
  expect(tpoFollowupQueueQuerySchema.parse({scope:"MINE"}).scope).toBe("MINE");
  expect(tpoFollowupQueueQuerySchema.safeParse({scope:"OTHER"}).success).toBe(false);
  expect(tpoFollowupQueueQuerySchema.parse({window:"NEXT_7_DAYS"}).window).toBe("NEXT_7_DAYS");
  expect(tpoFollowupQueueQuerySchema.safeParse({window:"NEXT_YEAR"}).success).toBe(false);
  expect(tpoFollowupQueueQuerySchema.parse({q:"  Infosys  "}).q).toBe("Infosys");
  expect(tpoFollowupQueueQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
  expect(tpoFollowupQueueQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(tpoFollowupQueueQuerySchema.safeParse({page:10001}).success).toBe(false);
  expect(tpoFollowupQueueHref({scope:"TEAM",window:"NEXT_7_DAYS",page:3})).toBe("/tpo/follow-ups?scope=TEAM&window=NEXT_7_DAYS&page=3");
  expect(tpoFollowupQueueHref({scope:"MINE",window:"DUE",q:"A & B"})).toBe("/tpo/follow-ups?scope=MINE&window=DUE&q=A+%26+B");
  expect(tpoFollowupQueueQuerySchema.safeParse({scope:"MINE",collegeId:"override"}).success).toBe(false);
 });
});
