import {describe,expect,it} from "vitest";
import {learnerCourseHasContinueAction} from "@/modules/courses/learner-course-continue-model";
import {learnerCourseNextItemHref} from "@/modules/courses/learner-course-next-action-model";
import {learnerCourseCardProgress} from "@/modules/courses/learner-course-card-progress-model";
import {learnerCourseHomeCompletion} from "@/modules/courses/learner-course-home-completion-model";
import {learnerCourseFilteredEmptyTitle} from "@/modules/courses/learner-course-filtered-empty-model";
import {learnerCourseHasActiveFilters} from "@/modules/courses/learner-course-active-filters-model";
import {selectLearnerOverdueAssignment} from "@/modules/courses/learner-course-overdue-link-model";
import {learnerAssessmentSubmittedLinkHref} from "@/modules/courses/learner-assessment-submitted-link-model";
import {normalizeLearnerAssessmentSearch,learnerAssessmentMatchesSearch} from "@/modules/courses/learner-assessment-search-model";
import {learnerAssessmentSort} from "@/modules/courses/learner-assessment-sort-model";

const deliveryId="11111111-1111-4111-8111-111111111111";
const lessonId="22222222-2222-4222-8222-222222222222";
const itemId="33333333-3333-4333-8333-333333333333";
const time=new Date("2099-01-01T12:00:00Z");
const course={readOnly:false,learningPathReady:true,nextItem:{lessonId,itemId,kind:"CONTENT" as const},
 course:{deliveryId}};

describe("COURSES-LEARNER-COURSE-HOME-03 published-path and deadline-safe navigation",()=>{
 it("never exposes a Continue deep link for unpublished, historical or invalid-scope work",()=>{
  expect(learnerCourseHasContinueAction({...course,nextDue:null})).toBe(true);
  expect(learnerCourseHasContinueAction({...course,readOnly:true,nextDue:null})).toBe(false);
  expect(learnerCourseHasContinueAction({...course,learningPathReady:false,nextDue:null})).toBe(false);
  const href=learnerCourseNextItemHref(course);
  expect(href).toContain("/learn/courses/"+deliveryId+"/roadmap?");
  expect(href).toContain("filter=all");
  expect(href).toContain("lesson="+lessonId);
  expect(learnerCourseNextItemHref({...course,course:{deliveryId:"bad"}})).toBeNull();
  expect(learnerCourseNextItemHref({...course,nextItem:{...course.nextItem,itemId:"bad"}})).toBeNull();
  expect(learnerCourseNextItemHref({...course,readOnly:true})).toBeNull();
  expect(learnerCourseNextItemHref({...course,learningPathReady:false})).toBeNull();
 });
 it("does not invent course progress from invalid or absent content denominator",()=>{
  expect(learnerCourseCardProgress(50,4)).toBe(50);
  expect(learnerCourseCardProgress(101,4)).toBe(100);
  for(const size of [0,-1,Number.NaN,Number.POSITIVE_INFINITY])
   expect(learnerCourseCardProgress(50,size)).toBeNull();
  expect(learnerCourseCardProgress(Number.NaN,4)).toBeNull();
  expect(learnerCourseCardProgress(null,4)).toBeNull();
  expect(learnerCourseHomeCompletion({
   itemsTotal:0,itemsCompleted:0,itemsMissed:0,readOnly:false,hasPublishedPath:false,
  }).title).toBe("Learning path not published");
  expect(learnerCourseHomeCompletion({
   itemsTotal:2,itemsCompleted:1,itemsMissed:0,readOnly:true,
  }).title).toBe("Review the Learning Path");
 });
 it("treats due equality as closed and overdue, but never links to submitted or future work",()=>{
  const older=new Date(time.getTime()-1000);
  const later=new Date(time.getTime()+1000);
  const lessons=[{id:lessonId,assignments:[
   {id:itemId,title:"At deadline",dueAt:time,submittedAt:null},
   {id:"future",title:"Future",dueAt:later,submittedAt:null},
   {id:"submitted",title:"Submitted",dueAt:older,submittedAt:time},
  ]}];
  expect(selectLearnerOverdueAssignment(lessons,time.getTime())?.itemId).toBe(itemId);
  expect(selectLearnerOverdueAssignment(lessons,time.getTime()-1)).toBeNull();
  expect(selectLearnerOverdueAssignment(lessons,Number.NaN)).toBeNull();
  expect(selectLearnerOverdueAssignment([],time.getTime())).toBeNull();
 });
 it("distinguishes empty selected semester from empty search/filter without changing semester",()=>{
  const base={query:"",continueOnly:false,typeFilter:"all" as const,termState:"ALL" as const,
   progressFilter:"ALL" as const,periodCount:4};
  expect(learnerCourseFilteredEmptyTitle({...base,periodCount:0}))
   .toBe("No courses in this semester");
  expect(learnerCourseFilteredEmptyTitle({...base,query:"Operating Systems"}))
   .toContain("Operating Systems");
  expect(learnerCourseFilteredEmptyTitle({...base,continueOnly:true}))
   .toContain("next learning step");
  const defaults={query:"",typeFilter:"all" as const,continueOnly:false,
   progressFilter:"ALL" as const,termState:"ALL" as const,sortMode:"NAME" as const};
  expect(learnerCourseHasActiveFilters(defaults)).toBe(false);
  expect(learnerCourseHasActiveFilters({...defaults,query:" searching "})).toBe(true);
  expect(learnerCourseHasActiveFilters({...defaults,sortMode:"RECENT"})).toBe(true);
 });
});

