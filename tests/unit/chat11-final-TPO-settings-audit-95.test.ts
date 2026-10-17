import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {tpoAuditEntityHref} from "@/modules/placements/tpo-audit-entity-link-model";
const id="11111111-1111-4111-8111-111111111111";
describe("TPO audit entity navigation",()=>{
 it("TPO-settings-audit-95 links only allowlisted canonical resources and never interpolates unsafe subjects",()=>{
  expect(tpoAuditEntityHref("placement_job",id)).toBe("/tpo/placements/jobs/"+id);
  expect(tpoAuditEntityHref("placement_recruiter_lead",id)).toBe("/tpo/recruiters/"+id);
  expect(tpoAuditEntityHref("placement_company",id)).toBe("/tpo/companies/"+id);
  expect(tpoAuditEntityHref("user",id)).toBeNull();
  expect(tpoAuditEntityHref("placement_job","../../logout")).toBeNull();
  expect(tpoAuditEntityHref("placement_job","anything")).toBeNull();
 });
 it("TPO-settings-audit-95 retains scoped audit source subject and only projects validated links",()=>{
  const svc=readFileSync("src/modules/placements/tpo-audit-service.ts","utf8");
  const ui=readFileSync("src/components/tpo/tpo-audit-grid.tsx","utf8");
  expect(svc).toContain("ae.subject_type::text as subject_type");
  expect(svc).toContain("ae.subject_id::text as subject_id");
  expect(svc).toContain("tpoAuditEntityHref(row.subjectType,row.subjectId)");
  expect(svc).toContain("requirePlacementManageScope(");
  expect(ui).toContain("row.entityHref?");
  expect(ui).toContain('href={row.entityHref}');
  expect(ui).toContain("Open item →");
 });
});
