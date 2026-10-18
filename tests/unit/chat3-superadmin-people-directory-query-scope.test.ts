import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  selects: 0,
  scope: null as { sql: string; params: unknown[] } | null,
  emailMask: null as { sql: string; params: unknown[] } | null,
  phoneMask: null as { sql: string; params: unknown[] } | null,
  count: 0,
  offset: -1,
  rows: [] as Array<Record<string, unknown>>,
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: (projection?: Record<string, unknown>) => {
      state.selects++;
      const dialect = new PgDialect();
      if (projection && "displayName" in projection && "membershipId" in projection) {
        const email = projection.email as { sql: SQL };
        const phone = projection.phoneE164 as { sql: SQL };
        state.emailMask = dialect.sqlToQuery(email.sql);
        state.phoneMask = dialect.sqlToQuery(phone.sql);
        const source = {
          innerJoin: () => source,
          where: (expression: SQL | undefined) => {
            state.scope = expression ? dialect.sqlToQuery(expression) : null;
            return source;
          },
          as: () => ({
            displayName: projection.displayName,
            membershipId: projection.membershipId,
          }),
        };
        return { from: () => source };
      }
      if (projection && "n" in projection) {
        return { from: async () => [{ n: state.count }] };
      }
      if (projection && "role" in projection) {
        return { from: () => ({ where: async () => [] }) };
      }
      return {
        from: () => ({
          orderBy: () => ({
            limit: (size: number) => ({
              offset: async (offset: number) => {
                state.offset = offset;
                return state.rows.slice(offset, offset + size);
              },
            }),
          }),
        }),
      };
    },
  }),
}));
import { listSuperAdminUsers } from "@/modules/people/admin-user-directory-service";

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
function actor(): RequestContext {
  return {
    user: {
      id: "33333333-3333-4333-8333-333333333333",
      identityUid: "super", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"],
    },
    membership: null, adminScope: null,
  };
}
beforeEach(() => {
  state.selects = 0;
  state.scope = null;
  state.emailMask = null;
  state.phoneMask = null;
  state.count = 0;
  state.offset = -1;
  state.rows = [];
});

describe("SA-PEOPLE-SQL-01 Super Admin People source-side scope and contact privacy", () => {
  it("masks both email and phone in the actual SQL projection when browsing globally", async () => {
    const result = await listSuperAdminUsers(actor(), {});
    expect(result.contactVisible).toBe(false);
    expect(result.items).toEqual([]);
    expect(state.emailMask?.sql).toContain("case when");
    expect(state.emailMask?.sql).toContain("null::text");
    expect(state.emailMask?.params).toContain(false);
    expect(state.phoneMask?.sql).toContain("null::text");
    expect(state.phoneMask?.params).toContain(false);
  });

  it("selects both exact organization and college scopes before allowing administrative contact data", async () => {
    const selected: RequestContext = {
      ...actor(), adminScope: { collegeId, organizationId },
    };
    const result = await listSuperAdminUsers(selected, {});
    expect(result.contactVisible).toBe(true);
    expect(state.scope?.params).toContain(collegeId);
    expect(state.scope?.params).toContain(organizationId);
    expect(state.emailMask?.params).toContain(true);
    expect(state.phoneMask?.params).toContain(true);
  });

  it("rejects a disabled Super Admin, Faculty, Learner or Mentor before database reads", async () => {
    const candidates: RequestContext[] = [
      { ...actor(), user: { ...actor().user, platformStatus: "DISABLED" } },
      { ...actor(), user: { ...actor().user, systemRoles: [] },
        membership: { id: "m", collegeId, organizationId,
          roles: ["FACULTY"], status: "ACTIVE" } },
      { ...actor(), user: { ...actor().user, systemRoles: [] },
        membership: { id: "m", collegeId, organizationId,
          roles: ["LEARNER"], status: "ACTIVE" } },
      { ...actor(), user: { ...actor().user, systemRoles: [] },
        membership: { id: "m", collegeId, organizationId,
          roles: ["MENTOR"], status: "ACTIVE" } },
    ];
    for (const candidate of candidates) {
      await expect(listSuperAdminUsers(candidate, {}))
        .rejects.toThrow("Missing permission: people.manage");
    }
    expect(state.selects).toBe(0);
  });

  it("does not coerce a forged URL college selector or malformed filters into a wider query", async () => {
    for (const filter of [
      { collegeId }, { q: "x".repeat(101) }, { page: -1 },
      { tab: ["FACULTY", "STUDENT"] }, { platformStatus: "ROOT" },
    ]) {
      await expect(listSuperAdminUsers(actor(), filter)).rejects.toThrow();
    }
    expect(state.selects).toBe(0);
  });
});
