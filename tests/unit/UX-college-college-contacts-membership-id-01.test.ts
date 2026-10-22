import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/contacts/[membershipId]/page.tsx"),"utf8");
it("UX-college-college-contacts-membership-id-01 verifies scoped responsive details",()=>{
 expect(route).toContain("min-w-0 max-w-full");
 expect(route).toContain("[overflow-wrap:anywhere]");
 expect(route).toContain("getCollegeContactById(await getCurrentRequestContext(),membershipId)");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
