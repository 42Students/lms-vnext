import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const root="src/app/api/placements/recruiter/";
const get=(path:string)=>readFileSync(join(process.cwd(),root,path),"utf8");

describe("HR recruiter route security chat-15",()=>{
 const guarded=[
  "drives/requests/route.ts",
  "drives/proposal/route.ts",
  "drives/[jobId]/interview-slots/route.ts",
  "drives/[jobId]/rounds/route.ts",
  "conversations/[threadId]/reply/route.ts",
  "conversations/open/route.ts",
  "conversations/acknowledge/route.ts",
  "notifications/[notificationId]/read/route.ts",
  "profile/details/route.ts",
  "profile/route.ts",
 ];
 it.each(guarded)("HR-origin-permission %s checks same-origin before any recruiter mutation",file=>{
  const code=get(file);
  expect(code).toMatch(/export async function (POST|PATCH)\(/);
  const origin=code.indexOf("isSameOriginRequest(request)");
  const firstWrite=code.search(/await (?:createOwn|updateOwn|writeHr|editHr|sendRecruiter|openRecruiter|acknowledgeRecruiter|markHr)/);
  expect(origin).toBeGreaterThanOrEqual(0);
  expect(firstWrite).toBeGreaterThan(origin);
  expect(code).toContain("getCurrentRequestContext");
  expect(code).toMatch(/return NextResponse\.json\(\{error:"INVALID_ORIGIN"\}/);
 });
 it("HR-request-body parses streamed JSON bounded at 128 KiB, before passing to schema/service",()=>{
  const helper=readFileSync(join(process.cwd(),"src/modules/placements/recruiter-json-request.ts"),"utf8");
  expect(helper).toContain("128 * 1024");
  expect(helper).toContain("reader.read()");
  expect(helper).toContain("size > maxBytes");
  expect(helper).toContain("TextDecoder");
  const bounded=[
   "drives/requests/route.ts","drives/proposal/route.ts",
   "notifications/[notificationId]/read/route.ts",
   "profile/details/route.ts","profile/route.ts",
  ];
  for(const file of bounded){
   const code=get(file);
   expect(code).toContain("readRecruiterJsonBody(request)");
   expect(code).toContain("413");
   expect(code).toContain("400");
  }
 });
 it("HR-proposal uses strict validated schema and distinguishes idempotent replay from new 201",()=>{
  const s=get("drives/proposal/route.ts");
  expect(s).toContain("hrDriveProposalSchema.safeParse(body)");
  expect(s).toContain("hasActiveRecruiter(context)");
  expect(s).toContain("sendRecruiterDriveProposal(context,parsed.data)");
  expect(s).toContain("receipt.replayed?200:201");
  expect(s).toContain('status:409');
 });
 it("HR-requests do not mutate data on GET; POST replay and PATCH are guarded",()=>{
  const s=get("drives/requests/route.ts");
  const getSection=s.slice(s.indexOf("export async function GET"),s.indexOf("export async function POST"));
  expect(getSection).toContain("listOwnRecruiterDriveRequests");
  expect(getSection).not.toContain("updateOwnRecruiterDriveRequest(");
  expect(getSection).not.toContain("createOwnRecruiterDriveRequest(");
  expect(s).toContain("result.replayed?200:201");
  expect(s).toContain("updateOwnRecruiterDriveRequest");
 });
});
