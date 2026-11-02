import { describe, expect, it } from "vitest";
import {
  adminScopeOutOfSync,
  decodeAdminScopeCookie,
  encodeAdminScopeCookie,
  inspectAdminScopeCookie,
  restoreVerifiedAdminScope,
} from "@/auth/admin-scope";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COLLEGE = "22222222-2222-4222-8222-222222222222";
const OTHER_COLLEGE = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("Phase 3: admin scope cookie is a strict, untrusted hint", () => {
  describe("decode accepts exactly two shapes", () => {
    it("organization:<uuid>", () => {
      expect(decodeAdminScopeCookie(`organization:${ORG}`)).toEqual({ organizationId: ORG, collegeId: null });
    });
    it("college:<uuid>:<uuid>", () => {
      expect(decodeAdminScopeCookie(`college:${ORG}:${COLLEGE}`)).toEqual({ organizationId: ORG, collegeId: COLLEGE });
    });
  });

  describe("decode rejects every tampered shape", () => {
    const hostile: Array<[string, string | null | undefined]> = [
      ["empty", ""],
      ["null", null],
      ["undefined", undefined],
      ["unknown kind", `region:${ORG}`],
      ["role injection", `superadmin:${ORG}`],
      ["organization with extra segment", `organization:${ORG}:${COLLEGE}`],
      ["college with one id", `college:${ORG}`],
      ["college with a third id", `college:${ORG}:${COLLEGE}:${OTHER_COLLEGE}`],
      ["non-uuid organization", "organization:not-a-uuid"],
      ["non-uuid college", `college:${ORG}:1 OR 1=1`],
      ["sql fragment", `college:${ORG}:${COLLEGE}'; DROP TABLE colleges;--`],
      ["leading space", ` organization:${ORG}`],
      ["trailing newline", `organization:${ORG}\n`],
      ["null byte", `organization:${ORG}\u0000`],
      ["uppercase kind", `ORGANIZATION:${ORG}`],
      ["separator only", ":"],
      ["json", JSON.stringify({ organizationId: ORG, collegeId: COLLEGE })],
      ["very long", "college:" + "a".repeat(10_000)],
      ["wildcard", "college:*:*"],
      ["empty organization", "organization:"],
    ];
    for (const [name, value] of hostile) {
      it(`rejects ${name}`, () => {
        expect(decodeAdminScopeCookie(value)).toBeNull();
      });
    }
  });

  describe("encode never emits a value decode would misread", () => {
    it("round-trips both valid shapes", () => {
      for (const scope of [
        { organizationId: ORG, collegeId: null },
        { organizationId: ORG, collegeId: COLLEGE },
      ]) {
        expect(decodeAdminScopeCookie(encodeAdminScopeCookie(scope))).toEqual(scope);
      }
    });
    it("emits nothing for a college without an organization, so a half scope is never stored", () => {
      expect(encodeAdminScopeCookie({ organizationId: null, collegeId: COLLEGE })).toBe("");
      expect(encodeAdminScopeCookie({ organizationId: null, collegeId: null })).toBe("");
    });
  });

  describe("inspect flags a malformed cookie without trusting it", () => {
    it("treats absence as fine and garbage as malformed", () => {
      expect(inspectAdminScopeCookie(undefined)).toEqual({ scope: null, malformed: false });
      expect(inspectAdminScopeCookie("garbage")).toEqual({ scope: null, malformed: true });
      expect(inspectAdminScopeCookie(`organization:${ORG}`).malformed).toBe(false);
    });
  });

  describe("a stale or forged cookie cannot widen the effective scope", () => {
    const permitted = [
      { organizationId: ORG, collegeId: null },
      { organizationId: ORG, collegeId: COLLEGE },
    ];
    it("restores a requested scope only when the server lists it as permitted", () => {
      expect(restoreVerifiedAdminScope(`college:${ORG}:${COLLEGE}`, permitted)).toEqual({ organizationId: ORG, collegeId: COLLEGE });
    });
    it("refuses a well-formed scope for a college the caller was never granted", () => {
      expect(restoreVerifiedAdminScope(`college:${ORG}:${OTHER_COLLEGE}`, permitted)).toBeNull();
    });
    it("refuses a well-formed scope for another organization", () => {
      expect(restoreVerifiedAdminScope(`organization:${OTHER_ORG}`, permitted)).toBeNull();
      expect(restoreVerifiedAdminScope(`college:${OTHER_ORG}:${COLLEGE}`, permitted)).toBeNull();
    });
    it("refuses everything when the permitted list is empty", () => {
      expect(restoreVerifiedAdminScope(`organization:${ORG}`, [])).toBeNull();
    });
    it("refuses a malformed cookie even when permitted scopes exist", () => {
      expect(restoreVerifiedAdminScope("college:oops", permitted)).toBeNull();
    });
  });

  describe("out-of-sync detection surfaces a stale display", () => {
    it("is quiet only when both sides agree", () => {
      expect(adminScopeOutOfSync(null, null)).toBe(false);
      expect(adminScopeOutOfSync({ organizationId: ORG, collegeId: COLLEGE }, { organizationId: ORG, collegeId: COLLEGE })).toBe(false);
    });
    it("flags a different college, a different organization, or a one-sided scope", () => {
      const shown = { organizationId: ORG, collegeId: COLLEGE };
      expect(adminScopeOutOfSync(shown, { organizationId: ORG, collegeId: OTHER_COLLEGE })).toBe(true);
      expect(adminScopeOutOfSync(shown, { organizationId: OTHER_ORG, collegeId: COLLEGE })).toBe(true);
      expect(adminScopeOutOfSync(shown, null)).toBe(true);
      expect(adminScopeOutOfSync(null, shown)).toBe(true);
    });
  });
});
