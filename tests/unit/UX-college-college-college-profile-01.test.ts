import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/college-profile/page.tsx"),"utf8");
it("UX-college-college-college-profile-01 retains responsive forms, states and legacy copy",()=>{
 expect(route).toContain('min-w-0 max-w-full');
 expect(route).toContain("CollegeContactProfileForm");
 expect(route).not.toContain("text-on-primary");
 expect(route).toContain('href="/college/branding"');
 
});
