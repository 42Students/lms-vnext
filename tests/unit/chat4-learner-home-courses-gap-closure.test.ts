import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {learnerCourseMatchesSearch} from "@/modules/courses/learner-course-card-search-model";
import {learnerCourseResultSummary} from "@/modules/courses/learner-course-result-summary-model";
import {learnerCourseFilteredEmptyTitle} from "@/modules/courses/learner-course-filtered-empty-model";
import {mapLearnerCourseCardsLimited} from "@/modules/courses/learner-course-list-concurrency-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-4 learner Home and Courses gap closure",()=>{
 it("LEARNER-home-courses-06 legacy filtered results and empty titles",()=>{
  expect(learnerCourseResultSummary(48,60,100)).toBe("Showing 60 of 100 records · 48 currently displayed");
  expect(learnerCourseFilteredEmptyTitle({query:"",continueOnly:false,typeFilter:"elective",termState:"ALL",progressFilter:"ALL",periodCount:3}))
   .toBe("No electives to show right now.");
  expect(learnerCourseFilteredEmptyTitle({query:"",continueOnly:false,typeFilter:"core",termState:"ALL",progressFilter:"ALL",periodCount:3}))
   .toBe("No regular courses to show — everything this semester is an elective.");
 });
 it("LEARNER-home-courses-07 matches batch, academic year and instructor fields",()=>{
  const row={course:{courseName:"Geotechnics",courseCode:"GEOT",
   programName:"Civil Engineering",sectionName:"Section B",cohortName:"2027 Cohort",
   academicPeriodName:"Year 3",periodStartDate:"2099-07-01",periodEndDate:"2100-07-01"},
   instructorNames:["Dr Sita"]};
  expect(learnerCourseMatchesSearch(row,"Cohort")).toBe(true);
  expect(learnerCourseMatchesSearch(row,"2099")).toBe(true);
  expect(learnerCourseMatchesSearch(row,"Sita")).toBe(true);
  expect(learnerCourseMatchesSearch(row,"Astrophysics")).toBe(false);
 });
 it("LEARNER-home-courses-09 separates list Retry from course detail errors",()=>{
  const s=source("src/app/(authenticated)/learn/courses/error.tsx");
  expect(s).toContain("Failed to load courses. Please try again.");
  expect(s).toContain("Could not load course");
  expect(s).toContain("This course may not exist or you may not have access.");
  expect(s).toContain("onClick={reset}");
 });
 it("LEARNER-home-courses-11 unknown tab redirects to Overview retaining query context",()=>{
  const s=source("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  expect(s).toContain("if (activeTab === null)");
  expect(s).toContain("const safeQuery=new URLSearchParams()");
  expect(s).toContain('"/home"+(suffix?"?"+suffix:"")');
 });
 it("LEARNER-home-courses-13 learner header retains Course workspace and separate read-only status",()=>{
  const s=source("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  expect(s).toContain('description="Course workspace"');
  expect(s).toContain('title={workspace.course.name}');
  expect(s).toContain("Past semester course · Read only");
 });
 it("LEARNER-home-courses-R01 one course failure does not crash other cards",async()=>{
  const loaded=await mapLearnerCourseCardsLimited([1,2,3],async row=>{
   try{if(row===2)throw Error("simulated unavailable course");return "Course "+row;}
   catch{return "Unavailable "+row;}
  },2);
  expect(loaded).toEqual(["Course 1","Unavailable 2","Course 3"]);
  const s=source("src/app/(authenticated)/learn/courses/page.tsx");
  expect(s).toContain('return unavailable("Course temporarily unavailable")');
  expect(s).toContain('return unavailable("Duplicate course mapping "');
  expect(s).toContain("mapLearnerCourseCardsLimited");
 });
 it("GR-90 learner discussion errors remain announced and never render raw API codes",()=>{
  const s=source("src/components/courses/learner-course-discussion.tsx");
  expect(s).toContain('role="alert"');
  expect(s).toContain("apiFetch");
  expect(s).not.toContain("discussion_post_failed");
 });
 it("LEARNER-course-detail-R01 persists actual rewind position and restarts completed playback",()=>{
  const progress=source("src/modules/courses/progress-service.ts");
  expect(progress).toContain("lastPositionSeconds: positionSeconds,");
  expect(source("src/components/courses/learner-video-player.tsx")).toContain("completed ? 0 : initialPositionSeconds");
  expect(source("src/components/courses/learner-youtube-player.tsx")).toContain("completed ? 0 : initialPositionSeconds");
 });
 it("LEARNER-course-detail-R03 lets learners join and copy future live class meetings",()=>{
  expect(source("src/modules/courses/learner-course-service.ts")).toContain('row.contentType === "LIVE_CLASS"');
  expect(source("src/components/courses/learner-course-workspace.tsx")).toContain("<LearnerLiveClassLink");
  const s=source("src/components/courses/learner-live-class-link.tsx");
  expect(s).toContain("Join Meeting");
  expect(s).toContain("Copy meeting link");
 });

 it("LEARNER-home-courses-04 shows Semester Details, All Courses and Credits Breakdown",()=>{
  const s=source("src/components/courses/learner-course-list.tsx");
  for(const title of ["Semester Details","All Courses","Credits Breakdown","Total "])expect(s).toContain(title);
  expect(s).toContain("Showing first 100; search the full list below.");
 });

 it("LEARNER-home-courses-23 omits empty course About content",()=>{
  const s=source("src/components/courses/learner-course-overview.tsx");
  expect(s).toContain("aboutSource.hasDescription||meta.credits!==null||meta.instructors.length>0");
 });

 it("LEARNER-home-courses-10 gives Course unavailable navigation instead of a raw 404",()=>{
  const s=source("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx");
  expect(s).toContain("Course unavailable");
  expect(s).toContain("This course may not exist or you may not have access.");
  expect(s).toContain("Back to Courses");
 });
 it("LEARNER-home-courses-12 retains tab context without stale lesson and content",async()=>{
  const {learnerCourseTabPersistentQuery}=await import("@/modules/courses/learner-course-tab-context-model");
  const q=new URLSearchParams(learnerCourseTabPersistentQuery({semester:"3",lesson:"id",content:"id",filter:"lectures",view:"list"}));
  expect(q.get("semester")).toBe("3");
  expect(q.get("view")).toBe("list");
  expect(q.has("lesson")).toBe(false);
  expect(q.has("content")).toBe(false);
  expect(q.has("filter")).toBe(false);
  expect(source("src/components/courses/learner-course-document-title.tsx")).toContain('courseName+" · "+tabName');
  expect(source("src/components/courses/learner-course-tabs.tsx")).toContain("persistentQuery");
 });

 it("LEARNER-home-courses-19 uses an in-page Delete this message dialog",()=>{
  const s=source("src/components/courses/learner-course-discussion.tsx");
  expect(s).toContain('role="dialog" aria-modal="true" aria-label="Delete this message?"');
  expect(s).toContain("This cannot be undone.");
  expect(s).toContain("setDeleteTarget");
  expect(s).not.toContain('window.confirm("Delete this message?")');
 });
 it("LEARNER-home-courses-21 preserves an unsent discussion draft during route changes",()=>{
  const s=source("src/components/courses/learner-course-discussion.tsx");
  expect(s).toContain("beforeunload");
  expect(s).toContain('document.addEventListener("click",guard,true)');
  expect(s).toContain("Discard your unsent discussion message?");
 });

 it("LEARNER-home-courses-16 renders one legacy attendance percentage and Present Absent Held counts",()=>{
   const s=source("src/components/courses/learner-course-attendance.tsx");
   expect(s).toContain('aria-label="Attendance this month"');
   expect(s).toContain('summary.percentage===null?"—":summary.percentage+"%"');
   expect(s).toContain("weekdayLabel(row.startsAt)");
   for(const label of ["Present","Absent","Held","Attendance History"])
     expect(s).toContain(label);
   expect(s).not.toContain('label="Attendance threshold"');
 });
 it("LEARNER-home-courses-20 shows who pinned a discussion and number of pinned messages",()=>{
   const s=source("src/components/courses/learner-course-discussion.tsx");
   expect(s).toContain('Pinned by {pinned.senderName??"Unknown"} · 1 of {pinnedMessages.length||1}');
   expect(s).toContain('moderate || row.item.isMine');
 });
});
