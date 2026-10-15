import {describe,it,expect} from "vitest";
import {tpoStudentJourneyLinks} from "../../src/modules/placements/tpo-student-journey-links-model";
describe("TPO student decision and history navigation",()=>{
 it("preserves the same membership across decision and journey screens",()=>{
  const links=tpoStudentJourneyLinks("member");
  expect(links.history).toBe("/tpo/students/member/history");
  expect(links.participation).toBe("/tpo/students/member/participation");
 });
 it("URL-encodes a membership fragment",()=>{
  expect(tpoStudentJourneyLinks("unexpected/id").history).toContain("unexpected%2Fid/history");
 });
});
