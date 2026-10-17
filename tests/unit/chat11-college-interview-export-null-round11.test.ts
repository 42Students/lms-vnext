import {describe,expect,it} from "vitest";
import {collegeInterviewCsv} from "@/modules/placements/college-directory-csv";
const base={
 id:"slot-1",job:"Backend Engineer",student:null,
 kind:"INTERVIEW",status:"SCHEDULED",
 start:new Date("2026-10-18T08:00:00.000Z"),
 venue:null,mode:"VIRTUAL",
};
describe("College Interview CSV null and malicious-name safety",()=>{
 it("COL-placements-19 exports unnamed candidates instead of an unsafe null or crashing",()=>{
  const csv=collegeInterviewCsv([base]);
  expect(csv).toContain('"Unnamed learner"');
  expect(csv).toContain('"Backend Engineer"');
  expect(csv).toContain('"VIRTUAL"');
  expect(csv).toContain("IST");
 });
 it("COL-placements-19 preserves spreadsheet safety for injected candidate labels",()=>{
  const csv=collegeInterviewCsv([{...base,student:"=HYPERLINK(1)"}]);
  expect(csv).toContain('"\'=HYPERLINK(1)"');
 });
 it("COL-placements-19 does not leak fabricated interviewer contact details",()=>{
  const csv=collegeInterviewCsv([base]);
  expect(csv).toContain('"scheduled date (IST)","interviewer","location","mode"');
  expect(csv).not.toContain("undefined");
 });
});
