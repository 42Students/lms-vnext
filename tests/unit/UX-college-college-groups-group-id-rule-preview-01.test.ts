import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx"),"utf8");
it("UX-college-college-groups-group-id-rule-preview-01 keeps accessible shared screen state",()=>{
 expect(route).toContain('className="min-w-0');
 expect(route).toContain('title="Rule preview"');
 expect(route).toContain('COLLEGE_RULE_NOT_CONFIGURED_STATE');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
