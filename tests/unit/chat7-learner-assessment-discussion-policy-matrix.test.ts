import {describe,expect,it} from "vitest";
import {learnerAssignmentPublishedGradeLabel} from "@/modules/courses/learner-assignment-grade-label-model";
import {learnerCourseResultSummary} from "@/modules/courses/learner-course-result-summary-model";
import {learnerAssessmentPageSummary} from "@/modules/courses/learner-assessment-page-summary-model";
import {learnerAssessmentQuickCounts} from "@/modules/courses/learner-assessment-quick-counts-model";
import {learnerDueSoonNotices} from "@/modules/courses/learner-assignment-due-notice-model";
import {learnerAssignmentFinalConfirmation} from "@/modules/courses/learner-assignment-confirmation-model";
import {learnerDiscussionDraftValid} from "@/modules/courses/learner-discussion-message-limit-model";
import {learnerDiscussionMayPost} from "@/modules/courses/learner-discussion-submit-guard-model";
import {learnerDiscussionListResponse} from "@/modules/courses/learner-discussion-response-model";
import {formatDiscussionReply} from "@/modules/courses/learner-discussion-reply-model";

const now=new Date("2099-01-01T12:00:00Z");

describe("COURSES-LEARNER-ASSESSMENTS-02 assignment display and deadline trust boundary",()=>{
 it("does not report corrupt, missing, negative or nonfinite published assignment marks",()=>{
  expect(learnerAssignmentPublishedGradeLabel(0,10)).toBe("Graded · 0/10");
  expect(learnerAssignmentPublishedGradeLabel(8,10)).toBe("Graded · 8/10");
  for(const [points,max] of [[null,10],[Number.NaN,10],
   [Number.POSITIVE_INFINITY,10],[-2,10],[2,-1],[2,Number.NaN]] as const)
   expect(learnerAssignmentPublishedGradeLabel(points,max)).toBe("Graded · score unavailable");
 });
 it("handles invalid numerical page metadata without ever rendering NaN or Infinity",()=>{
  expect(learnerCourseResultSummary(5,10,20)).toBe("Showing 10 of 20 records · 5 currently displayed");
  expect(learnerCourseResultSummary(Number.NaN,Number.POSITIVE_INFINITY,3))
    .toBe("Showing 0 of 3 records · 0 currently displayed");
  expect(learnerCourseResultSummary(10,10,Number.NaN))
    .toBe("Showing 0 of 0 records · 0 currently displayed");
  expect(learnerAssessmentPageSummary({
   filteredCount:0,totalCount:Number.NaN,currentPage:Number.POSITIVE_INFINITY,
   pageSize:Number.NaN,label:"assignments",
  })).toBe("Showing 0–0 of 0 matching assignments (0 published in total).");
  expect(learnerAssessmentPageSummary({
   filteredCount:41,totalCount:50,currentPage:3,pageSize:20,label:"quizzes",
  })).toBe("Showing 41–41 of 41 matching quizzes (50 published in total). Page 3 of 3.");
 });
 it("deduplicates due notices within the authorized delivery, excluding submitted and expired rows",()=>{
  const before=new Date(now.getTime()-1000);
  const soon=new Date(now.getTime()+60*60*1000);
  const later=new Date(now.getTime()+72*60*60*1000);
  const rows=[
   {id:"same",title:"Assignment",deliveryId:"section-a",dueAt:soon,submissionId:null},
   {id:"same",title:"Assignment",deliveryId:"section-a",dueAt:soon,submissionId:null},
   {id:"same",title:"Assignment",deliveryId:"section-b",dueAt:soon,submissionId:null},
   {id:"submitted",title:"Submitted",deliveryId:"section-a",dueAt:soon,submissionId:"submission"},
   {id:"expired",title:"Expired",deliveryId:"section-a",dueAt:before,submissionId:null},
   {id:"later",title:"Later",deliveryId:"section-a",dueAt:later,submissionId:null},
  ];
  const notices=learnerDueSoonNotices(rows,now);
  expect(notices).toHaveLength(2);
  expect(notices.map(x=>x.key)).toEqual(["same:section-a","same:section-b"]);
  expect(learnerDueSoonNotices(rows,now,-1)).toEqual([]);
  expect(learnerDueSoonNotices(rows,new Date("bad"))).toEqual([]);
  expect(learnerAssignmentFinalConfirmation("TEXT")).toContain("cannot replace it");
  expect(learnerAssignmentFinalConfirmation("LINK")).toContain("HTTPS link");
 });
 it("uses one persisted-state filter policy for assessment quick counts",()=>{
  const counts=learnerAssessmentQuickCounts([],now.getTime());
  expect(counts.map(x=>x.value)).toEqual(["PENDING","DUE_SOON","OVERDUE","RESULTS"]);
  expect(counts.every(x=>x.count===0)).toBe(true);
 });
});

describe("COURSES-LEARNER-DISCUSSIONS-02 learner discussion draft and scoped response",()=>{
 it("rejects empty, oversized or double-submitted drafts regardless of click/keyboard origin",()=>{
  expect(learnerDiscussionDraftValid(" Hi ")).toBe(true);
  expect(learnerDiscussionDraftValid(" ".repeat(20))).toBe(false);
  expect(learnerDiscussionDraftValid("x".repeat(3900))).toBe(true);
  expect(learnerDiscussionDraftValid("x".repeat(3901))).toBe(false);
  expect(learnerDiscussionMayPost("hello",true,false)).toBe(true);
  expect(learnerDiscussionMayPost("hello",false,false)).toBe(false);
  expect(learnerDiscussionMayPost("hello",true,true)).toBe(false);
  expect(learnerDiscussionMayPost("  ",true,false)).toBe(false);
 });
 it("retains pinned messages and paging cursor only from the caller-authorized service response",()=>{
  const result={accessMode:"READ_ONLY",canPost:false,messages:[{id:"m1"}],
   highlightedPinned:[{id:"p1"}],nextCursor:"page-2",privateAudit:"do not reveal"};
  expect(learnerDiscussionListResponse(result)).toEqual({
   accessMode:"READ_ONLY",canPost:false,messages:[{id:"m1"}],
   highlightedPinned:[{id:"p1"}],nextCursor:"page-2",
  });
  expect(formatDiscussionReply("Hello",null)).toBe("Hello");
  expect(formatDiscussionReply("Hello","12345678-aaaa")).toBe("↳ Reply to 12345678: Hello");
 });
});
