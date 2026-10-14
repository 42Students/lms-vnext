import {describe,expect,it} from "vitest";
import {learnerProjectActivityCsv} from "@/modules/projects/learner-project-activity-csv-model";
describe("learner project activity page export",()=>{
 it("neutralizes formulas, quotes text and excludes contact columns",()=>{
  const csv=learnerProjectActivityCsv([{occurredAt:new Date("2026-10-15T00:00:00Z"),
   actorDisplayName:"=HYPERLINK(1)",subjectLabel:'A "quoted" task',summary:"\t+SUM(1,2)"}]);
  expect(csv.content).toContain('"'+"'"+'=HYPERLINK(1)"');
  expect(csv.content).toContain('A ""quoted"" task');
  expect(csv.content).toContain("'\t+SUM");
  expect(csv.content.split("\r\n").length).toBe(3);
  expect(csv.content).not.toContain("Email,");
 });
 it("caps rows and discloses truncation",()=>{
  const row={occurredAt:new Date("2026-10-15T00:00:00Z"),actorDisplayName:null,subjectLabel:null,summary:"ok"};
  const csv=learnerProjectActivityCsv(Array.from({length:102},()=>row));
  expect(csv.truncated).toBe(true);
  expect(csv.content.split("\r\n").filter(Boolean)).toHaveLength(101);
 });
});
