import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("registered interview-slot foreign keys",()=>{
 it("requires same job, college and round for each slot",()=>{
  const ddl=readFileSync("drizzle/0078_placement_hr_interview_slots.sql","utf8");
  expect(ddl).toContain('FOREIGN KEY ("job_id","college_id")');
  expect(ddl).toContain('REFERENCES "public"."placement_jobs"("id","college_id")');
  expect(ddl).toContain('FOREIGN KEY ("round_id","job_id")');
  expect(ddl).toContain('REFERENCES "public"."placement_job_rounds"("id","job_id")');
  expect(ddl.indexOf("hr_interview_round_job_parent_uq")).toBeLessThan(ddl.indexOf("hr_slot_round_job_fk"));
 });
});
