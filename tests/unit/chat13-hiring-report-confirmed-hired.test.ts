import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("SA-HIRING-LEDGER-14 count real joined students in Super Admin hiring analytics",()=>{
 it("uses accepted offers and confirmed joining rather than mutable stage HIRED",()=>{
   const source=readFileSync("src/modules/admin-ui/super-admin-hiring-report-service.ts","utf8");
   const hired=source.slice(source.indexOf("hired:sql<number>"),source.indexOf("rejected:tally("));
   expect(hired).toContain("count(distinct ${placementApplications.id})");
   expect(hired).toContain("exists (");
   expect(hired).toContain("from ${placementOffers}");
   expect(hired).toContain("inner join ${placementJoiningOutcomes}");
   expect(hired).toContain("${placementOffers.status} = 'ACCEPTED'");
   expect(hired).toContain("${placementJoiningOutcomes.status} = 'JOINED'");
   expect(hired).toContain("${placementOffers.applicationId} = ${placementApplications.id}");
   expect(hired).toContain("${placementApplications.status} = 'SUBMITTED'");
   expect(hired).not.toContain('tally("HIRED")');
 });
 it("retains selected tenant and scoped application membership pairing including on date-filtered reports",()=>{
   const source=readFileSync("src/modules/admin-ui/super-admin-hiring-report-service.ts","utf8");
   expect(source).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
   expect(source).toContain("eq(placementJobs.collegeId,selected.collegeId)");
   expect(source).toContain("eq(placementCompanyRelationships.collegeId,selected.collegeId)");
   expect(source).toContain("eq(collegeMemberships.collegeId,selected.collegeId)");
   expect(source).toContain("applicationFilters,");
   expect(source).toContain("SUP ER_ADMIN_HIRING_EXPORT_CAP".replace("SUP ER","SUPER"));
 });
});
