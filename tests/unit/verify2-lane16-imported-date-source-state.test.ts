import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {importedImportantDateSourceState} from "@/modules/placements/job-important-date-adapter";

describe("G2-18-021-017 unsupported vs empty legacy job event feeds",()=>{
 it("distinguishes absent DTO field, verified empty list, usable data and corrupt payload",()=>{
  expect(importedImportantDateSourceState(null)).toBe("UNSUPPORTED");
  expect(importedImportantDateSourceState({title:"Drive"})).toBe("UNSUPPORTED");
  expect(importedImportantDateSourceState({importantDates:[]})).toBe("EMPTY");
  expect(importedImportantDateSourceState({importantDates:null})).toBe("INVALID");
  expect(importedImportantDateSourceState({importantDates:[{label:"Deadline",at:"2026-11-01T08:00:00Z"}]})).toBe("AVAILABLE");
  expect(importedImportantDateSourceState({importantDates:[{label:"Deadline",at:"not a date"}]})).toBe("INVALID");
 });
 it("projects source coverage from authorized jobs and owned history without fabricating empty success",()=>{
  const service=readFileSync("src/modules/placements/learner-career-calendar-feed-service.ts","utf8");
  expect(service).toContain("observeSource(job.id,job.legacyPostingDetails)");
  expect(service).toContain("observeSource(row.jobId,row.posting)");
  expect(service).toContain("if(observedDateJobs.has(jobId))return");
  expect(service).toContain("return { supplements:merged, warnings, dateSourceSummary };");
 });
});
