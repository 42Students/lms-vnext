import { beforeEach, describe, expect, it, vi } from "vitest";
import { lookupCollegeStudentPlacement } from "@/modules/placements/college-placement-student-lookup-service";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
  getDb:vi.fn(),
  requireCollegePlacementAdmin:vi.fn(),
}));

vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/college-drive-read-service",()=>({
  requireCollegePlacementAdmin:mocks.requireCollegePlacementAdmin,
}));

/** Mimic Drizzle's fluent and thenable select without a PostgreSQL runtime. */
class SelectRows<T> implements PromiseLike<readonly T[]> {
  constructor(private readonly rows:readonly T[]){}
  from(){return this;}
  innerJoin(){return this;}
  leftJoin(){return this;}
  where(){return this;}
  orderBy(){return this;}
  limit(cap:number){return Promise.resolve(this.rows.slice(0,cap));}
  then<TResult1=readonly T[],TResult2=never>(
    onfulfilled?:((value:readonly T[])=>TResult1|PromiseLike<TResult1>)|null,
    onrejected?:((reason:unknown)=>TResult2|PromiseLike<TResult2>)|null,
  ):Promise<TResult1|TResult2>{
    return Promise.resolve(this.rows).then(onfulfilled,onrejected);
  }
}

const admin:RequestContext={
  user:{id:"super-admin",identityUid:"id-super-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  adminScope:{organizationId:"org-a",collegeId:"college-a"},
  membership:null,
};

describe("Super Admin placement lookup — real service orchestration of bounded rows",()=>{
  beforeEach(()=>{
    mocks.getDb.mockReset();
    mocks.requireCollegePlacementAdmin.mockReset().mockResolvedValue("college-a");
  });

  it("SA-STUDENT-LOOKUP-PLACED-04 preserves joined history beyond the visible cap and excludes a 16th learner",async()=>{
    const people=Array.from({length:16},(_,index)=>({
      membershipId:"learner-"+index,name:"Learner "+index,
      roll:"R"+index,email:"learner"+index+"@example.test",
    }));
    const details=Array.from({length:101},(_,index)=>({
      jobId:"job-"+index,job:"Graduate Engineer",
      company:"Example",submittedAt:new Date("2099-01-01T00:00:00.000Z"),
      applicationStatus:"SUBMITTED",offerStatus:null,joining:null,
    }));
    const select=vi.fn((fields:Record<string,unknown>)=>new SelectRows(
      "jobId" in fields?details:people,
    ));
    const selectDistinct=vi.fn(()=>new SelectRows([
      {membershipId:people[0]!.membershipId},
    ]));
    mocks.getDb.mockReturnValue({select,selectDistinct});

    const result=await lookupCollegeStudentPlacement(admin,"Learner");
    expect(result.students).toHaveLength(15);
    expect(result.truncated).toBe(true);
    expect(result.students.map(student=>student.membershipId)).not.toContain(people[15]?.membershipId);
    expect(result.students[0]?.placed).toBe(true);
    expect(result.students[0]?.applications).toHaveLength(100);
    expect(result.students[0]?.truncated).toBe(true);
    expect(result.students[1]?.placed).toBe(false);
    expect(selectDistinct).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledTimes(16);
    expect(mocks.requireCollegePlacementAdmin).toHaveBeenCalledWith(admin);
  });

  it("SA-STUDENT-LOOKUP-CAP-04 does not warn for exactly 15 learners or 100 application records",async()=>{
    const people=Array.from({length:15},(_,index)=>({
      membershipId:"learner-"+index,name:"Learner "+index,
      roll:"R"+index,email:"learner"+index+"@example.test",
    }));
    const details=Array.from({length:100},(_,index)=>({
      jobId:"job-"+index,job:"Graduate Engineer",
      company:"Example",submittedAt:new Date("2099-01-01T00:00:00.000Z"),
      applicationStatus:"SUBMITTED",offerStatus:null,joining:null,
    }));
    const select=vi.fn((fields:Record<string,unknown>)=>new SelectRows(
      "jobId" in fields?details:people,
    ));
    mocks.getDb.mockReturnValue({
      select,
      selectDistinct:vi.fn(()=>new SelectRows([] as {membershipId:string}[])),
    });
    const result=await lookupCollegeStudentPlacement(admin,"Learner");
    expect(result.students).toHaveLength(15);
    expect(result.truncated).toBe(false);
    expect(result.students.every(student=>!student.truncated&&!student.placed)).toBe(true);
    expect(result.students.every(student=>student.applications.length===100)).toBe(true);
  });

  it("SA-STUDENT-LOOKUP-ROLE-05 refuses invalid search and revoked actor before any personal data read",async()=>{
    await expect(lookupCollegeStudentPlacement(admin,"x")).rejects.toThrow();
    expect(mocks.requireCollegePlacementAdmin).not.toHaveBeenCalled();
    expect(mocks.getDb).not.toHaveBeenCalled();

    mocks.requireCollegePlacementAdmin.mockRejectedValueOnce(new Error("FORBIDDEN"));
    await expect(lookupCollegeStudentPlacement(admin,"Alice")).rejects.toThrow("FORBIDDEN");
    expect(mocks.requireCollegePlacementAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
});
