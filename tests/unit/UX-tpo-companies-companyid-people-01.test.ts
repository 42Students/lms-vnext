import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-companyid-people-01 /tpo/companies/[companyId]/people",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-[#26bac7]");
    expect(source).not.toContain("text-on-primary");
    expect(source).toContain("min-h-11");
    expect(source).toContain("md:min-h-9");
    expect(source).toMatch(/focus-ring|<(?:TextLink|ButtonLink|Button|PageBackLink|Pagination|Disclosure|Input|Select|Textarea|Checkbox|Radio|DateInput|SearchableSelect|FilterBar|DataTable|Table|Tabs|Dropdown|Dialog|ErrorState|EmptyState|PageHeader|Drawer)\b/),expect(__ui("text-link.tsx")).toContain("focus-ring");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
