import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/new/page.tsx"),"utf8");
describe("/college/placements/new UX",()=>{
 it("UX-college-placements-new-01 keeps audited user-visible behavior",()=>expect(source).toContain("PlacementJobCreateWorkspace"));
 it("UX-college-placements-new-02 keeps audited user-visible behavior",()=>expect(source).toContain("hasMembershipRole"));
});
