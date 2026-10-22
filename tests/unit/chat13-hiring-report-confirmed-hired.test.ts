import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("SA-HIRING-LEDGER-14 count real joined students in Super Admin hiring analytics",()=>{
 it("uses accepted offers and confirmed joining rather than mutable stage HIRED",()=>{
   const source=readFileSync("src/modules/admin-ui/super-admin-hiring-report-service.ts","utf8");
   const evidence=source.slice(source.indexOf("const verifiedJoined=sql<boolean>"),source.indexOf("const tally="));
   const hired=source.slice(source.indexOf("hired:sql<number>"),source.indexOf("rejected:tally("));
   expect(evidence).toContain("exists (");
   expect(evidence).toContain("from ${placementOffers}");
   expect(evidence).toContain("inner join ${placementJoiningOutcomes}");
   expect(evidence).toContain("${placementOffers.status} = 'ACCEPTED'");
   expect(evidence).toContain("${placementJoiningOutcomes.status} = 'JOINED'");
   expect(evidence).toContain("${placementOffers.applicationId} = ${placementApplications.id}");
   expect(hired).toContain("count(distinct ${placementApplications.id})");
   expect(hired).toContain("${placementApplications.status} = 'SUBMITTED'");
   expect(hired).toContain("and ${verifiedJoined}");
   expect(hired).not.toContain('tally("HIRED")');
 });
 it("retains selected tenant and scoped application membership pairing including on date-filtered reports",()=>{
   const source=readFileSync("src/modules/admin-ui/super-admin-hiring-report-service.ts","utf8");
   expect(source).toContain('if(!isSuperAdmin(context))throw new AuthorizationError("placements.read")');
   expect(source).toContain("if(!selected.collegeId&&!selected.organizationId)");
   expect(source).toContain('requirePermission(context,"placements.read"');
   expect(source).toContain("selected.collegeId?eq(colleges.id,selected.collegeId):undefined");
   expect(source).toContain("selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined");
   expect(source).toContain("eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)");
   expect(source).toContain("eq(collegeMemberships.collegeId,placementJobs.collegeId)");
   expect(source).toContain("applicationFilters,");
   expect(source).toContain("SUP ER_ADMIN_HIRING_EXPORT_CAP".replace("SUP ER","SUPER"));
 });
});
