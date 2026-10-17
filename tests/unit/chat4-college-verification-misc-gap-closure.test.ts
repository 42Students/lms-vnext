import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-4 College Verification and Misc verification",()=>{
 it("COL-verification-misc-01 retains source-backed legacy behavior",()=>{
  {const s=read("src/components/college/college-admin-profile-editor.tsx");
   expect(s).toContain("Personal Details");
   expect(s).toContain("Social Profiles");
   expect(s).toContain("Address");
   expect(s).toContain("Contacts");
   expect(s).toContain("apiFetch");
   expect(s).toContain("Save profile");
  }
  {const s=read("src/modules/people/college-admin-profile-edit-service.ts");
   expect(s).toContain("collegeOwnProfileSchema");
   expect(s).toContain("updateCollegeOwnProfile");
  }
 });
 it("COL-verification-misc-02 retains source-backed legacy behavior",()=>{
  {const s=read("src/app/(authenticated)/college/profile/page.tsx");
   expect(s).toContain("query.section === \"contacts\"");
   expect(s).toContain("query.section === \"connect-accounts\"");
   expect(s).toContain("Failed to load profile.");
   expect(s).toContain("Retry");
  }
  {const s=read("src/components/college/college-admin-profile-editor.tsx");
   expect(s).toContain("Profile photo (HTTPS link)");
   expect(s).toContain("Additional email");
   expect(s).toContain("Contact person");
  }
 });
 it("COL-verification-misc-03 retains source-backed legacy behavior",()=>{
  {const s=read("src/components/verification/CollegeVerificationPanel.tsx");
   expect(s).toContain("Review one by one");
   expect(s).toContain("setSequential");
   expect(s).toContain("nextInSequence");
   expect(s).toContain("verificationSessionStopped");
  }
  {const s=read("src/components/verification/VerificationReviewDrawer.tsx");
   expect(s).toContain("sequenceProgress");
   expect(s).toContain("onNext");
   expect(s).toContain("onFinish");
  }
 });
 it("COL-verification-misc-05 retains source-backed legacy behavior",()=>{
  {const s=read("src/components/verification/VerificationReviewDrawer.tsx");
   expect(s).toContain("Verification history");
   expect(s).toContain("History");
   expect(s).toContain("Numbers show only the last four digits");
   expect(s).toContain("Resume available");
   expect(s).toContain("Marksheet");
  }
 });
 it("COL-verification-misc-07 retains source-backed legacy behavior",()=>{
  {const s=read("src/components/verification/CollegeVerificationPanel.tsx");
   expect(s).toContain("The student has been told.");
   expect(s).toContain("The students have been told.");
   expect(s).toContain("The student sees your reason.");
  }
  {const s=read("src/modules/verification/notification-copy.ts");
   expect(s).toContain("verificationDecisionNotice");
   expect(s).toContain("Your ${section} is verified");
  }
 });
 it("COL-verification-misc-12 retains source-backed legacy behavior",()=>{
  {const s=read("src/app/(authenticated)/college/activity/page.tsx");
   expect(s).toContain("collegeActivityTodayHref");
   expect(s).toContain("collegeActivityRecentHref");
   expect(s).toContain("collegeActivityAllTimeHref");
   expect(s).toContain("View project activity");
   expect(s).toContain("Refresh");
  }
  {const s=read("src/modules/activity/college-activity-model.ts");
   expect(s).toContain("collegeActivityTodayHref");
   expect(s).toContain("collegeActivityAllTimeHref");
  }
 });
 it("COL-verification-misc-14 records the approved product decision",()=>{
  {const s=read("src/app/(authenticated)/college/activity/page.tsx");
   expect(s).toContain("Export filtered CSV (max 1,000)");
   expect(s).toContain("/api/activity/college-export");
  }
 });
 it("COL-verification-misc-15 retains source-backed legacy behavior",()=>{
  {const s=read("src/app/(authenticated)/college/profile/page.tsx");
   expect(s).toContain("Admin not assigned to a college");
  }
  {const s=read("src/app/(authenticated)/college/activity/page.tsx");
   expect(s).toContain("Admin not assigned to a college");
  }
  {const s=read("src/app/(authenticated)/college/verification/page.tsx");
   expect(s).toContain("Admin not assigned to a college");
  }
 });
 it("COL-verification-misc-16 records the approved product decision",()=>{
  {const s=read("src/app/(authenticated)/college/announcements/page.tsx");
   expect(s).toContain("listAnnouncementsForAdmin");
   expect(s).toContain("AnnouncementAdminWorkspace");
  }
  {const s=read("docs/audit/owner-decisions-resolved.md");
   expect(s).toContain("announcements allowed");
  }
 });
 it("COL-verification-misc-19 records the approved product decision",()=>{
  {const s=read("src/app/(authenticated)/college/announcements/page.tsx");
   expect(s).toContain("getCollegeNoticeInbox");
   expect(s).toContain("Unread only");
   expect(s).toContain("Show all notifications");
   expect(s).toContain("ownInbox.unreadCount");
  }
 });
 it("COL-verification-misc-06 offers precise Education and Identity send-back reasons",()=>{
  const drawer=source("src/components/verification/VerificationReviewDrawer.tsx");
  expect(drawer).toContain("tpoVerificationSectionReasons(row.section)");
  expect(drawer).toContain("The student sees your reason and fixes it on their profile.");
  const college=source("src/components/verification/CollegeVerificationPanel.tsx");
  expect(college).toContain('tpoVerificationSectionReasons("EDUCATION")');
  expect(college).toContain('tpoVerificationSectionReasons("IDENTITY")');
  expect(college).toContain("apiFetch<unknown>");
 });

});
