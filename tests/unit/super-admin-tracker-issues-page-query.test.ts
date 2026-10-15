import {describe,it,expect} from "vitest";
import {parseTrackerIssuesPageParams as parse} from "@/modules/bug-tracker/issues-query-model";
const id="123e4567-e89b-42d3-a456-426614174000";
describe("tracker issues page filters",()=>{
 it("normalizes untouched empty form selectors",()=>{
  const parsed=parse({q:"",status:"",severity:"",environment:"",sort:"newest"});
  expect(parsed?.input.q).toBeUndefined();expect(parsed?.input.status).toBeUndefined();expect(parsed?.display.sort).toBe("newest");
 });
 it("preserves ISO string cursor when calling service again",()=>{
  const iso="2026-10-15T09:00:00Z";const parsed=parse({beforeCreatedAt:iso,beforeId:id});
  expect(parsed?.input.beforeCreatedAt).toBe(iso);
  expect(parsed?.display.beforeCreatedAt).toBeInstanceOf(Date);
 });
 it.each([{q:["one","two"]},{extra:"1"},{status:"BAD"},{beforeId:id},{beforeCreatedAt:"2026-10-15T09:00:00Z"},{q:"x".repeat(201)}])("fails closed on %#",raw=>{expect(parse(raw)).toBeNull();});
});
