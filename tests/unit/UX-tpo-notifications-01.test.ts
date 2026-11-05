import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/notifications/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-notifications-01 /tpo/notifications",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).toMatch(/text-primary-text|<(?:TextLink|ButtonLink|Pagination|PageBackLink|Disclosure|Tabs)\b/),expect(__ui("text-link.tsx")).toContain("--lms-link-text");
    expect(source).toMatch(/focus-ring|<(?:TextLink|ButtonLink|Button|PageBackLink|Pagination|Disclosure|Input|Select|Textarea|Checkbox|Radio|DateInput|SearchableSelect|FilterBar|DataTable|Table|Tabs|Dropdown|Dialog|ErrorState|EmptyState|PageHeader|Drawer)\b/),expect(__ui("text-link.tsx")).toContain("focus-ring");
    expect(source).not.toContain("text-on-primary");
    // 44px on touch screens; legacy 36px controls are allowed only above
    // the tablet breakpoint and must not reduce the phone hit target.
    expect(source).toContain("min-h-11");
    expect(source.replaceAll("md:min-h-9","").replaceAll("md:min-h-9",""))
      .not.toMatch(/\bmin-h-(?:9|10)\b/);
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
