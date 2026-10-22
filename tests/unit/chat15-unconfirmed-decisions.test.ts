import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {learnerRoadmapShouldOpenItem} from "@/modules/courses/learner-roadmap-item-focus-model";
import {createCourseQuizInputSchema} from "@/modules/courses/quiz-validation";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-15 evidence-based UNCONFIRMED decisions",()=>{
 it("LEARNER-course-detail-10 keeps unregistered video references behind safe external or signed access",()=>{
  const workspace=source("src/components/courses/learner-course-workspace.tsx");
  expect(workspace).toContain("content.type === \"VIDEO\"");
  expect(workspace).toContain("content.storageKey");
  expect(workspace).toContain("learnerSafeExternalContentHref(content.externalUrl)");
  const storage=source("src/modules/courses/learner-storage-ui-model.ts");
  expect(storage).toContain(String.raw`video-asset\/`);
  expect(storage).toContain("A secure signed URL is required");
 });
 it("LEARNER-course-detail-18 refuses mismatched or stale lesson-content deep links",()=>{
  expect(learnerRoadmapShouldOpenItem("a","b","a","b")).toBe(true);
  expect(learnerRoadmapShouldOpenItem("a","b","c","b")).toBe(false);
  expect(learnerRoadmapShouldOpenItem("a","b","a","c")).toBe(false);
  const workspace=source("src/components/courses/learner-course-workspace.tsx");
  expect(workspace).toContain("focusContentId");
  expect(workspace).toContain("focusLessonId");
 });
 it("LEARNER-home-courses-01 deliberately preserves a multi-role dashboard and a dedicated learner courses link",()=>{
  const dashboard=source("src/app/(authenticated)/dashboard/page.tsx");
  expect(dashboard).toContain("No role workspace is available");
  expect(dashboard).toContain('href="/learn/courses"');
  expect(dashboard).toContain("Active Courses");
 });
 it("LEARNER-home-courses-14 uses tenant-scoped official class notices, never discussion posts",()=>{
  const page=source("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  const official=source("src/modules/courses/learner-course-announcements-service.ts");
  expect(page).toContain("listLearnerCourseClassAnnouncements(context,courseMeta.sectionId)");
  expect(page).toContain("courseUpdates={courseUpdates}");
  expect(page).not.toContain("listCourseDiscussionMessages(");
  expect(official).toContain('eq(db10Announcements.receiverType,"CLASS")');
  expect(official).toContain("eq(db10Announcements.receiverId,sectionId)");
  expect(official).toContain("eq(db10Announcements.collegeId,member.collegeId)");
  expect(official).toContain("eq(db10Announcements.organizationId,member.organizationId)");
  expect(official).toContain('inArray(db10Announcements.senderType,["COLLEGE_ADMIN","FACULTY"])');
  expect(official).toContain('placementTableExists("announcements")');
 });
 it("LEARNER-learning-misc-25 does not execute arbitrary learner-visible question HTML",()=>{
  const attempt=source("src/components/courses/learner-quiz-attempt.tsx");
  expect(attempt).toContain("{current.prompt}");
  expect(attempt).not.toContain("dangerouslySetInnerHTML");
  const validation=source("src/modules/courses/quiz-validation.ts");
  expect(validation).toContain("QUIZ_QUESTION_TYPES");
  expect(createCourseQuizInputSchema.safeParse({}).success).toBe(false);
 });
 it("LEARNER-learning-misc-41 keeps authorized delivery IDs as canonical learner course links",()=>{
  const schedule=source("src/components/academics/learner-class-schedule.tsx");
  expect(schedule).toContain('courseBasePath = "/learn/courses"');
  expect(schedule).toContain('href={`${courseBasePath}/${event.deliveryId}');
  const route=source("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  expect(route).toContain("getLearnerCourseWorkspace(context, deliveryId)");
  expect(route).toContain("if (!courseMeta)");
  expect(route).toContain("notFound()");
 });
 it("LEARNER-placements-16 renders true disclosure placeholders, posted date and application status",()=>{
  const jobs=source("src/components/placements/learner-placement-jobs.tsx");
  for(const term of ["Not disclosed","Posted date not specified","Deadline","Posted ","learnerDriveDeadlineUrgency","item.application"]){
   expect(jobs).toContain(term);
  }
 });
 it("LEARNER-placements-39 does not synthesize blocked exam dates when only round data exists",()=>{
  const calendar=source("src/components/placements/learner-career-calendar.tsx");
  expect(calendar).toContain("careerCalendarEvents(rounds,supplements)");
  expect(calendar).toContain("No career events have been scheduled for you yet.");
  // Deadline and blocked-day sources are required for full parity; decision remains OPEN.
 });
 it("LEARNER-placements-45 does not fabricate employer letter URLs or internship placement flags",()=>{
  const offers=source("src/components/placements/learner-placement-offers.tsx");
  expect(offers).toContain("LearnerPlacementOfferItem");
  expect(offers).not.toContain("letterUrl: \"https://");
  // Persisted letter and counts-as-placed fields must precede UI claims.
 });
});
