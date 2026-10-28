import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {shouldSendLearnerDiscussionOnEnter,learnerDiscussionMobileJumpVisible}
from "@/components/courses/learner-discussion-mobile-model";
describe("discussion mobile keyboard and scroll behavior",()=>{
it("requires explicit Post on touch instead of stealing Enter",()=>{
expect(shouldSendLearnerDiscussionOnEnter({key:"Enter",shiftKey:false,
isComposing:false,coarsePointer:true})).toBe(false);
expect(shouldSendLearnerDiscussionOnEnter({key:"Enter",shiftKey:false,
isComposing:false,coarsePointer:false})).toBe(true);
expect(shouldSendLearnerDiscussionOnEnter({key:"Enter",shiftKey:true,
isComposing:false,coarsePointer:false})).toBe(false);
expect(shouldSendLearnerDiscussionOnEnter({key:"Enter",shiftKey:false,
isComposing:true,coarsePointer:false})).toBe(false);
});
it("wires the actual pointer mode into the composer instead of desktop-only Enter",()=>{
 const code=readFileSync("src/components/courses/learner-course-discussion.tsx","utf8");
 expect(code).not.toContain("coarsePointer:false,");
 expect(code).toContain('window.matchMedia?.("(pointer: coarse)").matches??coarsePointer');
 expect(code).toContain('media.addEventListener?.("change",update)');
 expect(code).toContain("Press Send to post · Enter for a new line");
});
it("shows jump only when scrolled away and no unread counter button is present",()=>{
expect(learnerDiscussionMobileJumpVisible(false,0,5)).toBe(true);
expect(learnerDiscussionMobileJumpVisible(false,2,5)).toBe(false);
expect(learnerDiscussionMobileJumpVisible(true,0,5)).toBe(false);
});
});