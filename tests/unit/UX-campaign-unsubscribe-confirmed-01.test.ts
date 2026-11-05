import { readFileSync as __uiRead } from "node:fs";
const __ui=(f:string)=>__uiRead("src/components/ui/"+f,"utf8");
const __fmt=()=>__uiRead("src/lib/format-date.ts","utf8");
import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("UX-campaign-unsubscribe-confirmed-01 final preference state",()=>{
 it("preserves exact separate placement-cell and global confirmation copy",()=>{
  const page=read("src/app/campaign-unsubscribe/confirmed/page.tsx");
  for(const text of ["You're unsubscribed","Email preference updated","This placement cell will not email you again.","Your address has been suppressed from campaign email.","Transactional account messages may use separate preferences.","Return home"]){
   expect(page).toContain(text);
  }
  expect(page).toContain('scope === "placement-cell"');
  expect(page).toContain("PageHeader");
  expect(page).toContain('<Card as="section"');
  expect(page).toContain('role="status"');
  expect(page).toContain('min-h-dvh');
  expect(page).toMatch(/focus-ring|<(?:TextLink|ButtonLink|Button|PageBackLink|Pagination|Disclosure|Input|Select|Textarea|Checkbox|Radio|DateInput|SearchableSelect|FilterBar|DataTable|Table|Tabs|Dropdown|Dialog|ErrorState|EmptyState|PageHeader|Drawer)\b/),expect(__ui("text-link.tsx")).toContain("focus-ring");
 });
 it("retains explicit loading and safe error states",()=>{
  expect(read("src/app/campaign-unsubscribe/confirmed/loading.tsx")).toContain("<GracefulPageLoading");
  expect(read("src/app/campaign-unsubscribe/confirmed/error.tsx")).toContain('homeHref="/"');
 });
});