import {expect,it} from "vitest";
import {readLearnerNoticeFilters} from "@/modules/placements/learner-notices-query-model";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
it("a placement-cell shortcut selects the persisted TPO author, not a new unregistered notice source",()=>{
 const href=learnerNoticeFilterHref({pinned:false,unread:false,recent:false,q:"",source:"placement-cell"});
 expect(href).toBe("/learn/my-placements/announcements?source=placement-cell");
 expect(readLearnerNoticeFilters(Object.fromEntries(new URL(href,"https://test.local").searchParams)).source).toBe("placement-cell");
});
