import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {knownErrorMutationSchema} from "@/modules/log-alerts/validation";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Known Errors create-and-link tracker workflow",()=>{
 it("SA-placements-projects-115 accepts only a bounded explicit linked tracker issue",()=>{
  expect(knownErrorMutationSchema.safeParse({action:"LINK_ISSUE",issuePublicId:"LMS-1234"}).success).toBe(true);
  expect(knownErrorMutationSchema.safeParse({action:"LINK_ISSUE",issuePublicId:"X".repeat(33)}).success).toBe(false);
  expect(knownErrorMutationSchema.safeParse({action:"LINK_ISSUE",issuePublicId:"LMS-1234",otherField:"sensitive"}).success).toBe(false);
  expect(read("src/components/tracker/known-errors-workspace.tsx")).toContain('&knownErrorId="+encodeURIComponent(item.id)');
 });
 it("SA-placements-projects-115 restricts linking to global Super Admin actors",()=>{
  const page=read("src/app/(authenticated)/tracker/page.tsx");
  expect(page).toContain('...(isSuperAdmin(context) && knownErrorId !== undefined ? {knownErrorId} : {})');
  expect(page).toContain('typeof raw.knownErrorId==="string"');
  const service=read("src/modules/log-alerts/admin-service.ts");
  expect(service).toContain("requireGlobalLogAdmin(context)");
  expect(service).toContain("knownErrorMutationSchema.parse(mutationRaw)");
  const route=read("src/app/api/tracker/logs/known-errors/[signatureId]/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
 });
 it("SA-placements-projects-115 creates once, then links in an independent recoverable operation",()=>{
  const form=read("src/components/tracker/tracker-report-form.tsx");
  expect(form).toContain('setCreated(payload.issue.publicId)');
  expect(form).toContain('await linkCreatedIssue(payload.issue.publicId)');
  expect(form).toContain('action:"LINK_ISSUE",issuePublicId:publicId');
  expect(form).toContain("Retry linking Known Error");
  expect(form).toContain("Issue created, but its Known Error link was not saved.");
  expect(form).toContain("onClick={()=>void linkCreatedIssue(created)}");
 });
});
