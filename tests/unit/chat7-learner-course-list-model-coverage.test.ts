import {describe,expect,it} from "vitest";
import {learnerCourseHasActiveFilters} from "@/modules/courses/learner-course-active-filters-model";
import {learnerCourseMatchesSearch} from "@/modules/courses/learner-course-card-search-model";
import {learnerCourseCardNextLabel} from "@/modules/courses/learner-course-card-next-label-model";
import {learnerCourseCardProgress} from "@/modules/courses/learner-course-card-progress-model";
import {learnerCourseHasContinueAction} from "@/modules/courses/learner-course-continue-model";
import {learnerCourseFilteredEmptyTitle} from "@/modules/courses/learner-course-filtered-empty-model";
import {learnerCourseMatchesProgress} from "@/modules/courses/learner-course-progress-filter-model";
import {sortLearnerCourseCards} from "@/modules/courses/learner-course-sort-model";
import {learnerCourseMatchesTermState} from "@/modules/courses/learner-course-term-state-model";
import {resolveLearnerCourseTypeFilter} from "@/modules/courses/learner-course-type-availability-model";
import {learnerCourseTabPersistentQuery} from "@/modules/courses/learner-course-tab-context-model";
import {learnerCourseCreditSummary} from "@/modules/courses/learner-course-credit-summary-model";
import {resolveLearnerCoursePeriod} from "@/modules/courses/learner-course-current-period-model";
import {learnerCourseImageResetKey} from "@/modules/courses/learner-course-image-reset-key-model";

const all={query:"",typeFilter:"all" as const,continueOnly:false,progressFilter:"ALL" as const,
 termState:"ALL" as const,sortMode:"NAME" as const};
const course={course:{courseName:"Database Systems",courseCode:"CS204",programName:"BTech CSE",
 sectionName:"A1",cohortName:"2025",academicPeriodName:"Semester IV",
 periodStartDate:"2099-06-01",periodEndDate:"2099-11-01"},instructorNames:["Faculty Rao"]};
const empty={query:"",continueOnly:false,typeFilter:"all" as const,termState:"ALL" as const,
 progressFilter:"ALL" as const,periodCount:4};
const label={readOnly:false,learningPathReady:true,nextItem:null,firstOverdue:null,summary:{itemsCompleted:0,itemsTotal:2}};

