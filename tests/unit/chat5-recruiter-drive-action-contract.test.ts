import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");
const mapping=read("src/modules/placements/hr-round-editor-service.ts");

describe("G2-14-025-004 recruiter drive legacy action coverage",()=>{
 it("maps the old resume POST to a bounded, authorization-checked vNext GET",()=>{
  const route=read("src/app/api/placements/recruiter/jobs/[jobId]/applicants/resumes/export/route.ts");
  expect(mapping).toContain('vNext: "GET /api/placements/recruiter/jobs/{jobId}/applicants/resumes/export"');
  expect(mapping).toContain('state: "adapted-to-bounded-authorized-first-20"');
  expect(route).toContain("export async function GET(");
  expect(route).toContain("const MAX_FILES=20");
  expect(route).toContain("grantRecruiterSharedResume(");
 });
 it("maps staged results to the actual round endpoint without asserting instant release",()=>{
  const route=read("src/app/api/placements/rounds/[roundId]/results/route.ts");
  expect(mapping).toContain('vNext: "POST /api/placements/rounds/{roundId}/results"');
  expect(mapping).toContain('state: "adapted-to-staged-TPO-verification"');
  expect(route).toContain("export async function POST(");
  expect(route).toContain("stagePlacementRoundResult(");
  expect(route).toContain("isSameOriginRequest(request)");
 });
 it("maps recruiter selection proposals to their guarded and separate action",()=>{
  const route=read("src/app/api/placements/recruiter/drives/[jobId]/selections/route.ts");
  const service=read("src/modules/placements/recruiter-selection-list-write-service.ts");
  expect(mapping).toContain('vNext: "POST /api/placements/recruiter/drives/{jobId}/selections"');
  expect(route).toContain("export async function POST(");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(service).toContain("submitRecruiterSelectionList(");
  expect(service).toContain("getRecruiterPlacementWorkspace(");
  expect(service).toContain("grant");
  expect(mapping).toContain("proposals staged for TPO verification");
 });
});
