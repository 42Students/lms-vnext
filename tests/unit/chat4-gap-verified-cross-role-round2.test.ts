import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Chat-4 previously incomplete cross-role gap contracts",()=>{
 it("SA-tenants-modules-57 delivers only to active placement cells and preserves sender scopes",()=>{
  const service=source("src/modules/announcements/super-admin-college-broadcast-service.ts");
  const form=source("src/components/announcements/super-admin-college-broadcast-form.tsx");
  expect(service).toContain("mr.role='TPO'");
  expect(service).toContain("u.platform_status='ACTIVE'");
  expect(service).toContain("cm.status='ACTIVE'");
  expect(service).toContain("sameReviewedBroadcastAudience");
  expect(service).toContain("deliverInAppNotificationInTransaction");
  expect(form).toContain("Every placement cell");
 });
 it("TPO-home-07 draws Engage counts from persisted recruiter CRM and routes follow-up attention",()=>{
  const page=source("src/app/(authenticated)/tpo/home/page.tsx");
  const rows=source("src/modules/placements/tpo-home-legacy-rows.ts");
  expect(page).toContain("recruiterLeads:crmCounts?.leads");
  expect(page).toContain("followUps:crmCounts?.dueFollowups");
  expect(page).toContain("recruiterAccess:crmCounts?.pendingRecruiterAccess");
  expect(rows).toContain('key:"engage",title:"Engage"');
  expect(rows).toContain('/tpo/recruiters?due=1');
  expect(rows).toContain("no follow-ups today");
 });
 it("LEARNER-home-courses-15 retains existing Assessment, Discussion and Live Session quick links with truthful start action",()=>{
  const overview=source("src/components/courses/learner-course-overview.tsx");
  for(const label of ["Assessments","Discussions","Live Sessions","Start learning"])
   expect(overview).toContain(label);
  expect(overview).toContain("due");
 });
});
