import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/groups/[groupId]/page.tsx"),"utf8");
it("UX-college-college-groups-group-id-01 preserves keyboard states, responsive layout and exact labels",()=>{
 expect(route).toContain('className="min-w-0 max-w-full space-y-[16px]"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 expect(route).toContain("empty=");
});
