import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { mayRecordCollegeAdminDeliveryLock } from "@/modules/projects/admin-submission-lock-policy";
import { canAdminSettleDelivery } from "@/modules/projects/admin-submission-review-model";

const collegeId = "00000000-0000-4000-8000-000000000010";
const otherCollege = "00000000-0000-4000-8000-000000000011";
const organizationId = "00000000-0000-4000-8000-000000000020";
const otherOrganization = "00000000-0000-4000-8000-000000000021";
const actor = (): RequestContext => ({
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    identityUid: "test-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "00000000-0000-4000-8000-000000000002",
    collegeId,
    organizationId,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
});
describe("IIT Dharwad Projects: College Admin access and lifecycle breaker", () => {
  it("PROJ-BREAK-idor-20 persists exact membership scope rather than trusting Super Admin selection", () => {
    const current=actor();
    expect(mayRecordCollegeAdminDeliveryLock(current,collegeId,organizationId)).toBe(true);
    expect(mayRecordCollegeAdminDeliveryLock(current,otherCollege,organizationId)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock(current,collegeId,otherOrganization)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock(
      { ...current, adminScope: { collegeId: otherCollege, organizationId } },
      otherCollege,organizationId,
    )).toBe(false);
  });

  it("PROJ-BREAK-idor-21 deactivated, suspended or removed admins cannot issue membership-bound locks", () => {
    const current=actor();
    expect(mayRecordCollegeAdminDeliveryLock({ ...current, membership:null },collegeId,organizationId)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock({
      ...current,user:{ ...current.user,platformStatus:"DISABLED" },
    },collegeId,organizationId)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock({
      ...current,membership:{ ...current.membership!,status:"SUSPENDED" },
    },collegeId,organizationId)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock({
      ...current,membership:{ ...current.membership!,roles:["MENTOR"] },
    },collegeId,organizationId)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock({
      ...current,user:{ ...current.user,systemRoles:["SUPER_ADMIN"] },membership:null,
      adminScope:{collegeId,organizationId},
    },collegeId,organizationId)).toBe(false);
  });

  it("PROJ-BREAK-state-20 no review or lock can revive completed or archived projects", () => {
    for (const projectStatus of ["PLANNED","COMPLETED","ARCHIVED","DELETED","", "__proto__"]) {
      for (const status of ["DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED","LOCKED"]) {
        for (const action of ["APPROVED","CHANGES_REQUESTED","LOCK"] as const) {
          expect(canAdminSettleDelivery(status,false,projectStatus,action),
            JSON.stringify({status,projectStatus,action})).toBe(false);
        }
      }
    }
    expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","APPROVED")).toBe(true);
    expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","CHANGES_REQUESTED")).toBe(true);
    expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","LOCK")).toBe(true);
    expect(canAdminSettleDelivery("APPROVED",true,"ACTIVE","LOCK")).toBe(false);
  });
});
