import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("TPO-students-22 preserves skill-name while drilling to a journey or downloading scoped CSV",()=>{
 const page=readFileSync(new URL("../../src/app/(authenticated)/tpo/students/page.tsx",import.meta.url),"utf8");
 expect(page).toContain("skillName:filters.skillName??query.skillName");
 expect(page).toContain("skillName:query.skillName");
 expect(page).toContain('name="skillName"');
});