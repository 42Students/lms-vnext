import {expect,it} from "vitest";
import {learnerNoticeRecoveryHref} from "@/modules/placements/learner-notice-deep-link-model";
it("removes restrictive notice filters but retains only a valid link identifier",()=>{
 const id="00000000-0000-4000-8000-000000000011";
 expect(learnerNoticeRecoveryHref(id)).toBe("/learn/my-placements/announcements?focus="+id);
 expect(learnerNoticeRecoveryHref(["bad",id])).toBe("/learn/my-placements/announcements");
 expect(learnerNoticeRecoveryHref("../../admin")).toBe("/learn/my-placements/announcements");
});
