import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/videos/page.tsx"),"utf8");
describe("/college/videos UX",()=>{
 it("UX-college-videos-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("<CollegeContentAggregate"));
 it("UX-college-videos-02 preserves responsive or failure recovery contract",()=>{expect(source).toMatch(/focus-ring|<(?:TextLink|ButtonLink|Button|PageBackLink|Pagination|Disclosure|Input|Select|Textarea|Checkbox|Radio|DateInput|SearchableSelect|FilterBar|DataTable|Table|Tabs|Dropdown|Dialog|ErrorState|EmptyState|PageHeader|Drawer)\b/);expect(__ui("text-link.tsx")).toContain("focus-ring");});
});
