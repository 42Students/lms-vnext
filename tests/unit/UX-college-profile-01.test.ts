import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/profile/page.tsx"),"utf8");
describe("/college/profile UX",()=>{
 it("UX-college-profile-01 keeps audited user-visible behavior",()=>expect(source).toContain("focus-visible:outline-2"));
 it("UX-college-profile-02 keeps audited user-visible behavior",()=>expect(source).toContain('failed={profileResult.status==="rejected"}'));
});
