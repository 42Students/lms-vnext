import {expect,it} from "vitest";
import {learnerNoticeHref} from "@/modules/placements/learner-notice-deep-link-model";
it("provides a scoped notice-detail URL only for a valid preview notice id",()=>{
 const id="00000000-0000-4000-8000-123456789abc";
 expect(learnerNoticeHref(id)).toBe("/learn/my-placements/announcements?focus="+id+"#notice-"+id);
 expect(learnerNoticeHref("/admin/users")).toBeNull();
});
