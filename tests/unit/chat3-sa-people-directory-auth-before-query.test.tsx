import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const stubs = vi.hoisted(() => ({ context: vi.fn(), redirect: vi.fn(), read: vi.fn() }));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: stubs.context,
}));
vi.mock("next/navigation", () => ({
  redirect: stubs.redirect,
}));
vi.mock("@/modules/people/admin-user-directory-service", () => ({
  listSuperAdminUsers: stubs.read,
}));
import PeopleDirectory from "@/app/(authenticated)/admin/people/directory/page";

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
function context(role: "SUPER_ADMIN" | "FACULTY" | "MENTOR" | "LEARNER",
  disabled = false): RequestContext {
  return {
    user: {
      id: "33333333-3333-4333-8333-333333333333",
      identityUid: "actor", platformStatus: disabled ? "DISABLED" : "ACTIVE",
      systemRoles: role === "SUPER_ADMIN" ? ["SUPER_ADMIN"] : [],
    },
    membership: role === "SUPER_ADMIN" ? null : {
      id: "44444444-4444-4444-8444-444444444444",
      status: "ACTIVE", roles: [role], collegeId, organizationId,
    },
    adminScope: { collegeId, organizationId },
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  stubs.redirect.mockImplementation((target: string) => {
    throw new Error("REDIRECT:" + target);
  });
});
describe("SA3-PEOPLE-PREFLIGHT-01 directory auth before untrusted URL validation", () => {
  it("denies Faculty, Mentor, Learner and disabled Super Admin before touching malformed or pending filters", async () => {
    for (const principal of [
      context("FACULTY"), context("MENTOR"), context("LEARNER"), context("SUPER_ADMIN", true),
    ]) {
      stubs.context.mockResolvedValueOnce(principal);
      let reads = 0;
      const hostile = { then: (resolve: (value: unknown) => void) => {
        reads++;
        resolve({ page: ["1", "2"], collegeId });
      } };
      await expect(PeopleDirectory({
        searchParams: hostile as unknown as Promise<Record<string, string | string[] | undefined>>,
      })).rejects.toThrow("REDIRECT:/dashboard");
      expect(reads).toBe(0);
    }
    expect(stubs.read).not.toHaveBeenCalled();
    expect(stubs.redirect).toHaveBeenCalledTimes(4);
  });

  it("shows a recoverable filter error to an authorized Super Admin without querying people", async () => {
    stubs.context.mockResolvedValueOnce(context("SUPER_ADMIN"));
    const page = await PeopleDirectory({
      searchParams: Promise.resolve({ page: ["1", "2"] }),
    });
    expect(page).toBeDefined();
    expect(stubs.redirect).not.toHaveBeenCalled();
    expect(stubs.read).not.toHaveBeenCalled();
  });

  it("does not trust a forged platform scope in an otherwise active Faculty session", async () => {
    stubs.context.mockResolvedValueOnce(context("FACULTY"));
    await expect(PeopleDirectory({
      searchParams: Promise.resolve({ tab: "FACULTY" }),
    })).rejects.toThrow("REDIRECT:/dashboard");
    expect(stubs.read).not.toHaveBeenCalled();
  });
});