describe("chat-7 learner course discovery/list behavioural matrix",()=>{
 it("UX-learn-courses-filters-01 excludes semester selection from active filter indicators",()=>{
  expect(learnerCourseHasActiveFilters(all)).toBe(false);
  expect(learnerCourseHasActiveFilters({...all,query:" databases "})).toBe(true);
  expect(learnerCourseHasActiveFilters({...all,continueOnly:true})).toBe(true);
  expect(learnerCourseHasActiveFilters({...all,typeFilter:"elective"})).toBe(true);
  expect(learnerCourseHasActiveFilters({...all,progressFilter:"COMPLETED"})).toBe(true);
  expect(learnerCourseHasActiveFilters({...all,termState:"HISTORY"})).toBe(true);
  expect(learnerCourseHasActiveFilters({...all,sortMode:"DUE"})).toBe(true);
 });
 it("UX-learn-courses-search-02 searches only authorized course/instructor metadata and fails safely on invalid queries",()=>{
  for(const query of ["dataBASE","cs204","btech","a1","2025","semester iv","faculty rao","2099"]){
   expect(learnerCourseMatchesSearch(course,query)).toBe(true);
  }
  expect(learnerCourseMatchesSearch(course,"biology")).toBe(false);
  expect(learnerCourseMatchesSearch(course,undefined)).toBe(true);
  expect(learnerCourseMatchesSearch(course,{nested:true})).toBe(true);
  expect(learnerCourseMatchesSearch(course,"  CS204  ")).toBe(true);
 });
 it("UX-learn-courses-next-03 orders read-only, unpublished, overdue and actionable states truthfully",()=>{
  expect(learnerCourseCardNextLabel({...label,readOnly:true})).toBe("View course");
  expect(learnerCourseCardNextLabel({...label,learningPathReady:false})).toBe("Learning path not published");
  expect(learnerCourseCardNextLabel({...label,firstOverdue:{title:"Essay"}})).toBe("Overdue assignment · Essay");
  expect(learnerCourseCardNextLabel({...label,nextItem:{kind:"ASSIGNMENT",title:"Lab"}})).toBe("Assignment · Lab");
  expect(learnerCourseCardNextLabel({...label,nextItem:{kind:"QUIZ",title:"Chapter 3"}})).toBe("Quiz · Chapter 3");
  expect(learnerCourseCardNextLabel({...label,nextItem:{kind:"CONTENT",title:"Slides"}})).toBe("Continue · Slides");
  expect(learnerCourseCardNextLabel({...label,summary:{itemsCompleted:0,itemsTotal:0}})).toBe("No learning items yet");
  expect(learnerCourseCardNextLabel({...label,summary:{itemsCompleted:2,itemsTotal:2}})).toBe("Course work complete");
  expect(learnerCourseCardNextLabel(label)).toBe("Review remaining course work");
 });
 it("UX-learn-courses-progress-04 clamps computed progress and hides unmeasured/invalid values",()=>{
  expect(learnerCourseCardProgress(54.5,12)).toBe(54.5);
  expect(learnerCourseCardProgress(120,12)).toBe(100);
  expect(learnerCourseCardProgress(-5,12)).toBe(0);
  expect(learnerCourseCardProgress(null,12)).toBeNull();
  expect(learnerCourseCardProgress(55,0)).toBeNull();
  expect(learnerCourseCardProgress(Number.NaN,12)).toBeNull();
  expect(learnerCourseCardProgress(Infinity,12)).toBeNull();
 });
 it("UX-learn-courses-continue-05 never exposes continue on archived or unready learning paths",()=>{
  const row={readOnly:false,learningPathReady:true,nextItem:{kind:"QUIZ"},nextDue:null,firstOverdue:null};
  expect(learnerCourseHasContinueAction(row)).toBe(true);
  expect(learnerCourseHasContinueAction({...row,readOnly:true})).toBe(false);
  expect(learnerCourseHasContinueAction({...row,learningPathReady:false})).toBe(false);
  expect(learnerCourseHasContinueAction({...row,nextItem:null,nextDue:null})).toBe(false);
  expect(learnerCourseHasContinueAction({...row,nextItem:null,nextDue:{title:"Test"}})).toBe(true);
  expect(learnerCourseHasContinueAction({...row,nextItem:null,firstOverdue:{title:"Task"}})).toBe(true);
 });
 it("UX-learn-courses-empty-06 preserves precise empty copy for all filter priority classes",()=>{
  expect(learnerCourseFilteredEmptyTitle({...empty,periodCount:0})).toBe("No courses in this semester");
  expect(learnerCourseFilteredEmptyTitle({...empty,query:"  Math  "})).toContain("Math");
  expect(learnerCourseFilteredEmptyTitle({...empty,continueOnly:true})).toContain("next learning step");
  expect(learnerCourseFilteredEmptyTitle({...empty,termState:"CURRENT"})).toContain("active courses");
  expect(learnerCourseFilteredEmptyTitle({...empty,termState:"HISTORY"})).toContain("past courses");
  expect(learnerCourseFilteredEmptyTitle({...empty,progressFilter:"UNMEASURED"})).toContain("progress filter");
  expect(learnerCourseFilteredEmptyTitle({...empty,typeFilter:"elective"})).toContain("electives");
  expect(learnerCourseFilteredEmptyTitle({...empty,typeFilter:"core"})).toContain("regular courses");
  expect(learnerCourseFilteredEmptyTitle(empty)).toBe("No courses match the current filters");
 });
 it("UX-learn-courses-progress-filters-07 determines completion from tracked counts, not fabricated percent",()=>{
  const row=(done:number,total:number)=>({summary:{itemsCompleted:done,itemsTotal:total}});
  expect(learnerCourseMatchesProgress(row(0,0),"UNMEASURED")).toBe(true);
  expect(learnerCourseMatchesProgress(row(0,0),"COMPLETED")).toBe(false);
  expect(learnerCourseMatchesProgress(row(0,6),"NOT_STARTED")).toBe(true);
  expect(learnerCourseMatchesProgress(row(3,6),"IN_PROGRESS")).toBe(true);
  expect(learnerCourseMatchesProgress(row(6,6),"COMPLETED")).toBe(true);
  expect(learnerCourseMatchesProgress(row(7,6),"COMPLETED")).toBe(true);
  expect(learnerCourseMatchesProgress(row(3,6),"unknown")).toBe(true);
  expect(learnerCourseMatchesProgress(row(3,6),"UNMEASURED")).toBe(false);
 });
 it("UX-learn-courses-sort-08 preserves regular-before-elective for all modes with deterministic tie-breaking",()=>{
  const card=(id:string,name:string,kind:string,pct:number|null,dueAt:string|null,lastActivity:string|null,overdue=0)=>({
   course:{deliveryId:id,offeringType:kind,courseName:name},summary:{overallPercent:pct},
   nextDue:dueAt?{dueAt}:null,lastActivity,readOnly:false,overdueAssignments:overdue,
  });
  const a=card("a","Alpha","CORE",10,"2099-01-10T00:00:00Z","2099-01-02T00:00:00Z");
  const b=card("b","Beta","CORE",70,"2099-01-05T00:00:00Z","2099-01-04T00:00:00Z");
  const c=card("c","Elective","ELECTIVE",0,"2099-01-01T00:00:00Z","2099-01-06T00:00:00Z");
  const d=card("d","Due","CORE",null,null,null,1);
  expect(sortLearnerCourseCards([c,b,a],"NAME").map(x=>x.course.deliveryId)).toEqual(["a","b","c"]);
  expect(sortLearnerCourseCards([c,b,a],"PROGRESS").map(x=>x.course.deliveryId)).toEqual(["a","b","c"]);
  expect(sortLearnerCourseCards([c,b,a],"RECENT").map(x=>x.course.deliveryId)).toEqual(["b","a","c"]);
  expect(sortLearnerCourseCards([c,b,a,d],"DUE").map(x=>x.course.deliveryId)).toEqual(["d","b","a","c"]);
  expect(sortLearnerCourseCards([c,b,a],"unknown").map(x=>x.course.deliveryId)).toEqual(["a","b","c"]);
 });
 it("UX-learn-courses-term-09 does not guess current term from browser clock",()=>{
  expect(learnerCourseMatchesTermState({readOnly:false},"CURRENT")).toBe(true);
  expect(learnerCourseMatchesTermState({readOnly:true},"CURRENT")).toBe(false);
  expect(learnerCourseMatchesTermState({readOnly:true},"HISTORY")).toBe(true);
  expect(learnerCourseMatchesTermState({readOnly:false},"HISTORY")).toBe(false);
  expect(learnerCourseMatchesTermState({readOnly:true},"ALL")).toBe(true);
  expect(learnerCourseMatchesTermState({readOnly:false},"invalid")).toBe(true);
 });
 it("UX-learn-courses-type-10 clears stale elective/core filters if authorized data disappears",()=>{
  expect(resolveLearnerCourseTypeFilter("elective",8,0)).toBe("all");
  expect(resolveLearnerCourseTypeFilter("core",0,9)).toBe("all");
  expect(resolveLearnerCourseTypeFilter("elective",1,1)).toBe("elective");
  expect(resolveLearnerCourseTypeFilter("core",1,1)).toBe("core");
  expect(resolveLearnerCourseTypeFilter("all",0,0)).toBe("all");
 });
 it("UX-learn-courses-tab-query-11 excludes selection-only keys and rejects oversized values",()=>{
  const raw={lesson:"secret-lesson",content:"content-id",filter:"assessments",page:"2",
   semester:"2025",tooLong:"x".repeat(501)};
  const query=new URLSearchParams(learnerCourseTabPersistentQuery(raw));
  expect(query.get("lesson")).toBeNull();
  expect(query.get("content")).toBeNull();
  expect(query.get("filter")).toBeNull();
  expect(query.get("tooLong")).toBeNull();
  expect(query.get("page")).toBe("2");
  expect(query.get("semester")).toBe("2025");
  expect(new URLSearchParams(learnerCourseTabPersistentQuery({a:["x","y"]})).get("a")).toBeNull();
  expect(new URLSearchParams(learnerCourseTabPersistentQuery(
   Object.fromEntries(Array.from({length:30},(_,index)=>["k"+index,"v"+index])))).size).toBe(20);
 });
 it("UX-learn-courses-credits-12 ignores missing, invalid and negative course credits",()=>{
  expect(learnerCourseCreditSummary([3,4,null,-3,NaN,Infinity])).toEqual({
   credits:7,recordedCount:2,missingCount:4,
  });
  expect(learnerCourseCreditSummary([])).toEqual({credits:0,recordedCount:0,missingCount:0});
 });
 it("UX-learn-courses-period-13 falls back only to an authorized period on stale selected filters",()=>{
  const periods=[{id:"term-a"},{id:"term-b"}];
  expect(resolveLearnerCoursePeriod("term-b",periods,"term-a")).toBe("term-b");
  expect(resolveLearnerCoursePeriod("deleted",periods,"term-a")).toBe("term-a");
  expect(resolveLearnerCoursePeriod("deleted",periods,"invalid")).toBe("term-a");
  expect(resolveLearnerCoursePeriod("deleted",[],"invalid")).toBe("");
 });
 it("UX-learn-courses-image-14 remounts only when delivery or thumbnail changes",()=>{
  const a=learnerCourseImageResetKey("delivery-id","https://example.com/a.png");
  expect(a).toBe(learnerCourseImageResetKey("delivery-id","https://example.com/a.png"));
  expect(a).not.toBe(learnerCourseImageResetKey("other-delivery","https://example.com/a.png"));
  expect(a).not.toBe(learnerCourseImageResetKey("delivery-id",null));
 });
});
