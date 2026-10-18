import {describe,it,expect} from "vitest";
import {adminDriveDirectoryQuerySchema,adminDriveDirectoryHref,adminDriveStatus,filterAdminDriveDirectory} from "@/modules/placements/admin-drive-directory-model";
import {superAdminCollegeCompanyActionSchema} from "@/modules/placements/super-admin-college-company-action-model";
import {companyDomainCommandSchema,companyAliasCommandSchema,normalizeCompanyDomain,normalizeCompanyAlias} from "@/modules/placements/super-admin-company-identities-model";
import {companyGlobalVerificationSchema,canVerifyGlobalCompany} from "@/modules/placements/super-admin-company-verification-model";
import {superAdminHrLiteralSearchPattern} from "@/modules/placements/super-admin-hr-search-model";
import {parseSuperAdminHrPageParams} from "@/modules/placements/super-admin-hr-validation";
const uuid="550e8400-e29b-41d4-a716-446655440000";
const row=(id:string,title:string,status:string,company:string)=>({job:{id,title,status,applicationDeadline:null},company:{name:company}});
describe("chat-13 Super Admin placements: adversarial directory, company identity and HR filters",()=>{
 it("SA-ADMIN-DRIVE-01 rejects malicious pagination/status and never lets URL params escape query encoding",()=>{
  const baseline=adminDriveDirectoryQuerySchema.parse({});
  expect(baseline).toMatchObject({status:"ALL",q:"",page:1,pageSize:10});
  for(const raw of [{status:"ARCHIVED"},{status:"' OR 1=1--"},{page:0},{page:100001},{page:"NaN"},{pageSize:5},{pageSize:101},{q:"x".repeat(101)},{bogus:true}]){
   expect(adminDriveDirectoryQuerySchema.safeParse(raw).success,JSON.stringify(raw)).toBe(false);
  }
  const safe=adminDriveDirectoryQuerySchema.parse({q:"A & ? # /",status:"ACTIVE",page:"2",pageSize:"20"});
  const url=adminDriveDirectoryHref(safe);
  expect(url.startsWith("/admin/placements/drives?")).toBe(true);
  const parsed=new URL(url,"https://app.example");
  expect(parsed.searchParams.get("q")).toBe(safe.q);
  expect(parsed.searchParams.get("page")).toBe("2");
  expect(parsed.searchParams.get("pageSize")).toBe("20");
  expect(parsed.searchParams.get("status")).toBe("ACTIVE");
  expect(adminDriveDirectoryHref(baseline)).toBe("/admin/placements/drives");
 });
 it("SA-ADMIN-DRIVE-02 filters by actual published status, company and lowercases without changing input",()=>{
  const rows=[row("a","Developer","PUBLISHED","Acme"),row("b","Designer","DRAFT","Beta"),row("c","Engineer","CLOSED","Acme"),row("d","Analyst","CANCELLED","Another")];
  const baseline=rows.map(r=>({...r.job}));
  const result=filterAdminDriveDirectory(rows,adminDriveDirectoryQuerySchema.parse({status:"ACTIVE",q:"acME"}));
  expect(result.items.map(x=>x.job.id)).toEqual(["a"]);
  expect(result.total).toBe(1);
  expect(filterAdminDriveDirectory(rows,adminDriveDirectoryQuerySchema.parse({status:"CLOSED"}))).toMatchObject({total:2});
  expect(filterAdminDriveDirectory(rows,adminDriveDirectoryQuerySchema.parse({status:"ALL",page:5}))).toMatchObject({page:1,totalPages:1});
  expect(rows.map(r=>r.job)).toEqual(baseline);
  expect(adminDriveStatus({status:"PUBLISHED",applicationDeadline:new Date("2026-10-17T18:30:00.000Z")},new Date("2026-10-18T18:30:00.000Z"))).toBe("Open · Expired");
  expect(adminDriveStatus({status:"PUBLISHED",applicationDeadline:new Date("2026-10-19T18:30:00.000Z")},new Date("2026-10-18T18:30:00.000Z"))).toBe("Open");
 });
 it("SA-COMPANY-IDENTITIES-01 rejects claiming email hosts, college domains and malformed DNS input",()=>{
  expect(normalizeCompanyDomain(" Employee@WWW.Acme.Example ")).toBe("acme.example");
  for(const input of ["gmail.com","finance@outlook.com","yahoo.com","college.edu","college.ac.in","http://acme.example","@","a..com","com"," "]){
   expect(()=>normalizeCompanyDomain(input),input).toThrow();
  }
  expect(companyDomainCommandSchema.safeParse({companyId:uuid,action:"ADD",domain:"acme.example"}).success).toBe(true);
  expect(companyDomainCommandSchema.safeParse({companyId:uuid,action:"ADD",domain:"acme.example",foreignCollege:uuid}).success).toBe(false);
  expect(companyDomainCommandSchema.safeParse({companyId:uuid,action:"STEAL",domain:"acme.example"}).success).toBe(false);
 });
 it("SA-COMPANY-IDENTITIES-02 canonicalizes lookalike aliases and closes forged identity commands",()=>{
  expect(normalizeCompanyAlias("  ACME   Corporation   ")).toBe("ACME Corporation");
  for(const bad of [" ","a","x".repeat(161)]) expect(()=>normalizeCompanyAlias(bad),bad).toThrow();
  expect(companyAliasCommandSchema.safeParse({companyId:uuid,action:"REMOVE",alias:"Acme Corp"}).success).toBe(true);
  expect(companyAliasCommandSchema.safeParse({companyId:uuid,action:"REMOVE",alias:"Acme Corp",actorRole:"SUPER_ADMIN"}).success).toBe(false);
  expect(companyAliasCommandSchema.safeParse({companyId:uuid,action:"DELETE",alias:"Acme Corp"}).success).toBe(false);
 });
 it("SA-COMPANY-COLLEGE-01 fails closed on unknown relationship, missing confirmation and global/college mix-ups",()=>{
  expect(superAdminCollegeCompanyActionSchema.safeParse({relationshipId:uuid,action:"ARCHIVE",confirmed:true}).success).toBe(true);
  for(const bad of [
   {relationshipId:uuid,action:"ARCHIVE"},
   {relationshipId:uuid,action:"ARCHIVE",confirmed:false},
   {relationshipId:uuid,action:"PURGE",confirmed:true},
   {relationshipId:"../../test",action:"RESTORE",confirmed:true},
   {relationshipId:uuid,action:"RESTORE",confirmed:true,collegeId:uuid},
  ])expect(superAdminCollegeCompanyActionSchema.safeParse(bad).success).toBe(false);
  expect(canVerifyGlobalCompany(null)).toBe(true);
  expect(canVerifyGlobalCompany({collegeId:uuid})).toBe(false);
  expect(canVerifyGlobalCompany({organizationId:uuid})).toBe(false);
  expect(companyGlobalVerificationSchema.safeParse({companyId:uuid,verified:true}).success).toBe(true);
  expect(companyGlobalVerificationSchema.safeParse({companyId:uuid,verified:true,privateNotes:"x"}).success).toBe(false);
 });
 it("SA-HR-SEARCH-01 neutralizes SQL LIKE metacharacters and rejects duplicate/wrong-role recruiter filters",()=>{
  const pattern=superAdminHrLiteralSearchPattern("50%_\\test");
  expect(pattern).toBe("%50\\%\\_\\\\test%");
  expect(parseSuperAdminHrPageParams({status:"ACTIVE",page:"1",pageSize:"25"})).toMatchObject({status:"ACTIVE",page:1,pageSize:25});
  for(const raw of [{status:"SUSPENDED"},{page:"0"},{page:"-3"},{pageSize:"101"},{q:"a".repeat(121)},{q:["employee","other"]},{search:"hidden"},{collegeId:uuid}]){
   expect(parseSuperAdminHrPageParams(raw),JSON.stringify(raw)).toBeNull();
  }
 });
});
