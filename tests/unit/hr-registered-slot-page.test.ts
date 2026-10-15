import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("shows the registered interview-slot workspace rather than a staged migration gate",()=>{
 const page=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx","utf8");
 expect(page).toContain("slots.items.map");
 expect(page).toContain("listHrInterviewSlots(context,jobId)");
 expect(page).not.toContain("NOT_REGISTERED");
 expect(page).not.toContain("migration is staged");
});
