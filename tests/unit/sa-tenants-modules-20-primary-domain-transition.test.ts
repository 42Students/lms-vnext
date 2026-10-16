import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-tenants-modules-20 clears any former primary before promoting managed address",()=>{
 const source=readFileSync(new URL("../../src/modules/tenant-domains/managed-subdomain-service.ts",import.meta.url),"utf8");
 const pos=source.indexOf("if(current){",source.indexOf("if(host){"));
 const block=source.slice(pos,pos+700);
 expect(block).toContain("eq(tenantDomains.isPrimary,true)");
 expect(block.indexOf("isPrimary:false")).toBeLessThan(block.indexOf("isPrimary:true"));
 expect(source).toContain("getDb().transaction(async tx=>");
});
