import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {driveApplicationsQuerySchema} from "@/modules/placements/college-drive-applications-model";
import {tpoApplicantPipelineParams} from "@/modules/placements/tpo-applicant-pipeline-model";

describe("Legacy application ranking",()=>{
 it("defaults both college and TPO queues to descending screening score",()=>{
   expect(driveApplicationsQuerySchema.parse({}).sort).toBe("SCORE_DESC");
   expect(tpoApplicantPipelineParams.parse({jobId:"123e4567-e89b-42d3-a456-426614174000"}).sort).toBe("SCORE_DESC");
 });
 it("breaks score ties by submitted date DESC before stable application ID",()=>{
   const college=readFileSync("src/modules/placements/college-drive-applications-service.ts","utf8");
   const tpo=readFileSync("src/modules/placements/tpo-applicant-pipeline-service.ts","utf8");
   expect(college).toContain('desc nulls last`,desc(source.submittedAt),asc(source.id)');
   expect(tpo).toContain('input.sort==="SCORE_DESC"?sql`${screeningScore} desc nulls last`');
   expect(tpo).toContain('desc(placementApplications.submittedAt),placementApplications.id');
 });
});
