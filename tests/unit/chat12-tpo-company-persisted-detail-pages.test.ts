import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const routes=[
 ["[companyId]/page.tsx","getTpoCompanyDetailReadOnly("],
 ["[companyId]/contact-log/page.tsx","getTpoCompanyContactLog("],
 ["[companyId]/feedback/page.tsx","getTpoCompanyFeedback("],
 ["[companyId]/manage/page.tsx","getTpoCompanyLifecycle("],
 ["[companyId]/people/page.tsx","listTpoCompanyPeople("],
 ["archived/page.tsx","listArchivedTpoCompanyRelationships("],
] as const;
describe("TPO-BREAK-company-detail-pages-11 persistent-role defense for legacy detail routes",()=>{
 for(const [relativePath,serviceCall] of routes){
  it(`checks persisted actor before resolving ${relativePath}`,()=>{
   const source=readFileSync(resolve(process.cwd(),
    "src/app/(authenticated)/tpo/companies/"+relativePath),"utf8");
   const actor=source.indexOf("await requireTpoBatchActor(context)");
   expect(actor).toBeGreaterThanOrEqual(0);
   const use=source.lastIndexOf(serviceCall);
   expect(use).toBeGreaterThan(actor);
   const context=source.indexOf("const context = await getCurrentRequestContext();");
   expect(context).toBeGreaterThanOrEqual(0);
   expect(actor).toBeGreaterThan(context);
  });
 }
});
