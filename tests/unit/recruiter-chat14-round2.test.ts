import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft,hrDriveDraftSchema} from "@/modules/placements/hr-drive-draft-model";
import {hrApplicantFilterSchema,HR_OFFER_PAGE_SIZE,hrOfferPageBounds,HR_OFFER_STATES}
 from "@/modules/placements/hr-job-applicants-model";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-14 recruiter reassignment batch 2",()=>{
 it("REC-home-drives-16 sorts placement-cell unanswered requests before recent or deadline rows",()=>{
  const code=read("src/components/placements/recruiter-placement-portfolio.tsx");
  expect(code).toContain("unansweredRequests[b.job.id]");
  expect(code).toContain("unansweredRequests[a.job.id]");
  expect(code).toContain("border-warning bg-surface-secondary");
  expect(code).toContain("The placement cell asked for a change.");
 });
 it("REC-home-drives-27 validates only the role title and required CTC among editable prose fields",()=>{
  const draft=emptyHrDriveDraft();
  const invalid=hrDriveDraftSchema.safeParse({...draft,title:"",ctcLpa:"5",rounds:[]});
  expect(invalid.success).toBe(false);
  if(!invalid.success)expect(invalid.error.issues.some(issue=>issue.message==="Enter a role title")).toBe(true);
  const valid=hrDriveDraftSchema.safeParse({...draft,title:"Test engineer",ctcLpa:"5",description:"",location:"",rounds:[]});
  expect(valid.success).toBe(true);
 });
 it("REC-home-drives-30 records the legacy formal-request success sentence only after confirmed persistence",()=>{
  const code=read("src/components/hr/hr-drive-draft-form.tsx");
  expect(code).toContain("Sent to the placement cell for review");
  expect(code).toContain("submittedRef.current=true");
  expect(code).toContain("setSavedRequestId(");
  expect(code).toContain("Request status could not be confirmed. Your draft is preserved");
 });
 it("REC-home-drives-31 keeps the Hire again title rather than the invented capitalized heading",()=>{
  const code=read("src/components/hr/hr-drive-draft-form.tsx");
  expect(code).toContain("Hire again · copied from:");
  expect(read("src/app/(authenticated)/hr/drives/new/page.tsx")).toContain('fromJob ? "Hire again"');
 });
 it("REC-home-drives-32 protects all unsent drafts with an accessible discard confirmation",()=>{
  const code=read("src/components/hr/hr-drive-draft-form.tsx");
  expect(code).toContain('title="Discard this drive draft?"');
  expect(code).toContain('consequence="Leave without these changes?"');
  expect(code).toContain("window.addEventListener(\"beforeunload\",beforeUnload)");
  expect(code).toContain("setPendingLeave(destination.pathname+destination.search+destination.hash)");
  expect(code).toContain("router.push(href)");
 });
 it("REC-home-drives-52 pages actual persisted offers by 15 and includes expired offers",()=>{
  expect(HR_OFFER_PAGE_SIZE).toBe(15);
  expect(hrOfferPageBounds(2,31)).toMatchObject({pageSize:15,pages:3,first:16,last:30});
  expect(HR_OFFER_STATES).toContain("EXPIRED");
  expect(hrApplicantFilterSchema.parse({offerState:"EXPIRED"}).offerState).toBe("EXPIRED");
  const service=read("src/modules/placements/hr-job-read-service.ts");
  expect(service).toContain("where ${placementOffers.status}='EXPIRED'");
  expect(service).toContain('filters.offerState === "EXPIRED"');
  expect(HR_OFFER_STATES).not.toContain("SELECTED");
 });
 it("REC-calendar-messages-profile-23 avoids marking older unseen notifications as read",()=>{
  const code=read("src/components/hr/hr-recruiter-bell.tsx");
  expect(code).toContain('state.items.filter(item=>item.unread).length>=state.unread');
  expect(code).toContain("void markAll()");
  expect(code).toContain("setOpen(value=>!value)");
 });
});
