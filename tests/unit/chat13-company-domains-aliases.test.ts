import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {normalizeCompanyDomain,normalizeCompanyAlias,
 companyDomainCommandSchema,companyAliasCommandSchema} from "@/modules/placements/super-admin-company-identities-model";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Global company domain and other-name curation",()=>{
 it("SA-placements-projects-27 normalizes email domains, rejects personal, college and malformed hosts",()=>{
  expect(normalizeCompanyDomain("Hiring@Example.COM")).toBe("example.com");
  expect(()=>normalizeCompanyDomain("member@gmail.com")).toThrow();
  expect(()=>normalizeCompanyDomain("university.ac.in")).toThrow();
  expect(companyDomainCommandSchema.safeParse({companyId:"bad",domain:"foo.com",action:"ADD"}).success).toBe(false);
  const code=read("src/modules/placements/super-admin-company-identities-service.ts");
  expect(code).toContain("Keep at least one company domain.");
  expect(code).toContain("Domain belongs to another company.");
  expect(code).toContain("tenantDomains.host");
 });
 it("SA-placements-projects-28 enforces canonical alias collision checks and name search",()=>{
  expect(normalizeCompanyAlias("  T C S  ")).toBe("T C S");
  expect(companyAliasCommandSchema.safeParse({companyId:"bad",alias:"TCS",action:"ADD"}).success).toBe(false);
  const code=read("src/modules/placements/super-admin-company-identities-service.ts");
  expect(code).toContain("Other name conflicts with another company.");
  expect(code).toContain("Other name is already registered to another company.");
  const directory=read("src/modules/placements/admin-company-directory-service.ts");
  expect(directory).toContain("placementCompanyAliases.alias");
 });
 it("SA-placements-projects-28 includes aliases in TPO employer suggestion matching",()=>{
  const ui=read("src/components/placements/placement-job-create-form.tsx");
  expect(ui).toContain("company.otherNames?.some");
  expect(ui).toContain("company.domains?.some");
  const workspace=read("src/components/placements/placement-job-create-workspace.tsx");
  expect(workspace).toContain("otherNames:company.otherNames");
  expect(workspace).toContain("domains:company.domains");
  expect(read("src/modules/placements/company-service.ts")).toContain("otherNames:");
 });
});
