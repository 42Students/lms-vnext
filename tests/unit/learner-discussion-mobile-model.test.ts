import {describe,expect,it} from "vitest";
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
it("shows jump only when scrolled away and no unread counter button is present",()=>{
expect(learnerDiscussionMobileJumpVisible(false,0,5)).toBe(true);
expect(learnerDiscussionMobileJumpVisible(false,2,5)).toBe(false);
expect(learnerDiscussionMobileJumpVisible(true,0,5)).toBe(false);
});
});