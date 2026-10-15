import {describe,it,expect} from "vitest";
import {learnerProjectActivityLastFetched} from "@/modules/projects/learner-project-activity-cursor-model";
describe("learner project history pagination cursor",()=>{
 it("advances past filtered-out trailing events, without showing them",()=>{
  const fetched=[{id:"match",cursorOccurredAt:"2026-10-15T10:00:00Z"},{id:"not-match",cursorOccurredAt:"2026-10-15T09:00:00Z"}];
  expect(learnerProjectActivityLastFetched(fetched)?.id).toBe("not-match");
 });
 it("does not invent a cursor for an empty page",()=>expect(learnerProjectActivityLastFetched([])).toBeUndefined());
});
