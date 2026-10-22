import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {adminUsersQuerySchema,adminUsersHref,adminUserDirectoryPaging,
  roleForPeopleTab} from "@/modules/people/admin-user-directory-model";
import {adminUsersExportQuerySchema,readSuperAdminPeopleExportParams,
  buildSuperAdminPeopleCsv,SUPER_ADMIN_PEOPLE_CSV_CAP}
  from "@/modules/people/admin-users-export-model";

const college="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const org="33333333-3333-4333-8333-333333333333";
const foreignOrg="44444444-4444-4444-8444-444444444444";
const superAdmin=():RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"super-admin",
    platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{organizationId:org,collegeId:college},
});

describe("chat-3 Super Admin Academics + People account journeys",()=>{
  it("SA-academics-people-01 selected college and organization both gate academic mutations",()=>{
    const ctx=superAdmin();
    expect(can(ctx,"academics.manage",{collegeId:college,organizationId:org})).toBe(true);
    expect(can(ctx,"academics.manage",{collegeId:foreign,organizationId:org})).toBe(false);
    expect(can(ctx,"academics.manage",{collegeId:college,organizationId:foreignOrg})).toBe(false);
    expect(can({...ctx,user:{...ctx.user,platformStatus:"DISABLED"}},
      "academics.manage",{collegeId:college,organizationId:org})).toBe(false);
    const faculty={...ctx,user:{...ctx.user,systemRoles:[] as const}};
    expect(can(faculty,"academics.manage",{collegeId:college,organizationId:org})).toBe(false);
  });

  it("SA-academics-people-02 query selectors are scoped and duplicates/role injection fail closed",()=>{
    expect(adminUsersQuerySchema.safeParse({
      tab:"FACULTY",role:"ALL",q:"  Alan  ",page:"2",
    })).toMatchObject({success:true});
    for(const raw of [
      {tab:["FACULTY","STUDENT"]},{collegeId:foreign},
      {page:"Infinity"},{page:"-1"},{page:"1.5"},
      {q:"x".repeat(101)},{membershipStatus:"DROP DATABASE"},
    ])expect(adminUsersQuerySchema.safeParse(raw).success).toBe(false);
    expect(roleForPeopleTab({tab:"FACULTY",role:"LEARNER"})).toBe("FACULTY");
    expect(roleForPeopleTab({tab:"STUDENT",role:"FACULTY"})).toBe("LEARNER");
    expect(roleForPeopleTab({tab:"ALL",role:"TPO"})).toBe("TPO");
    expect(adminUsersHref(adminUsersQuerySchema.parse({
      tab:"FACULTY",q:"A & B",page:2,
    }))).toBe("/admin/people/directory?tab=FACULTY&q=A+%26+B&page=2");
  });

  it("SA-academics-people-03 exports reject duplicate selectors and never trust a query supplied college",()=>{
    expect(readSuperAdminPeopleExportParams(new URLSearchParams("tab=FACULTY&q=Anu")))
      .toMatchObject({tab:"FACULTY",q:"Anu"});
    for(const text of [
      "role=FACULTY&role=LEARNER","collegeId="+foreign,
      "q="+encodeURIComponent("x".repeat(101)),"page=999",
    ]){
      expect(()=>readSuperAdminPeopleExportParams(new URLSearchParams(text)))
        .toThrow();
    }
    expect(adminUsersExportQuerySchema.safeParse({role:"MENTOR"}).success).toBe(true);
  });

  it("SA-academics-people-04 protects spreadsheet exports against formulas and personal contact leaks",()=>{
    const row={
      membershipId:college,displayName:"=HYPERLINK(\"evil\")",
      collegeName:"+College",platformStatus:"ACTIVE",membershipStatus:"ACTIVE",
      updatedAt:new Date("2026-10-18T10:00:00.000Z"),
      roles:["FACULTY"],email:"private@example.invalid",phoneE164:"+910000000000",
    };
    const csv=buildSuperAdminPeopleCsv([row],false);
    expect(csv).toContain('"\'=HYPERLINK(""evil"")"');
    expect(csv).toContain('"\'+College"');
    expect(csv).not.toContain("private@example.invalid");
    expect(csv).not.toContain("+910000000000");
    expect(csv).not.toContain("identityUid");
  });

  it("SA-academics-people-05 CSV caps large exports, declares truncation, clamps invalid deep page safely",()=>{
    const rows=Array.from({length:SUPER_ADMIN_PEOPLE_CSV_CAP+10},(_,i)=>({
      membershipId:"id"+i,displayName:"Student "+i,collegeName:"College",
      platformStatus:"ACTIVE",membershipStatus:"ACTIVE",roles:["LEARNER"],
      updatedAt:new Date("2026-10-18T10:00:00.000Z"),
    }));
    const csv=buildSuperAdminPeopleCsv(rows,true);
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).not.toContain("Student 509");
    const page=adminUserDirectoryPaging(1,100_000);
    expect(page).toMatchObject({page:1,totalPages:1,offset:0});
    expect(adminUserDirectoryPaging(0,1)).toMatchObject({
      page:1,totalPages:1,offset:0,
    });
  });

  it("SA-academics-people-06 Academics, People and recruiter compatibility pages keep scoped safe entrypoints",()=>{
    const academics=readFileSync("src/app/(authenticated)/admin/academics/page.tsx","utf8");
    const people=readFileSync("src/app/(authenticated)/admin/people/page.tsx","utf8");
    const recruiters=readFileSync("src/app/(authenticated)/admin/recruiters/page.tsx","utf8");
    expect(academics).toContain("context.adminScope?.collegeId ?? null");
    expect(academics.indexOf("if (!collegeId)"))
      .toBeLessThan(academics.indexOf("getAcademicsWorkspace("));
    expect(academics).toContain('if (!collegeId) redirect("/superadmin/dashboard")');
    expect(academics).toContain('title="Academic Setup"');
    expect(people).toContain("context.adminScope?.collegeId ?? null");
    expect(people.indexOf("if (!collegeId)"))
      .toBeLessThan(people.indexOf("listCollegePeopleWithRuntime("));
    expect(people).toContain("peoplePageState(");
    expect(recruiters).toContain('export { default } from "../hr/page"');
  });
});
