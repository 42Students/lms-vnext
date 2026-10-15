import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("staged interview-slot foreign keys",()=>{
 it("requires same job, college and round for each slot",()=>{
  const ddl=readFileSync("docs/proposed-migrations/hr-interview-slots.sql","utf8");
  expect(ddl).toContain("foreign key (job_id,college_id)");
  expect(ddl).toContain("references placement_jobs(id,college_id)");
  expect(ddl).toContain("foreign key (round_id,job_id)");
  expect(ddl).toContain("references placement_job_rounds(id,job_id)");
 });
});
