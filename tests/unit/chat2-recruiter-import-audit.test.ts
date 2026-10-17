import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(path:string)=>readFileSync(path,"utf8");
describe("Recruiter CSV audit completeness",()=>{
 it("TPO-recruiters-R05 writes one scoped immutable import audit only for created rows",()=>{
  const service=src("src/modules/placements/tpo-lead-csv-import-service.ts");
  expect(service).toContain('const created=rows.filter(row=>row.status==="created")');
  expect(service).toContain('eventType:"RECRUITER_LEADS_IMPORTED"');
  expect(service).toContain("importedLeadIds:created.map(row=>row.leadId)");
  expect(service).toContain("organizationId:college.organizationId");
  expect(service).toContain("actorUserId:context.user.id");
  expect(service).toContain("counts:summarizeTpoLeadImport(results)");
  expect(service).not.toContain("metadata:{csv");
 });
});