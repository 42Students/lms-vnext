import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

describe("authenticated learner legacy job search",()=>{
 it("uses the shared eight-field scoped search rather than title-only matching",()=>{
  const route=readFileSync("src/app/api/placements/jobs/route.ts","utf8");
  expect(route).toContain("const own=await listLearnerPlacementJobs(context)");
  expect(route).toContain("filterLearnerPlacementJobs(permitted");
  expect(route).toContain("responsibilities:item.job.legacyPostingDetails?.responsibilities??null");
  expect(route).toContain("...(parsed.data.jobType ? {jobType:parsed.data.jobType} : {})");
  expect(route).not.toContain("const match=parsed.data.q.toLocaleLowerCase");
 });
});
