import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-tenants-modules-20 clears any former primary before promoting managed address",()=>{
 const source=readFileSync(new URL("../../src/modules/tenant-domains/managed-subdomain-service.ts",import.meta.url),"utf8");
 const retire=source.indexOf("if(current){",source.indexOf("if(host){"));
 const promote=source.indexOf("if(host){",retire);
 const block=source.slice(retire,source.indexOf("await tx.insert(activityEvents)",promote));
 expect(retire).toBeGreaterThan(-1);
 expect(promote).toBeGreaterThan(retire);
 expect(block).toContain("eq(tenantDomains.isPrimary,true)");
 expect(block.indexOf("isPrimary:false")).toBeLessThan(block.lastIndexOf("isPrimary:true"));
 expect(source).toContain("getDb().transaction(async tx=>");
});
