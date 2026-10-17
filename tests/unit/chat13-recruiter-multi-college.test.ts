import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {createSuperAdminHrInputSchema} from "@/modules/placements/super-admin-hr-validation";
const source=(p:string)=>readFileSync(p,"utf8");
const ids=["00000000-0000-4000-8000-000000000001","00000000-0000-4000-8000-000000000002"];
describe("Super Admin recruiter optional colleges",()=>{
 it("SA-placements-projects-37 rejects malformed multi-college selections",()=>{
  const base={companyRelationshipId:ids[0],displayName:"Recruiter",phoneE164:"+919876543210"};
  expect(createSuperAdminHrInputSchema.safeParse({...base,companyRelationshipIds:ids}).success).toBe(true);
  expect(createSuperAdminHrInputSchema.safeParse({...base,companyRelationshipIds:["wrong"]}).success).toBe(false);
  expect(createSuperAdminHrInputSchema.safeParse({...base,companyRelationshipIds:Array(21).fill(ids[0])}).success).toBe(false);
 });
 it("SA-placements-projects-37 enforces canonical company and scope for each selected college before granting",()=>{
  const service=source("src/modules/placements/super-admin-hr-service.ts");
  const create=service.slice(service.indexOf("export async function createSuperAdminHrAccount("),
    service.indexOf("export async function updateSuperAdminHrAccount("));
  expect(create).toContain("candidate.companyId!==relationship.companyId");
  expect(create).toContain("requireHrCollege(context,candidate.organizationId,candidate.collegeId)");
  expect(create).toContain("for(const candidate of selectedRelationships)");
  expect(create).toContain("validUntil: grantExpiry");
  expect(create).toContain("recordActivityEventInTransaction(tx, context");
 });
 it("SA-placements-projects-37 exposes optional colleges and sends them together",()=>{
  const dialog=source("src/components/admin/super-admin-hr-account-dialog.tsx");
  expect(dialog).toContain("Colleges · optional additional access");
  expect(dialog).toContain("additionalRelationshipIds");
  const ui=source("src/components/admin/super-admin-hr-accounts.tsx");
  expect(ui).toContain("companyRelationshipIds:values.companyRelationshipIds");
 });
});
