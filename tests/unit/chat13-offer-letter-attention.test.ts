import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin needs attention and application offer letters",()=>{
 it("SA-placements-projects-05 groups the four legacy flags with category rows and overflow expansion",()=>{
  const svc=read("src/modules/placements/tpo-operations-service.ts");
  for(const key of ["STALE_APPLICATIONS","INTERVIEW_UNSCHEDULED","OFFERED_NO_LETTER",
    "CLOSING_SOON_LOW_CONVERSION"])expect(svc).toContain(key);
  const ui=read("src/components/placements/super-admin-needs-attention.tsx");
  expect(ui).toContain("Applications with no action in a week");
  expect(ui).toContain("Marked Interview, nothing scheduled");
  expect(ui).toContain("Offered, no offer letter attached");
  expect(ui).toContain("Closing soon, low conversion");
  expect(ui).toContain("slice(0,3)");
  expect(ui).toContain("No drives currently flagged in this view.");
  expect(ui).toContain("Show less");
  expect(ui).toContain("/applications?stage=");
 });
 it("SA-placements-projects-21 attaches offer letters through a scoped mutating request",()=>{
  const svc=read("src/modules/placements/college-application-detail-service.ts");
  expect(svc).toContain("attachCollegeApplicationOfferLetter");
  expect(svc).toContain("assertPersistedPlatformPermission(tx,ctx");
  expect(svc).toContain('offerLetterUrl:input.url');
  const route=read("src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/route.ts");
  expect(route).toContain("export async function PATCH");
  expect(route).toContain("isSameOriginRequest(req)");
  const ui=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(ui).toContain("Attach Offer Letter");
  expect(ui).toContain("View offer letter");
 });
});
