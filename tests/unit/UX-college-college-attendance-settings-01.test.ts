import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/attendance/settings/page.tsx"),"utf8");
it("UX-college-college-attendance-settings-01 preserves state and mobile layout",()=>{
 expect(route).toContain('className="min-w-0');
 expect(route).toContain("CollegeAttendancePolicyForm");
 expect(route).toContain("PageHeader");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
