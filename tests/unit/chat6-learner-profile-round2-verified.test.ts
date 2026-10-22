import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("Learner profile and notifications fixed-on-main parity evidence",()=>{
 it("LEARNER-profile-misc-07 restores exact legacy section headings",()=>{
  {const code=source("src/components/profile/learner-profile-workspace.tsx");expect(code).toContain("Personal Details");expect(code).toContain('education: "Qualifications"');expect(code).toContain("Academic Achievements");expect(code).toContain("Hobbies & Interests");expect(code).toContain("Publications & Research");expect(code).toContain("Awards & Recognitions");}
 });
 it("LEARNER-profile-misc-09 shows profile completion ring and completed remaining pills",()=>{
  {const code=source("src/components/profile/learner-profile-workspace.tsx");expect(code).toContain("viewBox=\"0 0 64 64\"");expect(code).toContain("coverage.completed} Completed");expect(code).toContain("coverage.total-coverage.completed} Remaining");}
 });
 it("LEARNER-profile-misc-10 guards unsaved profile edits before discarding",()=>{
  {const code=source("src/components/profile/learner-profile-workspace.tsx");expect(code).toContain("Discard profile changes?");expect(code).toContain("Discard your changes?");expect(code).toContain("beforeunload");}
 });
 it("LEARNER-profile-misc-11 refreshes saved profile on returning to visible tab",()=>{
  {const code=source("src/components/profile/learner-profile-workspace.tsx");expect(code).toContain("visibilitychange");expect(code).toContain("onVisible");}
 });
 it("LEARNER-profile-misc-12 supports deep links to profile sections",()=>{
  {const code=source("src/app/(authenticated)/learn/profile/page.tsx");expect(code).toContain("learnerProfileResolveSection(query.section)");expect(code).toContain("initialSection={initialSection}");}
  {const code=source("src/components/profile/learner-profile-workspace.tsx");expect(code).toContain("scrollIntoView");}
 });
 it("LEARNER-profile-misc-13 provides skill catalogue searching instead of free text only",()=>{
  {const code=source("src/components/profile/learner-profile-workspace.tsx");expect(code).toContain("LearnerSkillCatalogInput");}
  {const code=source("src/components/profile/learner-skill-catalog-input.tsx");expect(code).toContain("\"/api/skills?\"");expect(code).toContain("Type to search skills (e.g., Java, Python, React)...");}
 });
 it("LEARNER-profile-misc-14 shows verification badge at top of profile",()=>{
  {const code=source("src/app/(authenticated)/learn/profile/page.tsx");expect(code).toContain("aria-label=\"Profile verification summary\"");expect(code).toContain("Verified profile");expect(code).toContain("Not verified yet");}
 });
 it("LEARNER-profile-misc-21 displays audience context for learner notifications",()=>{
  {const code=source("src/components/activity/learner-notifications-inbox.tsx");expect(code).toContain("contextLine:learnerAnnouncementAudienceContext");}
  {const code=source("src/components/activity/notification-list.tsx");expect(code).toContain("item.contextLine");}
 });
 it("LEARNER-profile-misc-22 merges college department program and class announcements safely",()=>{
  {const code=source("src/app/(authenticated)/learn/notifications/page.tsx");expect(code).toContain("listVisibleAnnouncementsForMembership(context)");}
  {const code=source("src/modules/announcements/service.ts");expect(code).toContain("receiverType, \"COLLEGE\"");expect(code).toContain("receiverType, \"DEPARTMENT\"");expect(code).toContain("receiverType, \"PROGRAM\"");expect(code).toContain("receiverType, \"CLASS\"");}
 });
 it("LEARNER-profile-misc-26 shows total attendance and accurate marked-session explanation",()=>{
  {const code=source("src/components/attendance/learner-attendance-workspace.tsx");expect(code).toContain("Metric label=\"Total\"");expect(code).toContain("Only marked sessions affect the percentage.");}
 });
});
