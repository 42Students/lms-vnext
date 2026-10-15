import {describe,it,expect,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
vi.mock("next/navigation",()=>({
 useRouter:()=>({replace:vi.fn()}),
 usePathname:()=>"/tpo/students",
 useSearchParams:()=>new URLSearchParams(),
}));
import {TpoSpreadsheetGrid} from "@/components/tpo/tpo-spreadsheet-grid";
describe("TPO accessible spreadsheet records",()=>{
 it("labels the table and never displays export-only fields",()=>{
  const html=renderToStaticMarkup(createElement(TpoSpreadsheetGrid,{
   rows:[{id:"a",name:"Asha",privateEmail:"secret@example.com"}],
   columns:[{key:"name",label:"Learner",read:(row:{name:string})=>row.name},
    {key:"email",label:"Email for export",read:(row:{privateEmail:string})=>row.privateEmail,exportOnly:true}],
   rowKey:(row:{id:string})=>row.id,
  }));
  expect(html).toMatch(/<caption[^>]*>Current page TPO spreadsheet records<\/caption>/);
  expect(html).toMatch(/<ul[^>]*aria-label="Current page TPO spreadsheet records"/);
  expect(html).toContain("Asha");
  expect(html).not.toContain("secret@example.com");
  expect(html).not.toContain("Email for export");
 });
});
