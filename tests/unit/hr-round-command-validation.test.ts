import {describe,it,expect} from "vitest";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
const id="0c626524-b36a-49d3-a59b-d4299428ae27";
describe("HR recruiter round command validation",()=>{
 it("rejects mixing a CREATE with existing round identity",()=>{
  expect(hrRoundFormSchema.safeParse({action:"CREATE",kind:"INTERVIEW",name:"Technical",roundId:id}).success).toBe(false);
 });
 it("rejects a REMOVE that silently mutates fields",()=>{
  expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:id,expectedUpdatedAt:"2026-10-15T09:00:00+05:30",name:"Other"}).success).toBe(false);
 });
 it("accepts a pure stale-token removal request",()=>{
  expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:id,expectedUpdatedAt:"2026-10-15T09:00:00+05:30"}).success).toBe(true);
 });
});
