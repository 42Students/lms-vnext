import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-placements-jobs-jobid-01 /tpo/placements/jobs/[jobId]",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-[#26bac7]");
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain("min-h-11");
    expect(source).toMatch(/md:min-h-9|<(?:TextLink|ButtonLink|Button|PageBackLink|Pagination|Disclosure|Input|Select|Textarea|Checkbox|Radio|DateInput|SearchableSelect|FilterBar|DataTable|Table|Tabs|Dropdown|Dialog|ErrorState|EmptyState|PageHeader|Drawer)\b/),expect(__ui("button.tsx")).toContain("--lms-control-height");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
