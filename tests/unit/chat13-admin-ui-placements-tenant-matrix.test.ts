import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const root="src/modules/admin-ui/";
const read=(name:string)=>readFileSync(root+name,"utf8");

const selectedCollegeDirectories=[
 "super-admin-placement-applications-service.ts",
 "super-admin-placement-hiring-service.ts",
 "super-admin-placement-interviews-service.ts",
 "super-admin-placement-job-settings-service.ts",
 "super-admin-placement-joining-service.ts",
 "super-admin-placement-offers-service.ts",
 "super-admin-placement-screenings-service.ts",
 "super-admin-placement-seasons-service.ts",
 "super-admin-placement-shortlisted-service.ts",
 "super-admin-hiring-report-service.ts",
 "super-admin-hiring-report-filters-service.ts",
] as const;

describe("SA-ADMIN-PLACEMENT-SERVICE-MATRIX-01 all Super Admin placement directories respect selected college",()=>{
 for(const file of selectedCollegeDirectories){
  it("checks the role and scoped college before querying "+file,()=>{
   const s=read(file);
   expect(s).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
   expect(s).toContain("getDb()");
   expect(s).toContain("selected.collegeId".replace("selected",s.includes("selected.collegeId")?"selected":"scope").replace("scope",s.includes("scope.collegeId")?"scope":"selected"));
  });
 }
 it("SA-ADMIN-PLACEMENT-SERVICE-MATRIX-02 audits the edge services' own authentication gates",()=>{
  const retention=read("super-admin-placement-retention-service.ts");
  const csv=read("super-admin-scoped-csv-service.ts");
  expect(retention).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
  expect(retention).toContain("eq(collegeMemberships.collegeId,selected.collegeId)");
  expect(retention).toContain(".limit(201)");
  expect(csv).toContain("getCurrentRequestContext()");
  expect(csv).toContain("config.loader(context,");
  expect(csv).toContain("pageSize:SUPER_ADMIN_READ_PAGE_SIZE");
  expect(csv).toContain('"Cache-Control":"private, no-store"');
  expect(csv).toContain("SUPER_ADMIN_SCOPED_CSV_CAP");
 });
 it("SA-ADMIN-PLACEMENT-SERVICE-MATRIX-03 central filters never silently include an unrelated candidate",()=>{
  const sources=[
    "super-admin-placement-applications-service.ts",
    "super-admin-placement-joining-service.ts",
    "super-admin-placement-offers-service.ts",
    "super-admin-placement-screenings-service.ts",
    "super-admin-placement-shortlisted-service.ts",
  ];
  for(const file of sources){
   const s=read(file);
   expect(s,file).toContain("eq(collegeMemberships.collegeId,");
   expect(s,file).toContain("eq(placementJobs.collegeId,");
   expect(s,file).toContain("getCurrentRequestContext".replace("getCurrentRequestContext",
      'requireSuperAdminSelectedCollege(context,"placements.read")'));
  }
  const hiring=read("super-admin-placement-hiring-service.ts");
  expect(hiring).toContain("count(${collegeMemberships.id})");
  expect(hiring).not.toContain("count(${placementApplications.id})");
  const report=read("super-admin-hiring-report-service.ts");
  expect(report).toContain("exists(db.select({id:collegeMemberships.id}).from(collegeMemberships)");
 });
});
