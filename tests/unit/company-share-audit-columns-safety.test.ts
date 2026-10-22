import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("public share service selects only preview-approved candidate identity fields",()=>{
 const s=readFileSync(join(process.cwd(),"src/modules/placements/company-share/public-service.ts"),"utf8");
 // Private source fields are queried only after token, college, current shortlist
 // and share-column permission checks. Output is filtered by saved columns.
 expect(s).toContain("const selectedColumns=safeCompanyShareColumns(grant.selectedColumns)");
 expect(s).toContain("projectCompanyShareRows(visibleRecords,selectedColumns)");
 expect(s).toContain("companyShareTokenSchema.safeParse(token)");
 expect(s).toContain("eq(collegeMemberships.collegeId,grant.collegeId)");
 expect(s).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
 expect(s).toContain("applicationId:placementApplications.id");
 expect(s).toContain("displayName:users.displayName");
 expect(s).toContain("email:users.email");
 expect(s).not.toContain("resumeUrl:");
 const projection=readFileSync(join(process.cwd(),"src/modules/placements/company-share/column-model.ts"),"utf8");
 expect(projection).toContain("safeCompanyShareColumns(rawColumns)");
 expect(projection).toContain("Object.fromEntries(columns.map(key=>[key,values[key]]))");
 expect(projection).toContain('email:columns.includes("EMAIL")?row.email:null');
 expect(projection).toContain("RESUME:null");
});
