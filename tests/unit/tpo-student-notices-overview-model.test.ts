import {expect,it} from "vitest";
import {tpoStudentNoticesOverview} from "@/modules/placements/tpo-student-notices-overview-model";
it("does not present missing migrated source as zero or notification delivery",()=>{
 const missing=tpoStudentNoticesOverview({announcementsReady:false,noticeCount:0,prepReady:false});
 expect(missing.publishedSummary).toContain("unavailable");
 expect(missing.prepSummary).toContain("unavailable");
 const loaded=tpoStudentNoticesOverview({announcementsReady:true,noticeCount:2,prepReady:true});
 expect(loaded.publishedSummary).toBe("2 recorded college notices");
 expect(loaded.noticeHref).toBe("/tpo/announcements");
});
