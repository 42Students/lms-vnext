import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("keeps same-origin checks, validation and conflict responses without obsolete migration gate",()=>{
 const code=readFileSync("src/app/api/placements/recruiter/drives/[jobId]/interview-slots/route.ts","utf8");
 expect(code).toContain("isSameOriginRequest(request)");
 expect(code).toContain("writeHrInterviewSlot(");
 expect(code).toContain("SLOT_STALE");
 expect(code).not.toContain("SLOT_STORAGE_NOT_REGISTERED");
});
