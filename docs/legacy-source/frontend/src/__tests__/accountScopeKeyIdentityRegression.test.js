/**
 * C-AU-02/09, C-PJ-02, C-PL-02, C-X08: frontend identity-key invariants.
 * These are MOCKED/LOCAL utility checks, not backend authorization evidence.
 */
import { accountScopeKey } from "@/utils/accountScopeKey";

const learner = () => ({
  id: 42,
  userType: "LEARNER",
  organizationId: 3,
  collegeId: 7,
  currentMembershipKey: "membership-A",
});

describe("accountScopeKey: cross-account and cross-tenant identity", () => {
  test.each([null, undefined, {}, { id: 42 }, { userType: "LEARNER" }])(
    "returns anonymous when a usable account is absent (%p)",
    (session) => expect(accountScopeKey(session)).toBe("anonymous")
  );

  test.each([
    ["account", { id: 43 }],
    ["role", { userType: "FACULTY" }],
    ["organization", { organizationId: 4 }],
    ["college", { collegeId: 8 }],
    ["membership", { currentMembershipKey: "membership-B" }],
    ["faculty type", { facultyType: "MENTOR" }],
  ])("changes the key when %s changes, even with the same record IDs", (_label, change) => {
    const session = learner();
    expect(accountScopeKey({ ...session, ...change })).not.toBe(accountScopeKey(session));
  });

  test("retains the same key when only unrelated display fields or object identity change", () => {
    const session = learner();
    expect(accountScopeKey({ ...session, firstName: "Renamed", avatarUrl: "avatar.png" }))
      .toBe(accountScopeKey(session));
  });

  test("uses the supported legacy organization and membership identifiers when modern fields are absent", () => {
    const session = learner();
    const legacy = {
      id: session.id,
      userType: session.userType,
      orgId: session.organizationId,
      collegeId: session.collegeId,
      membershipKey: session.currentMembershipKey,
    };
    expect(accountScopeKey(legacy)).toBe(accountScopeKey(session));
    expect(accountScopeKey({ ...legacy, orgId: 4 })).not.toBe(accountScopeKey(session));
    expect(accountScopeKey({ ...legacy, membershipKey: "membership-B" })).not.toBe(accountScopeKey(session));
  });

  test("distinguishes a real numeric zero ID from an absent identity", () => {
    expect(accountScopeKey({ ...learner(), id: 0 })).not.toBe("anonymous");
    expect(accountScopeKey({ ...learner(), id: 0 })).not.toBe(accountScopeKey(learner()));
  });
});
