import {describe,it,expect} from "vitest";
import {tpoDriveTabs,tpoDriveMoreTabs} from "../../src/modules/placements/tpo-drive-tab-model";
describe("TPO drive detail navigation",()=>{
 it("links to real pipeline and candidate schedule pages",()=>{
  const tabs=tpoDriveTabs("job-id");
  expect(tabs.find(t=>t.label==="Applicants")?.href).toBe("/tpo/placements/jobs/job-id/applicants-pipeline");
  expect(tpoDriveMoreTabs("job-id").find(t=>t.label==="Candidate schedule")?.href).toBe("/tpo/placements/jobs/job-id/candidate-schedule");
 });
 it("keeps the drive overview and operational drive-day entry",()=>{
  const tabs=tpoDriveTabs("id");
  expect(tabs[0]?.href).toBe("/tpo/placements/jobs/id");
  expect(tabs.find(t=>t.label==="Drive day")?.href).toBe("/tpo/placements/jobs/id/drive-day");
 });
});
