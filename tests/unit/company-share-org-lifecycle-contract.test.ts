import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("requires both college and organization ACTIVE before anonymous applicant reads",()=>{
 const source=readFileSync(join(process.cwd(),"src/modules/placements/company-share/public-service.ts"),"utf8");
 expect(source).toContain('eq(colleges.status,"ACTIVE")');
 expect(source).toContain('eq(organizations.status,"ACTIVE")');
 expect(source).toContain('eq(organizations.id,colleges.organizationId)');
});
