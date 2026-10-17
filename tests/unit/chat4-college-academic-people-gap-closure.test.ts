import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {assertMutableMembershipTarget} from "@/modules/people/membership-protection";
import {PeopleServiceError} from "@/modules/people/errors";
import type {RequestContext} from "@/modules/identity/context";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-4 College academic and people gap closure",()=>{
 it("COL-academic-setup-R05 bounds semesters and mapping credits",async()=>{
  const {createCollegeSemesterSchema,canCreateSemesterTerm}=await import("@/modules/academics/semester-mutation-model");
  const {collegeTermCourseAddSchema}=await import("@/modules/academics/college-term-mapping-model");
  const id="40000000-0000-4000-8000-000000000001";
  const term={programId:id,termNumber:12,name:"Twelfth",totalCredits:null};
  expect(createCollegeSemesterSchema.safeParse(term).success).toBe(true);
  expect(createCollegeSemesterSchema.safeParse({...term,termNumber:13}).success).toBe(false);
  expect(canCreateSemesterTerm(13,24)).toBe(false);
  const mapping={programTermId:id,courseId:id,type:"CORE",credits:3};
  expect(collegeTermCourseAddSchema.safeParse(mapping).success).toBe(true);
  for(const credits of [null,0,11,1.5])expect(collegeTermCourseAddSchema.safeParse({...mapping,credits}).success).toBe(false);
 });
 it("COL-academic-setup-R02 archives offerings and blocks their access without deleting selection history",async()=>{
  const {electiveLifecyclePrompt}=await import("@/modules/electives/college-elective-lifecycle-model");
  expect(electiveLifecyclePrompt("Slot A","ARCHIVE")).toContain("All its offerings are archived; enrolled students lose access, history is kept.");
  const service=source("src/modules/electives/college-elective-lifecycle-service.ts");
  expect(service).toContain('eq(electiveOfferings.status,"ACTIVE")');
  expect(service).toContain('status:"ARCHIVED"');
  expect(service).toContain('eq(lmsGroups.kind,"ELECTIVE")');
  expect(service).toContain("archivedOfferings=archived.length");
  expect(service).not.toContain('throw new ElectiveLifecycleError("ELECTIVE_ACTIVE_OFFERINGS")');
  expect(service).not.toContain('throw new ElectiveLifecycleError("ELECTIVE_SELECTION_LOCKED")');
 });
 it("COL-academic-setup-R01 hides elective CRUD while the module is switched off",async()=>{
  const {resolveModuleAccessFromRules}=await import("@/modules/module-access/service");
  const chain=[{scopeType:"COLLEGE" as const,scopeId:"tenant"},
    {scopeType:"GLOBAL" as const,scopeId:null}];
  const disabled=resolveModuleAccessFromRules(chain,[
    {scopeType:"COLLEGE",scopeId:"tenant",module:"electives",enabled:false,locked:false},
  ]);
  expect(disabled.electives.enabled).toBe(false);
  expect(resolveModuleAccessFromRules(chain,[]).electives.enabled).toBe(true);
  const page=source("src/app/(authenticated)/college/electives/page.tsx");
  expect(page).toContain("Electives is turned off for this college");
  expect(page.indexOf("if(!moduleAccess.electives.enabled)")).toBeLessThan(page.indexOf("listCollegeElectives(context"));
  for(const file of [
   "src/modules/electives/college-slot-mutation-service.ts",
   "src/modules/electives/college-elective-lifecycle-service.ts",
   "src/modules/electives/service.ts",
  ])expect(source(file)).toContain("assertCollegeElectivesEnabled(context)");
 });
 it("COL-people-R01 guards live mentor projects, not teaching assignments",async()=>{
  const {mentorSuspensionMessage}=await import("@/modules/people/active-mentor-project-guard");
  expect(mentorSuspensionMessage(2)).toBe("Cannot suspend this faculty member: they mentor 2 active project workspace(s). Reassign those projects to another mentor first.");
  const repo=source("src/modules/people/repository.ts");
  const faculty=source("src/modules/people/college-faculty-lifecycle-service.ts");
  expect(repo).toContain('input.action==="SUSPEND"||input.action==="END"');
  expect(repo).toContain("activeMentorProjectCount(tx,membershipId)");
  expect(faculty).toContain('input.action==="DEACTIVATE"');
  expect(faculty).toContain("activeMentorProjectCount(tx,membershipId)");
  expect(faculty).not.toContain("if (teaching || advising)");
 });
 it("COL-people-R02 prevents self-lockout and protected College Admin/TPO mutations",()=>{
  const admin:RequestContext={user:{id:"actor",identityUid:"actor",platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:"actor-m",collegeId:"college",organizationId:"org",
      status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
  const target=(userId:string,roles:("FACULTY"|"COLLEGE_ADMIN"|"TPO")[])=>
    ({userId,roles});
  const deny=(t:ReturnType<typeof target>,action:"ROLE_ADD"|"ROLE_REMOVE"|"SUSPEND"|"REACTIVATE"|"END",role?:"COLLEGE_ADMIN"|"FACULTY")=>
    ()=>assertMutableMembershipTarget(admin,t,action,role);
  expect(deny(target("actor",["FACULTY"]),"SUSPEND")).toThrow("MEMBERSHIP_SELF_LOCKOUT");
  expect(deny(target("actor",["COLLEGE_ADMIN"]),"ROLE_REMOVE","COLLEGE_ADMIN"))
    .toThrow("MEMBERSHIP_SELF_LOCKOUT");
  for(const role of ["COLLEGE_ADMIN","TPO"] as const){
    expect(deny(target("other",[role]),"ROLE_ADD","FACULTY")).toThrow("MEMBERSHIP_PROTECTED");
    expect(deny(target("other",[role]),"END")).toThrow("MEMBERSHIP_PROTECTED");
    expect(deny(target("other",[role]),"REACTIVATE")).toThrow(PeopleServiceError);
  }
  expect(deny(target("faculty",["FACULTY"]),"SUSPEND")).not.toThrow();
  expect(deny(target("faculty",["FACULTY"]),"ROLE_ADD","FACULTY")).not.toThrow();
  const sa:RequestContext={...admin,user:{...admin.user,systemRoles:["SUPER_ADMIN"]}};
  expect(()=>assertMutableMembershipTarget(sa,target("other",["COLLEGE_ADMIN"]),"SUSPEND")).not.toThrow();
  const repository=source("src/modules/people/repository.ts");
  expect(repository).toContain('assertMutableMembershipTarget(mutation.context');
  const service=source("src/modules/people/membership-service.ts");
  expect(service).toContain("assertMutableMembershipTarget(context");
  expect(source("src/modules/people/college-faculty-lifecycle-service.ts"))
    .toContain("assertMutableMembershipTarget(context");
 });
 it("COL-academic-setup-R03 links the required academic-period setup from guides and empty states",()=>{
  const tabs=source("src/modules/people/college-legacy-tabs-model.ts");
  const guide=source("src/modules/admin-ui/admin-dashboard-navigation.ts");
  const batches=source("src/components/academics/college-cohort-management.tsx");
  const classes=source("src/components/academics/college-section-management.tsx");
  expect(tabs).toContain('{label:"Academic periods",href:"/college/academics"}');
  expect(guide).toContain('key: "academic-periods", href: "/college/academics"');
  expect(guide.indexOf('key: "academic-periods"')).toBeLessThan(guide.indexOf('key: "batches"'));
  for(const content of [batches,classes]){
   expect(content).toContain('<Link href="/college/academics"');
   expect(content).toContain("Set up academic periods");
  }
  expect(source("src/app/(authenticated)/college/academics/page.tsx")).toContain("<AcademicsOverview");
 });
});