describe("COURSES-LEARNER-ASSESSMENT-LISTS-03 safe links, search and stable sorting",()=>{
 it("exposes only revalidated legacy HTTPS submission URLs",()=>{
  expect(learnerAssessmentSubmittedLinkHref("https://university.example.edu/assignment"))
   .toBe("https://university.example.edu/assignment");
  for(const url of ["javascript:alert(1)","http://university.example.edu","",
    "https://name:password@university.example.edu"])
    expect(learnerAssessmentSubmittedLinkHref(url)).toBeNull();
  expect(learnerAssessmentSubmittedLinkHref(null)).toBeNull();
 });
 it("bounds learner assessment search without querying another learner",()=>{
  const item={title:"Physics assignment",description:null,lessonName:"Motion",
   courseName:"Physics",courseCode:"PHY-101"};
  expect(learnerAssessmentMatchesSearch(item,"physics")).toBe(true);
  expect(learnerAssessmentMatchesSearch(item,"Private unrelated")).toBe(false);
  expect(normalizeLearnerAssessmentSearch(["duplicated"])).toBe("");
  expect(normalizeLearnerAssessmentSearch("x".repeat(101))).toHaveLength(100);
 });
 it("sorts only authorized input, with stable tie breakers and missing dates last",()=>{
  const rows=[
   {id:"2",title:"Beta",dueAt:"2099-01-02T00:00:00Z",createdAt:"2099-01-03T00:00:00Z"},
   {id:"1",title:"Alpha",dueAt:"2099-01-01T00:00:00Z",createdAt:"2099-01-01T00:00:00Z"},
   {id:"3",title:"Missing",dueAt:null,createdAt:"invalid"},
  ];
  expect(learnerAssessmentSort(rows,"DUE").map(x=>x.id)).toEqual(["1","2","3"]);
  expect(learnerAssessmentSort(rows,"CREATED").map(x=>x.id)).toEqual(["2","1","3"]);
  expect(learnerAssessmentSort(rows,"TITLE").map(x=>x.id)).toEqual(["1","2","3"]);
  expect(learnerAssessmentSort(rows,"FORGED").map(x=>x.id)).toEqual(["1","2","3"]);
  expect(rows.map(x=>x.id)).toEqual(["2","1","3"]);
 });
});
