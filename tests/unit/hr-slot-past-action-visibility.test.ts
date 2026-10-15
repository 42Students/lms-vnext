import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("computes slot action eligibility on the server before rendering",()=>{
 const service=readFileSync("src/modules/placements/hr-interview-slot-service.ts","utf8");
 const page=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx","utf8");
 expect(service).toContain("row.startAt>now");
 expect(service).toContain("isOwn:canRecruiterMutateOwnSlot");
 expect(page).toContain("slot.canEdit?");
 expect(page).toContain("has started or passed");
});
