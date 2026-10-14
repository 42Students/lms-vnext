import {describe,it,expect} from "vitest";
import {tpoFollowupQueueQuerySchema,tpoFollowupQueueHref,tpoFollowupContactLinks,projectTpoFollowupQueue} from "@/modules/placements/tpo-followup-queue-model";
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

describe("safe TPO follow-up contact preflight",()=>{
 it("prepares explicit contact links only for eligible normalized numbers",()=>{
  expect(tpoFollowupContactLinks("+919876543210",true)).toEqual({call:"tel:+919876543210",whatsapp:"https://wa.me/919876543210"});
  expect(tpoFollowupContactLinks("+919876543210",false).whatsapp).toBeNull();
  expect(tpoFollowupContactLinks("javascript:alert(1)",true).call).toBeNull();
  expect(tpoFollowupContactLinks(null,true).call).toBeNull();
  const result=projectTpoFollowupQueue([{id:"x",leadId:"a",leadName:"A",companyName:null,dueAt:new Date("2026-10-01T00:00:00Z"),note:null,
    phoneNorm:"+919876543210",unsubscribedAt:new Date(),recruiterUserId:null}],new Date("2026-10-02T00:00:00Z"));
  expect(result.rows[0]?.canContact).toBe(false);
 });
});
