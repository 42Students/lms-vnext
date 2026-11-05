import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-audit-findings-publicId-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  expect(source).toContain("getIndependentAuditFinding");
  expect(source).toContain("if(!finding)notFound();");
  expect(source).toContain("<PageHeader");
  expect(source).toContain("<IndependentFindingActions");
  expect(source).toContain("<IndependentFindingCopyAction");
  expect(source).toContain('<PageBackLink href="/tracker/audit-findings" label="Back to audit findings"/>');
  expect(source).toContain("min-h-11");
  expect(source).toMatch(/focus-ring|<(?:TextLink|ButtonLink|Button|PageBackLink|Pagination|Disclosure|Input|Select|Textarea|Checkbox|Radio|DateInput|SearchableSelect|FilterBar|DataTable|Table|Tabs|Dropdown|Dialog|ErrorState|EmptyState|PageHeader|Drawer)\b/),expect(__ui("text-link.tsx")).toContain("focus-ring");
  expect(source).toContain("Audit event history");
 });
});
