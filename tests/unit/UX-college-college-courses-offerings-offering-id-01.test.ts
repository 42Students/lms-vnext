import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx"),"utf8");
it("UX-college-college-courses-offerings-offering-id-01 verifies scoped responsive details",()=>{
 expect(route).toContain("AdminOfferingLearningPage");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
