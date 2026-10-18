import { describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { can, AuthorizationError } from "@/modules/permissions/policy";
import {
  parseSuperAdminLectureHallFilters,
  superAdminLectureHallHref,
  superAdminLectureHallPages,
} from "@/modules/academics/super-admin-lecture-hall-directory-model";
import {
  collegeHallAvailabilityProjection,
  collegeHallAvailabilitySchema,
  istWindow,
} from "@/modules/academics/college-hall-availability-model";

vi.mock("server-only", () => ({}));
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";

const COLLEGE_A = "11111111-1111-4111-8111-111111111111";
const COLLEGE_B = "22222222-2222-4222-8222-222222222222";
const ORG_A = "33333333-3333-4333-8333-333333333333";
const ORG_B = "44444444-4444-4444-8444-444444444444";

function actor({
  role = "SUPER_ADMIN",
  status = "ACTIVE",
  selectedCollege = COLLEGE_A,
  selectedOrg = ORG_A,
}: {
  role?: "SUPER_ADMIN" | "COLLEGE_ADMIN" | "LEARNER";
  status?: "ACTIVE" | "DISABLED";
  selectedCollege?: string | null;
  selectedOrg?: string | null;
} = {}): RequestContext {
  return {
    user: {
      id: "actor-a", identityUid: "actor-a", platformStatus: status,
      systemRoles: role === "SUPER_ADMIN" ? ["SUPER_ADMIN"] : [],
    },
    membership: role === "SUPER_ADMIN" ? null : {
      id: "membership-a", collegeId: COLLEGE_A, organizationId: ORG_A,
      status: "ACTIVE", roles: [role],
    },
    adminScope: { collegeId: selectedCollege, organizationId: selectedOrg },
  };
}

describe("/admin second third: selected college academic and operations boundaries", () => {
  it("CHAT6-ADMIN-LECTURES-01 refuses forged, repeated, and inverted hall search controls", () => {
    expect(parseSuperAdminLectureHallFilters({status:"ACTIVE",roomType:"LAB",page:"2",pageSize:"25",minimumCapacity:"20",maximumCapacity:"40"}))
      .toMatchObject({status:"ACTIVE",roomType:"LAB",page:2,pageSize:25,minimumCapacity:20,maximumCapacity:40});
    for(const bad of [
      {collegeId:COLLEGE_B},{organizationId:ORG_B},{status:"DELETED"},{page:["1","2"]},
      {page:"0"},{page:"1001"},{pageSize:"500"},{minimumCapacity:"100",maximumCapacity:"20"},
      {departmentId:"forged"},{roomType:"UNSAFE"},{q:"x".repeat(101)},
    ]) expect(parseSuperAdminLectureHallFilters(bad),JSON.stringify(bad)).toBeNull();
    const valid = parseSuperAdminLectureHallFilters({q:" A & B ",status:"ARCHIVED",page:"3",pageSize:"50"});
    if(!valid)throw new Error("Expected valid hall query");
    const url=new URL(superAdminLectureHallHref(valid),"https://platform.example.edu");
    expect(url.pathname).toBe("/admin/lecture-halls");
    expect(url.searchParams.get("q")).toBe("A & B");
    expect(url.searchParams.get("collegeId")).toBeNull();
    expect(url.searchParams.get("page")).toBe("3");
    expect(superAdminLectureHallPages(51,25)).toBe(3);
    expect(superAdminLectureHallPages(0,25)).toBe(1);
  });

  it("CHAT6-ADMIN-LECTURES-02 rejects invalid IST date spans, impossible days and forged hall IDs", () => {
    const good={hallId:COLLEGE_A,from:"2026-10-19",to:"2026-11-18"};
    expect(collegeHallAvailabilitySchema.safeParse(good).success).toBe(true);
    const start=istWindow("2026-10-19","2026-10-19");
    expect(start.endExclusive.getTime()-start.start.getTime()).toBe(86_400_000);
    expect(start.start.toISOString()).toBe("2026-10-18T18:30:00.000Z");
    for(const bad of [
      {to:"2026-11-19"},{from:"2026-10-20",to:"2026-10-19"},
      {from:"2026-02-30"},{to:"not-a-date"},{hallId:"other-college"},
      {collegeId:COLLEGE_B},
    ]) expect(collegeHallAvailabilitySchema.safeParse({...good,...bad}).success,JSON.stringify(bad)).toBe(false);
  });

  it("CHAT6-ADMIN-LECTURES-03 detects identical and partial hall booking overlaps without treating unknown capacity as zero", () => {
    const when=(minute:number)=>new Date(Date.UTC(2099,0,1,8,minute));
    const rows=[
      {id:"a",sectionId:"1",sectionName:"A",title:"Physics",startsAt:when(0),endsAt:when(30),sectionCapacity:51},
      {id:"b",sectionId:"2",sectionName:"B",title:"Math",startsAt:when(0),endsAt:when(10),sectionCapacity:null},
      {id:"c",sectionId:"3",sectionName:"C",title:"Chemistry",startsAt:when(30),endsAt:when(40),sectionCapacity:20},
    ];
    const projected=collegeHallAvailabilityProjection(50,rows);
    expect(projected.find(row=>row.id==="a")).toMatchObject({hasConflict:true,overConfiguredCapacity:true,overlapsAnother:true});
    expect(projected.find(row=>row.id==="b")).toMatchObject({hasConflict:true,overConfiguredCapacity:false,overlapsAnother:true});
    expect(projected.find(row=>row.id==="c")).toMatchObject({hasConflict:false,overlapsAnother:false});
  });

  it("CHAT6-ADMIN-SCOPE-01 requires an active Super Admin with explicit college for protected write pages", () => {
    const selected=actor();
    expect(requireSuperAdminSelectedCollege(selected,"academics.manage")).toEqual({
      collegeId:COLLEGE_A,organizationId:ORG_A,
    });
    for(const ctx of [
      actor({selectedCollege:null}),actor({role:"COLLEGE_ADMIN"}),actor({role:"LEARNER"}),
      actor({status:"DISABLED"}),
    ])expect(()=>requireSuperAdminSelectedCollege(ctx,"academics.manage")).toThrow(AuthorizationError);
    expect(can(selected,"academics.manage",{collegeId:COLLEGE_B,organizationId:ORG_A})).toBe(false);
    expect(can(selected,"placements.manage",{collegeId:COLLEGE_A,organizationId:ORG_B})).toBe(false);
    expect(can(actor({selectedOrg:ORG_B}),"projects.manage",{collegeId:COLLEGE_A,organizationId:ORG_A})).toBe(false);
  });
});
