import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { canAccessFacultyRoute } from "@/modules/courses/faculty-route-access-model";

function actor(roles: RequestContext["membership"] extends never ? never : Array<"FACULTY"|"LEARNER"|"MENTOR"|"COLLEGE_ADMIN">): RequestContext {
  return {
    user: { id:"user", identityUid:"identity", platformStatus:"ACTIVE", systemRoles:[] },
    membership: {
      id:"member", collegeId:"college", organizationId:"organization", status:"ACTIVE", roles,
    },
  };
}

describe("Faculty-only /teacher route boundary", () => {
  it("allows a current Faculty teaching member", () => {
    expect(canAccessFacultyRoute(actor(["FACULTY"]))).toBe(true);
  });
  it("does not allow learner, mentor or college admin role substitution", () => {
    for (const role of ["LEARNER","MENTOR","COLLEGE_ADMIN"] as const) {
      expect(canAccessFacultyRoute(actor([role]))).toBe(false);
    }
  });
  it("rejects inactive, disabled, empty and missing membership contexts", () => {
    const faculty=actor(["FACULTY"]);
    expect(canAccessFacultyRoute({...faculty,user:{...faculty.user,platformStatus:"DISABLED"}})).toBe(false);
    expect(canAccessFacultyRoute({...faculty,membership:{...faculty.membership!,status:"SUSPENDED"}})).toBe(false);
    expect(canAccessFacultyRoute({...faculty,membership:null})).toBe(false);
    expect(canAccessFacultyRoute(undefined)).toBe(false);
  });
});
