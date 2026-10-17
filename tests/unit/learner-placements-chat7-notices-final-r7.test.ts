import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {learnerNoticeRelativeDay} from "@/modules/placements/learner-dashboard-college-notices-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("learner notices and requests round-seven",()=>{
it("LEARNER-placements-09 preserves persisted truth and legacy controls",()=>{const s=read("src/app/(authenticated)/learn/my-placements/page.tsx");for(const p of ["Latest from the placement cell","notice.message","learnerNoticeRelativeDay(notice.createdAt","learnerNoticeRelativeDay(alert.createdAt","Personal placement updates are temporarily unavailable"])expect(s).toContain(p);expect(learnerNoticeRelativeDay("2026-10-17T00:00:00Z",new Date("2026-10-17T01:00:00Z"))).toBe("Today");expect(learnerNoticeRelativeDay("invalid",new Date())).toBe("Date unavailable");});
it("LEARNER-placements-54 preserves persisted truth and legacy controls",()=>{const s=read("src/components/placements/learner-placement-requests.tsx");for(const p of ["Waiting for the placement cell","Not approved","Tell the placement cell why","Discard this unsent placement request?","requestRelativeTime(item.requestedAt)","Sent to the placement cell"])expect(s).toContain(p);});
});
