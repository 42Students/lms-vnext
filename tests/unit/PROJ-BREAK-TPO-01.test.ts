import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";

const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),select:vi.fn(),college:vi.fn(),moduleAccess:vi.fn(),
 rows:[] as unknown[][],
}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/projects/scope",()=>({loadProjectCollegeScope:mocks.college}));
vi.mock("@/modules/module-access/service",()=>({resolveOptionalModuleAccess:mocks.moduleAccess}));
import {requireProjectReadAccess,requireProjectManageAccess,requireProjectLifecycleAccess}
 from "@/modules/projects/access";

const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const org="33333333-3333-4333-8333-333333333333";
const otherOrg="44444444-4444-4444-8444-444444444444";
const actor=(roles:("TPO"|"COLLEGE_ADMIN"|"MENTOR"|"LEARNER")[],opts:{
 status?:"ACTIVE"|"SUSPENDED";platform?:"ACTIVE"|"DISABLED";collegeId?:string;orgId?:string;superAdmin?:boolean;
}={}):RequestContext=>({
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"actor",platformStatus:opts.platform??"ACTIVE",systemRoles:opts.superAdmin?["SUPER_ADMIN"]:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",collegeId:opts.collegeId??college,organizationId:opts.orgId??org,status:opts.status??"ACTIVE",roles},
});
const PROJECT="77777777-7777-4777-8777-777777777777";
const COLLEGE=college, ORG=org, FOREIGN=other;
const tpo=(overrides:Partial<RequestContext>={}):RequestContext=>({
 ...actor(["TPO"]),...overrides,
});
const query=(rows:unknown[])=>({from(){return this;},where(){return this;},
 innerJoin(){return this;},limit(){return Promise.resolve(rows);}});

describe("PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}],[]];
  mocks.select.mockImplementation(()=>query(mocks.rows.shift()??[]));
  mocks.getDb.mockReturnValue({select:mocks.select});
  mocks.college.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mocks.moduleAccess.mockResolvedValue({projects:{enabled:true}});
 });
 it("TPO student-directory permission does not expose unassigned project workspace",async()=>{
  const context=tpo();
  await expect(requireProjectReadAccess(context,PROJECT)).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(can(context,"projects.manage",{organizationId:ORG,collegeId:COLLEGE})).toBe(false);
  expect(mocks.select).toHaveBeenCalledTimes(2);
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("a forged membership claim for mentor role cannot bypass persisted membership role check",async()=>{
  mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}],[{
   id:"member",role:"MENTOR",roleKind:"MENTOR",canMutate:true,isPrimary:true,
  }]];
  await expect(requireProjectReadAccess(tpo(),PROJECT)).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("foreign college and foreign organization cannot infer assigned project-membership records",async()=>{
  for(const member of [
   {...tpo().membership!,collegeId:FOREIGN},
   {...tpo().membership!,organizationId:FOREIGN,collegeId:COLLEGE},
   {...tpo().membership!,organizationId:FOREIGN,collegeId:FOREIGN},
  ]){
   mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}]];
   await expect(requireProjectReadAccess(tpo({membership:member}),PROJECT))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(mocks.select).toHaveBeenCalledTimes(3);
 });
 it("PROJ-BREAK-TPO-02 denies projects and placement data from any wrong college OR organization",()=>{
  const tpo=actor(["TPO"]);
  for(const scope of [
   {collegeId:other,organizationId:org},
   {collegeId:college,organizationId:otherOrg},
   {collegeId:other,organizationId:otherOrg},
  ])for(const permission of ["projects.read","projects.manage","placements.read","placements.manage"] as const)
   expect(can(tpo,permission,scope),JSON.stringify({scope,permission})).toBe(false);
 });
 it("PROJ-BREAK-TPO-03 suspended, disabled or missing memberships cannot view or manage Project data",()=>{
  const valid={collegeId:college,organizationId:org};
  for(const tpo of [actor(["TPO"],{status:"SUSPENDED"}),actor(["TPO"],{platform:"DISABLED"}),
   {...actor(["TPO"]),membership:null}]){
   for(const permission of ["projects.read","projects.manage","placements.read","placements.manage"] as const)
    expect(can(tpo,permission,valid)).toBe(false);
  }
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("repeated stale-tab lifecycle and manage mutations are refused regardless of a known project ID",async()=>{
  for(let attempt=0;attempt<3;attempt++){
   mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}]];
   await expect(requireProjectManageAccess(tpo(),PROJECT))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}],[]];
   await expect(requireProjectLifecycleAccess(tpo(),PROJECT))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("rejects non-UUID and nonexistent IDs without granting a guessed record",async()=>{
  await expect(requireProjectReadAccess(tpo(),"../another-college")).rejects.toBeDefined();
  mocks.rows=[[]];
  await expect(requireProjectReadAccess(tpo(),PROJECT)).rejects.toMatchObject({code:"PROJECT_NOT_FOUND"});
 });
});

describe("PROJ-BREAK-TPO-02 truthful self-reported portfolio counts",()=>{
 it("separates learner-owned profile entries from canonical Projects grading and workspace status",async()=>{
  const {readFileSync}=await import("node:fs");
  const {resolve}=await import("node:path");
  const grid=readFileSync(resolve(process.cwd(),"src/components/tpo/tpo-students-spreadsheet.tsx"),"utf8");
  const page=readFileSync(resolve(process.cwd(),"src/app/(authenticated)/tpo/students/page.tsx"),"utf8");
  expect(grid).toContain('key:"projects",label:"Profile projects (self-reported)"');
  expect(page).toContain('["minProjects","Profile project entries (self-reported)"]');
  expect(grid).not.toContain('key:"projects",label:"Verified Projects"');
  const {tpoStudentProfileFacts}=await import("@/modules/placements/tpo-student-profile-facts");
  const facts=tpoStudentProfileFacts({projects:[{title:"Claim without approval"},
    {title:"Unreviewed private assignment"}],contactDetails:{phone:"+91-9000099999"}});
  expect(facts.projects).toBe(2);
  expect(JSON.stringify(facts)).not.toContain("Claim without approval");
  expect(JSON.stringify(facts)).not.toContain("Unreviewed private assignment");
  expect(facts.phoneMasked).toBe("••••9999");
 });
});

describe("PROJ-BREAK-TPO-03 malicious learner profile links",()=>{
 it("never counts rejected Javascript, credential-bearing or plain HTTP URLs as a valid portfolio link",async()=>{
  const {tpoStudentProfileFacts}=await import("@/modules/placements/tpo-student-profile-facts");
  const unsafe=tpoStudentProfileFacts({socialProfiles:{
   githubUrl:"javascript:alert(1)",linkedinUrl:"http://insecure.example",
   portfolioUrl:"https://user:password@example.com/secret",
  }});
  expect(unsafe.links).toBe(false);
  expect(unsafe.github).toBeNull();
  expect(unsafe.linkedIn).toBeNull();
  expect(unsafe.portfolio).toBeNull();
  const valid=tpoStudentProfileFacts({socialProfiles:{
   githubUrl:"https://github.com/example",
  }});
  expect(valid.links).toBe(true);
  expect(valid.github).toBe("https://github.com/example");
 });
});
