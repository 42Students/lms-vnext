import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/companies/[companyId]/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-companies-companyid-01 /tpo/companies/[companyId]",()=>{
  it("preserves legacy UI and signed-off phone and contrast contracts",()=>{
    expect(source).not.toContain("text-[#26bac7]");
    expect(source).toMatch(/bg-primary|<(?:ButtonLink|Button)\b/),expect(__ui("button.tsx")).toContain("--lms-button-primary");
    expect(source).toMatch(/text-on-primary|<(?:ButtonLink|Button)\b/),expect(__ui("button.tsx")).toContain("--lms-on-primary");
    // Desktop controls may use their legacy 36/40px heights; mobile controls must be at least 44px.
    expect(source).not.toMatch(/(?<![a-z:-])min-h-(?:9|10)\b/);
    expect(source).toContain("min-h-11");
    expect(source).toMatch(/<PageHeader\b|<h1\b|redirect\(/);
  });
});
